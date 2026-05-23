#!/usr/bin/env node
// Cascade — 多供应商 AI 编程 Harness
// 一行命令让中国开发者用任何国产模型驱动任何 AI 编程工具
import http from 'http';
import https from 'https';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { acceptKey, encodeFrame, encodePing, decodeFrame } from './lib/ws-frame.mjs';
import { buildRequestBody, streamTranslate } from './lib/translate.mjs';
import { resolveProvider } from './lib/providers.mjs';
import { loadConfig } from './lib/config.mjs';
import { handleAdmin } from './lib/admin-api.mjs';
import { log, setLogFile } from './lib/logger.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const CONFIG_PATH = path.join(ROOT, 'config.json');
const LOG_FILE = path.join(ROOT, 'cascade.log');

setLogFile(LOG_FILE);

// ========== 配置 ==========
const config = loadConfig(CONFIG_PATH);

// ========== API 调用 ==========
function callProvider(provider, body) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: provider.host, port: 443, path: provider.path, method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
    }, res => resolve(res));
    req.on('error', reject);
    req.setTimeout(120000, () => { req.destroy(); reject(new Error('Request timeout')); });
    req.write(JSON.stringify(body));
    req.end();
  });
}

// ========== Admin 面板静态文件 ==========
function serveAdmin(res) {
  const htmlPath = path.join(ROOT, 'packages', 'admin', 'index.html');
  try {
    const html = fs.readFileSync(htmlPath, 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Cascade</title></head>
<body style="background:#0f172a;color:#e2e8f0;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
<div style="text-align:center"><h1>Cascade</h1><p>Admin panel not found. Run <code>npm run build:admin</code></p></div>
</body></html>`);
  }
}

// ========== HTTP Server ==========
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-request-id');

  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  // 健康检查
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      name: 'Cascade',
      version: '1.0.0',
      status: 'ok',
      providers: Object.keys(config.providers).filter(k => config.providers[k].apiKey),
    }));
  }

  // Admin API
  if (req.url?.startsWith('/admin/')) {
    const handled = handleAdmin(req, res, config);
    if (handled !== false) return;
  }

  // Admin 面板
  if (req.url === '/admin' || req.url === '/admin/') return serveAdmin(res);

  // HTTP POST /v1/responses — Responses API（OpenAI 兼容模式）
  if (req.url === '/v1/responses' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body);
        const { provider } = resolveProvider(parsed.model, config.modelMap, config.providers);
        const requestId = crypto.randomUUID().slice(0, 8);
        const { model, isStream, body: reqBody } = buildRequestBody(parsed, provider);
        config.stats.requests++;

        log(`HTTP → ${provider.name} (${model}) stream=${isStream}`);

        const dsRes = await callProvider(provider, reqBody);
        if (isStream) {
          res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
          for await (const evt of streamTranslate(dsRes, requestId)) res.write(`data: ${evt}\n\n`);
          res.write('data: [DONE]\n\n');
          res.end();
        } else {
          let b = '';
          for await (const c of dsRes) b += c.toString();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(b);
        }
      } catch (err) {
        log(`HTTP ERROR: ${err.message}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: err.message } }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// ========== WebSocket ==========
server.on('upgrade', (req, socket, head) => {
  // 支持 /v1/responses 和根路径 WebSocket
  if (req.url !== '/v1/responses' && req.url !== '/') { socket.destroy(); return; }
  const key = req.headers['sec-websocket-key'];
  if (!key) { socket.destroy(); return; }

  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    `Sec-WebSocket-Accept: ${acceptKey(key)}\r\n\r\n`
  );

  log(`WebSocket connected (${req.url})`);
  let wsBuf = Buffer.alloc(0);
  let closeReason = '';

  socket.on('data', async (data) => {
    wsBuf = Buffer.concat([wsBuf, data]);
    while (true) {
      const result = decodeFrame(wsBuf);
      if (!result) break;
      wsBuf = wsBuf.slice(result.consumed);

      const msg = result.payload;
      if (msg === 'ping' || msg === '{"type":"ping"}') {
        socket.write(encodeFrame('pong'));
        continue;
      }
      if (msg === 'pong') continue;

      try {
        const parsed = JSON.parse(msg);
        const { provider } = resolveProvider(parsed.model, config.modelMap, config.providers);
        const requestId = crypto.randomUUID().slice(0, 8);
        const { model, isStream, body: reqBody } = buildRequestBody(parsed, provider);
        config.stats.requests++;

        log(`WS → ${provider.name} (${model}) stream=${isStream}`);

        const dsRes = await callProvider(provider, reqBody);

        if (isStream) {
          socket.write(encodeFrame(JSON.stringify({
            type: 'response.created',
            response: { id: `resp-${requestId}`, object: 'response', status: 'in_progress', output: [] },
          })));

          const pingTimer = setInterval(() => {
            try { socket.write(encodePing()); } catch { clearInterval(pingTimer); }
          }, 5000);

          for await (const evt of streamTranslate(dsRes, requestId)) {
            socket.write(encodeFrame(evt));
          }
          clearInterval(pingTimer);
        } else {
          // 非流式
          let b = '';
          for await (const c of dsRes) b += c.toString();
          try {
            const dsr = JSON.parse(b);
            const content = dsr.choices?.[0]?.message?.content || '';
            socket.write(encodeFrame(JSON.stringify({ type: 'response.output_item.added', item: { id: `msg-${requestId}-0`, type: 'message', role: 'assistant', status: 'in_progress' } })));
            socket.write(encodeFrame(JSON.stringify({ type: 'response.content_part.added', item_id: `msg-${requestId}-0`, part: { type: 'output_text', text: '' } })));
            socket.write(encodeFrame(JSON.stringify({ type: 'response.output_text.delta', item_id: `msg-${requestId}-0`, delta: content })));
            socket.write(encodeFrame(JSON.stringify({ type: 'response.content_part.done', item_id: `msg-${requestId}-0`, part: { type: 'output_text', text: content } })));
            socket.write(encodeFrame(JSON.stringify({ type: 'response.output_item.done', item: { id: `msg-${requestId}-0`, type: 'message', status: 'completed' } })));
            socket.write(encodeFrame(JSON.stringify({ type: 'response.completed', response: { id: `resp-${requestId}`, object: 'response', status: 'completed' } })));
          } catch { /* skip parse error */ }
        }
      } catch (err) {
        log(`WS ERROR: ${err.message}`);
        try { socket.write(encodeFrame(JSON.stringify({ type: 'error', error: { message: err.message } }))); } catch {}
      }
    }
  });

  socket.on('close', () => log(`WebSocket closed${closeReason ? `: ${closeReason}` : ''}`));
  socket.on('error', (e) => { closeReason = e.message; });
});

// ========== 启动 ==========
const { port, host } = config;
server.listen(port, host, () => {
  log(`Cascade v1.0.0 → http://${host}:${port}`);
  log(`Admin panel: http://${host}:${port}/admin`);
  const configured = Object.entries(config.providers).filter(([, v]) => v.apiKey).map(([k]) => k);
  log(`Providers: ${configured.length ? configured.join(', ') : '(none configured — set *_API_KEY env vars or edit config.json)'}`);
  if (!configured.length) {
    log('Quick start: DEEPSEEK_API_KEY=sk-xxx node packages/proxy/cascade.mjs');
  }
});

// 优雅退出
let shuttingDown = false;
['SIGTERM', 'SIGINT'].forEach(sig => {
  process.on(sig, () => {
    if (shuttingDown) return;
    shuttingDown = true;
    log(`Received ${sig}, shutting down...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000);
  });
});
