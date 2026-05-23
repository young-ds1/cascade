// Admin API 路由处理
import https from 'https';
import { log } from './logger.mjs';
import { saveConfig } from './config.mjs';

export function handleAdmin(req, res, config) {
  // GET /admin/status — 运行状态
  if (req.method === 'GET' && req.url === '/admin/status') {
    const status = {
      uptime: Math.floor((Date.now() - config.stats.startTime) / 1000),
      requests: config.stats.requests,
      port: config.port,
      providers: Object.fromEntries(
        Object.entries(config.providers).map(([k, v]) => [
          k,
          { name: v.name, model: v.model, hasKey: !!v.apiKey, color: v.color },
        ])
      ),
      modelMap: config.modelMap,
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(status));
  }

  // POST /admin/config — 更新配置
  if (req.method === 'POST' && req.url === '/admin/config') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const updates = JSON.parse(body);
        if (updates.providers) {
          for (const [k, v] of Object.entries(updates.providers)) {
            if (config.providers[k]) Object.assign(config.providers[k], v);
          }
        }
        if (updates.modelMap) Object.assign(config.modelMap, updates.modelMap);
        if (updates.port) config.port = updates.port;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        log('Config updated via admin API');
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // POST /admin/test/:provider — 测试供应商连接
  const testMatch = req.url.match(/^\/admin\/test\/(\w+)$/);
  if (req.method === 'POST' && testMatch) {
    const providerKey = testMatch[1];
    const provider = config.providers[providerKey];
    if (!provider?.apiKey) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: `Provider "${providerKey}" not configured` }));
    }
    testConnection(provider, res);
    return;
  }

  // POST /admin/config/save — 持久化配置
  if (req.method === 'POST' && req.url === '/admin/config/save') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const filePath = JSON.parse(body).path;
        if (filePath) saveConfig(filePath, config);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, message: 'Config saved' }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  return false; // 不是 admin 路由
}

function testConnection(provider, res) {
  const start = Date.now();
  const body = JSON.stringify({
    model: provider.model,
    messages: [{ role: 'user', content: 'hi' }],
    max_tokens: 1,
    stream: false,
  });

  const req = https.request({
    hostname: provider.host, port: 443, path: provider.path, method: 'POST',
    headers: {
      'Authorization': `Bearer ${provider.apiKey}`,
      'Content-Type': 'application/json',
    },
  }, (apiRes) => {
    let data = '';
    apiRes.on('data', c => data += c);
    apiRes.on('end', () => {
      const latency = Date.now() - start;
      if (apiRes.statusCode === 200) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, latency, status: apiRes.statusCode }));
        log(`${provider.name} connection test: OK (${latency}ms)`);
      } else {
        res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, latency, status: apiRes.statusCode, body: data.slice(0, 200) }));
        log(`${provider.name} connection test: FAIL (${apiRes.statusCode})`);
      }
    });
  });

  req.on('error', (err) => {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: err.message }));
    log(`${provider.name} connection test: ERROR (${err.message})`);
  });

  req.setTimeout(15000, () => {
    req.destroy();
    res.writeHead(504, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'timeout' }));
  });

  req.write(body);
  req.end();
}
