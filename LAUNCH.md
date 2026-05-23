# Cascade 发版推广内容

## V2EX / Linux.do 主帖

**标题**：Cascade — 一行命令让 Codex CLI / Claude Code / Cursor 用上国产模型

**正文**：

TL;DR: 写了个开源工具 Cascade，零依赖、单文件启动，把 DeepSeek/Qwen/Kimi/GLM 的 API 翻译成 AI 编程工具能吃的格式，带浏览器管理面板。GitHub: https://github.com/young-ds1/cascade

---

### 为什么做这个

中国开发者在 AI 编程工具上一直有个痛点：

想用 Claude Code / Codex CLI / Cursor 写代码，但 Anthropic 的 API 又贵又难付。国产模型（DeepSeek、Qwen、Kimi、GLM）性价比高，但 API 格式不兼容——AI 编程工具期望的是 Responses API 格式，国产模型只提供 OpenAI Chat Completions。

市场上有 one-api（管分发）、CCR（做翻译但只支持 Claude Code）、OmniRoute（太复杂），但没有一个产品把「协议翻译 + 管理面板 + 一键启动」合在一起。

所以写了 Cascade。

### 做了什么

- 4 个国产模型供应商：DeepSeek V4 Pro / Qwen3-Coder / Kimi K2.6 / GLM-5.1
- 4 个 AI 编程工具：Codex CLI / Claude Code / Cursor / Cline
- Responses API ↔ Chat Completions 协议翻译（HTTP SSE + WebSocket 双通道）
- 浏览器管理面板：Dashboard / Providers / Model Map / 实时日志
- 零依赖、零构建、零配置（除了填 API Key）
- MIT 开源

### 5 分钟上手

```bash
export DEEPSEEK_API_KEY=sk-your-key
node packages/proxy/cascade.mjs
# → http://127.0.0.1:8765 | Admin: http://127.0.0.1:8765/admin
```

Codex CLI 直接就能用（url 配好就行），Claude Code / Cursor / Cline 各一行配置。

### 和竞品的区别

| | one-api | CCR | OmniRoute | Cascade |
|--|---------|-----|-----------|---------|
| API 管理 | ✓ | ✗ | ✓ | ✓ |
| 协议翻译 | ✗ | ✓ | ✓ | ✓ |
| 管理面板 | ✓ | ✗ | ✓ | ✓ |
| 中文优先 | ✓ | ✗ | ✗ | ✓ |
| AI 工具感知 | ✗ | 仅 CC | ✓ | 4 工具 |
| 零依赖单文件 | ✗ | ✗ | ✗ | ✓ |

### 技术细节

Node.js ESM，只用内置模块（http/https/crypto/fs/path）。从现有的 ds-proxy（已跑通生产环境 WebSocket 链路）提取核心模块，做了泛化重构。

供应商适配用纯数据对象 + 可选 hook，新增供应商只需加一个定义对象：
- DeepSeek: `chat_template_kwargs: { thinking: true }`
- Qwen: `enable_thinking` 映射
- Kimi: 标准 OpenAI 兼容
- GLM: 专用 path + `temperature → do_sample`

### 下一步计划

- Docker 部署 + nginx 配置模板
- Anthropic Messages API 原生翻译
- 多用户 API Key 分发管理
- Cascade Cloud 托管版（内置 API Key 池）

---

GitHub: https://github.com/young-ds1/cascade
有问题直接提 Issue，或者帖子里留言。

---

## 小红书文案

**标题**：国内开发者终于可以用 DeepSeek 写代码了 🤖

**正文**：

一行命令，让 Codex CLI / Claude Code / Cursor 用上 DeepSeek 🚀

作为独立开发者，一直想用 AI 编程工具提升效率，但 Claude API 又贵又难付。DeepSeek V4 Pro 性价比很高，问题是——AI 编程工具的协议和国产模型不兼容。

于是自己写了个开源工具 Cascade：
✅ 支持 4 家国产模型：DeepSeek/Qwen/Kimi/GLM
✅ 支持 4 个编程工具：Codex CLI/Claude Code/Cursor/Cline
✅ 浏览器管理面板，可视化操作
✅ 零依赖，npm 都不用装
✅ MIT 开源，随便商用

GitHub 链接在评论区👇

#AI编程 #独立开发者 #DeepSeek #开源 #效率工具

---

## 推特/X 文案

Cascade — One command to drive any AI coding tool with any Chinese LLM.

Codex CLI → DeepSeek V4 Pro ✅
Claude Code → Qwen3-Coder ✅
Cursor → Kimi K2.6 ✅
Cline → GLM-5.1 ✅

Zero deps. Single file. MIT.
github.com/young-ds1/cascade

#AICoding #DeepSeek #OpenSource #LLM
