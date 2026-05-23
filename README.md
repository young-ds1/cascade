# Cascade

> One command to drive any AI coding tool with any Chinese LLM provider.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js 18+](https://img.shields.io/badge/node-%3E%3D18-green.svg)](https://nodejs.org)

Cascade is a zero-dependency, multi-provider AI coding harness. It translates Chinese LLM providers' (DeepSeek, Qwen, Kimi, GLM) Chat Completions API into the Responses API format expected by AI coding tools (Codex CLI, Claude Code, Cursor, Cline), with a browser-based admin panel.

## Quick Start

```bash
export DEEPSEEK_API_KEY=sk-your-key
node packages/proxy/cascade.mjs
# → http://127.0.0.1:8765 | Admin: http://127.0.0.1:8765/admin
```

Then point your AI coding tool at `http://127.0.0.1:8765/v1`.

## Providers

| Provider | Model | Adapter |
|----------|-------|---------|
| DeepSeek V4 Pro | `deepseek-v4-pro` | thinking mode enabled |
| Qwen3-Coder | `qwen3-coder` | enable_thinking mapping |
| Kimi K2.6 | `kimi-k2-0906-preview` | Standard OpenAI |
| GLM-5.1 | `glm-4.6` | Custom path + do_sample |

## Documentation

- [中文 README](README.zh-CN.md)
- [安装指南](docs/setup.zh-CN.md)
- [工具连接指南](docs/tools.zh-CN.md)
- [FAQ](docs/faq.zh-CN.md)

## License

MIT — use freely, modify freely, commercial use OK.
