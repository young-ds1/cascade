# 常见问题

## 连接不上？

```bash
# 检查服务是否在运行
curl http://127.0.0.1:8765/health

# 检查端口是否被占用
lsof -i :8765
```

如果端口被占用，换个端口：

```bash
CASCADE_PORT=9876 node packages/proxy/cascade.mjs
```

## API Key 不生效？

环境变量的优先级高于 `config.json`。如果配置了环境变量，`config.json` 中的同名字段会被覆盖。这是故意的——方便你在不同机器上用不同 Key。

## 推理过程（thinking/reasoning）能看到吗？

Cascade 在流式传输时会跳过 `reasoning_content` 字段，只传递最终的正文内容。推理过程在服务端日志中不显示，但会用 WebSocket ping 帧保持连接活跃，防止超时断开。

如果你需要看到推理过程，可以设置环境变量：

```bash
CASCADE_SHOW_REASONING=1 node packages/proxy/cascade.mjs
```

## 支持哪些模型供应商？

v1.0 内置 4 家：DeepSeek、Qwen（阿里百炼）、Kimi（月之暗面）、GLM（智谱）。

要添加新供应商：
1. 在 `packages/proxy/lib/providers.mjs` 的 `PROVIDERS` 对象中添加定义
2. 在 `config.json` 中填入 API Key
3. 如果 API 格式有差异，添加 `adaptRequest` 钩子

## 能在服务器上部署吗？

可以。Cascade 默认绑定 `127.0.0.1`，要对外暴露改成 `0.0.0.0`：

```bash
# config.json 中设置
"host": "0.0.0.0"
```

但建议在前面放 nginx/Caddy 做反代，加上 HTTPS 和限流。

## 能同时用多个供应商吗？

能。Cascade 的核心价值就是多供应商路由。配置好多个 API Key 后，通过 Model Map 把不同的工具模型名指向不同的供应商。

例如：
- `gpt-5.1` → DeepSeek（写代码）
- `qwen3-coder` → Qwen（写文档）
- `claude-opus-4-7` → Kimi（代码审查）

工具侧只需要切换模型名即可。

## 和 one-api / CCR / OmniRoute 的关系？

| 工具 | 定位 | 和 Cascade 的关系 |
|------|------|------------------|
| one-api | API Key 管理 + 分发 | 互补：Cascade 做翻译，one-api 做分发 |
| CCR | Claude Code 路由 | 替代：Cascade 支持更多工具 + 有管理面板 |
| OmniRoute | 多供应商路由 | 替代：Cascade 更轻量 + 中文优先 |

## 协议是 WebSocket 还是 HTTP？

两种都支持。Cascade 同时提供 HTTP SSE 和 WebSocket 端点，AI 编程工具可以选自己喜欢的方式连接。Codex CLI 用 WebSocket，Claude Code/Cursor 用 HTTP。

## 为什么 Node.js 而不是 Go？

1. 现有代码 `ds-proxy.mjs` 已在 Node.js 上验证跑通
2. 一周 MVP，重写 Go 版本会丢失已踩过的坑
3. Node.js 18+ 国内开发者基本都装了
4. 零依赖——只用 Node.js 内置模块

## 开源协议？

MIT。随便用，随便改，随便商用。
