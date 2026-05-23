# AI 编程工具连接指南

Cascade 启动后，将以下配置应用到你的 AI 编程工具。

> 统一端点：`http://127.0.0.1:8765/v1`
> API Key 可以填任意值（Cascade 不校验，真实 Key 在服务端配置）

---

## Codex CLI

Codex CLI 使用 OpenAI 兼容接口，设置环境变量即可：

```bash
export OPENAI_BASE_URL=http://127.0.0.1:8765/v1
export OPENAI_API_KEY=any-value
```

然后正常使用 Codex CLI：

```bash
codex "写一个 HTTP server"
```

Codex CLI 会用 `gpt-5.1` 作为默认模型名，Cascade 会自动路由到 DeepSeek V4 Pro。

如果已配置多个供应商，可以指定模型：

```bash
codex --model qwen3-coder "写一个排序算法"
```

---

## Claude Code

Claude Code 支持 OpenAI 兼容模式：

```bash
claude --provider openai-compatible \
  --openai-base-url http://127.0.0.1:8765/v1 \
  --openai-api-key any-value
```

或者用环境变量持久化：

```bash
export CLAUDE_PROVIDER=openai-compatible
export OPENAI_BASE_URL=http://127.0.0.1:8765/v1
export OPENAI_API_KEY=any-value
```

---

## Cursor

1. 打开 Cursor Settings → Models
2. 找到 "OpenAI API Key" 部分
3. 关闭 "Use API Key from Vault"（如果有）
4. 填入：

```
Base URL: http://127.0.0.1:8765/v1
API Key:  cascade  (任意值)
```

5. 在 Model 下拉框中选用 `gpt-5.1` 或 `gpt-5`

如果你想要 Cursor 同时使用 Cascade（国产模型）和 Anthropic（Claude 官方），可以：
- 用 Cursor 自带的 Anthropic 连 Claude
- 把 OpenAI Base URL 指向 Cascade 连国产模型
- 两个不冲突，随时切换

---

## Cline（VS Code / Cursor 插件）

1. 打开 Cline 设置
2. API Provider 选择 **OpenAI Compatible**
3. 填入：

```
Base URL: http://127.0.0.1:8765/v1
API Key: cascade
Model ID: gpt-5.1
```

---

## Continue（VS Code / JetBrains）

在 `~/.continue/config.json` 中：

```json
{
  "models": [
    {
      "title": "DeepSeek V4 Pro (via Cascade)",
      "provider": "openai",
      "model": "gpt-5.1",
      "apiBase": "http://127.0.0.1:8765/v1",
      "apiKey": "any-value"
    }
  ]
}
```

---

## 模型名速查

| 工具 | 建议模型名 | 实际供应商 |
|------|-----------|-----------|
| Codex CLI | `gpt-5.1`（默认） | DeepSeek V4 Pro |
| Claude Code | `gpt-5.1` | DeepSeek V4 Pro |
| Cursor | `gpt-5.1` / `gpt-5` | DeepSeek V4 Pro |
| Cline | `gpt-5.1` | DeepSeek V4 Pro |
| Continue | 任意，在 modelMap 中配置 | 按配置路由 |

在 Cascade Admin Panel → Model Map 中可以自定义这些映射关系。
