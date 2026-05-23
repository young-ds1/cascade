# Cascade Twitter 发布内容（最终版）

## Thread 1/5：钩子

I stopped paying Claude $200/month.

Instead, I built a 270-line Node.js script that lets me use DeepSeek V4 Pro ($0.28/M tokens) inside Codex CLI and Claude Code.

No Docker. No npm install. No cloud.

One command: `node cascade.mjs`

Here's what happened:

## Thread 2/5：问题

AI coding tools (Codex CLI, Claude Code, Cursor) speak "Responses API."

Chinese LLMs (DeepSeek, Qwen, Kimi, GLM) only speak "Chat Completions."

They literally cannot talk to each other.

Existing solutions:
- CCR (18K stars) → Claude Code only
- one-api (33K stars) → API key management, no translation
- OmniRoute → 160+ providers, overkill

I wanted: 4 models × 4 tools × zero setup.

## Thread 3/5：方案

So I wrote Cascade.

It's a WebSocket + HTTP proxy that:
- Decodes RFC 6455 WebSocket frames (Codex CLI uses WS)
- Translates Responses API ↔ Chat Completions in real-time
- Handles streaming SSE with reasoning_content filtering
- Maps tool model names → provider → actual API model

Zero npm dependencies. Node 18+ built-in modules only (http, https, crypto, fs, path).

## Thread 4/5：面板

It also has a browser admin panel at localhost:8765/admin:

- Dashboard: request count, active providers
- Providers: test connectivity, view config
- Model Map: remap any tool model → any provider
- Logs: real-time request/response streaming

No config files to edit. No env vars to memorize. Everything visual.

## Thread 5/5：怎么用

```bash
export DEEPSEEK_API_KEY=sk-your-key
node packages/proxy/cascade.mjs
# → http://127.0.0.1:8765
# → Admin: http://127.0.0.1:8765/admin
```

Codex CLI: set openai_base_url to http://127.0.0.1:8765/v1
Claude Code: --provider openai-compatible
Cursor: override OpenAI base URL
Cline: API configuration → custom endpoint

4 Chinese models. 4 AI coding tools. One proxy. MIT.

github.com/young-ds1/cascade

Honest about the rough edges. PRs welcome.

---

## 发布格式

- Thread 1: 文字 + Dashboard 截图
- Thread 2-4: 纯文字回复
- Thread 5: 文字 + 终端截图

## 发布备注

- 发布后 1 小时内回复所有评论
- 不要一口气发完 5 条，间隔 2-3 分钟
- 把 GitHub 链接放在第 5 条，不要放在第 1 条（避免被限流）
