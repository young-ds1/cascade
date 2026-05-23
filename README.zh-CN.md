# Cascade

> 一行命令让中国开发者用任何国产模型驱动任何 AI 编程工具

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js 18+](https://img.shields.io/badge/node-%3E%3D18-green.svg)](https://nodejs.org)

Cascade 是一个零依赖、单文件启动的多供应商 AI 编程代理服务器。把国产大模型（DeepSeek、Qwen、Kimi、GLM）的 Chat Completions API 翻译成 AI 编程工具（Codex CLI、Claude Code、Cursor、Cline）需要的 Responses API 格式，同时提供一个浏览器管理面板。

## 为什么需要 Cascade？

中国开发者在用国产模型驱动 AI 编程工具时，面临三个问题：

1. **协议不兼容**：国产模型只提供 OpenAI Chat Completions API，AI 编程工具用的是 Anthropic Responses API 格式
2. **配置太复杂**：每个工具要单独配代理、配环境变量、配模型映射
3. **没有可视化管理**：想换个模型、看下请求日志，全靠改配置文件

Cascade 一次启动，解决所有问题。

## 5 分钟上手

### 1. 设置 API Key

```bash
export DEEPSEEK_API_KEY=sk-your-deepseek-key
# 可选：其他供应商
export QWEN_API_KEY=sk-your-qwen-key
export KIMI_API_KEY=sk-your-kimi-key
export GLM_API_KEY=sk-your-glm-key
```

### 2. 启动 Cascade

```bash
node packages/proxy/cascade.mjs
```

```
Cascade v1.0.0 → http://127.0.0.1:8765
Admin panel: http://127.0.0.1:8765/admin
Providers: deepseek
```

### 3. 配置 AI 编程工具

**Codex CLI** — 设置 `OPENAI_BASE_URL`：

```bash
export OPENAI_BASE_URL=http://127.0.0.1:8765/v1
export OPENAI_API_KEY=any-value
```

**Claude Code** — 用 OpenAI 兼容模式：

```bash
claude --provider openai-compatible \
  --openai-base-url http://127.0.0.1:8765/v1 \
  --openai-api-key any-value
```

**Cursor** — Settings → Models → OpenAI API Key overrides:

```
Base URL: http://127.0.0.1:8765/v1
API Key: any-value
Model: gpt-5.1
```

**Cline**（VS Code 插件）— Settings → API Provider → OpenAI Compatible:

```
Base URL: http://127.0.0.1:8765/v1
API Key: any-value
Model ID: gpt-5.1
```

详细配置指南见 [docs/tools.zh-CN.md](docs/tools.zh-CN.md)。

## 管理面板

打开 `http://127.0.0.1:8765/admin`：

- **Dashboard** — 实时请求统计、供应商连接状态
- **Providers** — 管理 API Key、测试连接
- **Model Map** — 管理工具模型名 → 供应商的映射关系
- **Logs** — 实时日志查看

## 支持的供应商

| 供应商 | 模型 | 特殊适配 |
|--------|------|---------|
| DeepSeek V4 Pro | `deepseek-v4-pro` | `thinking: true` |
| Qwen3-Coder | `qwen3-coder` | `enable_thinking` 映射 |
| Kimi K2.6 | `kimi-k2-0906-preview` | 标准 OpenAI 兼容 |
| GLM-5.1 | `glm-4.6` | 专用 API 路径 + temperature→do_sample |

## 配置

复制配置文件并根据需要修改：

```bash
cp config.example.json config.json
```

支持两种配置方式（优先级：环境变量 > config.json）：

```bash
# 环境变量
export DEEPSEEK_API_KEY=sk-xxx
export CASCADE_PORT=8765

# config.json
{
  "port": 8765,
  "providers": {
    "deepseek": { "apiKey": "sk-xxx", "model": "deepseek-v4-pro" }
  },
  "modelMap": {
    "gpt-5.1": "deepseek"
  }
}
```

## 交互式配置向导

```bash
bash scripts/setup.sh
```

## 项目结构

```
cascade/
├── packages/proxy/          # 代理核心
│   ├── cascade.mjs          # 入口
│   └── lib/                 # 模块
│       ├── ws-frame.mjs     # WebSocket 帧处理
│       ├── translate.mjs    # 协议翻译
│       ├── providers.mjs    # 供应商定义
│       ├── config.mjs       # 配置管理
│       ├── admin-api.mjs    # Admin API
│       └── logger.mjs       # 日志
├── packages/admin/          # 管理面板 (SPA)
├── scripts/setup.sh         # 安装脚本
├── docs/                    # 文档
├── config.example.json      # 配置模板
└── LICENSE                  # MIT
```

## 常见问题

**Q: 为什么不用 Docker？**
A: 零依赖是 Cascade 的核心设计目标。一个 Node.js 文件，一条命令启动。Docker 会增加不必要的复杂度。

**Q: 和 one-api 有什么区别？**
A: one-api 管 API Key 分发，Cascade 管协议翻译 + AI 编程工具集成。两者互补，可以一起用。

**Q: 支持 Anthropic Messages API 原生格式吗？**
A: v1.0 走 OpenAI 兼容模式（所有主流 AI 编程工具都支持）。原生 Messages API 在 v2 路线图中。

**Q: HTTPS 支持？**
A: 本地开发不需要。生产环境建议用 nginx/Caddy 反代。

## 路线图

- [x] v1.0 — 4 供应商 + 4 工具 + 管理面板 + 中文文档
- [ ] v1.1 — Docker 部署、nginx 配置模板
- [ ] v1.2 — Anthropic Messages API 原生翻译
- [ ] v2.0 — 多用户 API Key 分发、使用统计
- [ ] v2.1 — Cascade Cloud 托管版

## License

MIT — 随便用，随便改，随便商用。
