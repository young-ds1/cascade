# Cascade 知乎回答（最终版）

---

## 找哪个问题？

优先级从高到低：
1. 「2025 年了，国内开发者怎么用国产大模型写代码？」
2. 「GitHub 上有哪些国产 AI 开源项目值得推荐？」
3. 「AI 编程工具（Codex CLI / Claude Code / Cursor）怎么接入国产大模型？」
4. 「DeepSeek 可以代替 Claude 写代码吗？」
5. 没找到合适的 → 发专栏文章

搜索关键词：Codex CLI 国产模型、Claude Code DeepSeek、AI 编程 国内、大模型 API 代理

---

## 回答正文（针对问题 1）

### 标题思路
「实测跑通」比「推荐」更有说服力：别再用记事本配代理了——写了个东西让 Codex CLI 和 Claude Code 吃上国产模型

---

### 正文

弄了个开源工具，分享一下。

## 起因

一直想用 Codex CLI 和 Claude Code 写代码。但 Claude API 真的贵——一个月光 API 费用能烧掉几百块。DeepSeek V4 Pro 便宜得多（约 ¥2/百万 token），性价比极高。

问题是：这些 AI 编程工具期望的是 OpenAI Responses API 格式，国产模型只提供 Chat Completions API。协议不兼容。

市面上有几个方案，我都试过：

**one-api（33K star）**：管 Key 分发的，不解决协议翻译问题。你配好 DeepSeek key 分发给团队用，但 AI 编程工具还是不认。

**CCR / claude-code-router（18K star）**：做协议翻译，但只支持 Claude Code。你想用 Codex CLI 或者 Cursor，不行。

**OmniRoute**：支持 160+ 供应商，功能强但太重了。我只想找个轻量的翻译层。

**codex-proxy**：专门给 Codex CLI 配 DeepSeek，但没管理面板，也没多供应商支持。

都需要手写 JSON 配置、记环境变量名、改完重启。用了几次觉得太麻烦。

反正核心要做的事情就两件——WebSocket 帧处理 + SSE 流式翻译，干脆自己写。

## 做了什么

Cascade，一个 Node.js 脚本。核心四个字：**协议翻译 + 管理面板**。

技术上讲，它做了这些事：

**1. WebSocket RFC 6455 帧处理**
Codex CLI 和 OpenAI 之间是 WebSocket 长连接。你发的每条消息都被编码成 RFC 6455 数据帧（带 opcode、masking key、payload length）。Cascade 在中间解码 Codex CLI 发来的帧、提取 JSON、翻译成 Chat Completions 请求发给国产模型、把响应再编码回 WebSocket 帧。

**2. HTTP SSE 流式翻译**
Claude Code 和 Cursor 走的是 HTTP + SSE（Server-Sent Events）。OpenAI Responses API 的 SSE 事件格式和 Chat Completions 的格式不一样。Cascade 在中间做实时翻译：把 Chat Completions 的 `delta.content` 映射成 Responses API 的 `delta` 字段，把 `reasoning_content` 过滤掉（国产模型的推理过程和 Responses API 的推理事件结构对不上）。

**3. 四家供应商适配**
每家模型都有坑：
- DeepSeek：需要在请求里加 `chat_template_kwargs: { thinking: true }` 才能开启思考模式
- Qwen：thinking 开关叫 `enable_thinking`，字段名不一样
- Kimi：标准 OpenAI 兼容，最省心
- GLM：路径不一样（`/api/paas/v4/chat/completions`），`temperature` 要映射成 `do_sample`
- 新增供应商只需加一个定义对象，核心翻译逻辑不需要改

**4. 管理面板**
配了个浏览器面板 `localhost:8765/admin`，四个标签页：
- Dashboard：看请求数、活跃供应商、服务状态
- Providers：看每家供应商的配置、测连通性
- Model Map：改工具模型名到供应商模型的映射，改完即时生效
- Logs：实时请求/响应日志

不用翻配置文件，不用记环境变量，不用重启服务。

一行命令启动：
```bash
export DEEPSEEK_API_KEY=sk-你的key
node packages/proxy/cascade.mjs
# → http://127.0.0.1:8765
# → Admin: http://127.0.0.1:8765/admin
```

## 设计选择

Cascade 有几个刻意的设计决定：

**零 npm 依赖**。就用 Node 18+ 自带的 http、https、crypto、fs、path。npm install 都不用，clone 下来直接跑。这么做的原因很简单——这个工具的目标用户是开发者，开发者最烦的就是装一堆依赖然后版本冲突。

**Key 不过服务器**。代理跑在你本地，API Key 留在你手上。不做云端转发，不存 Key。

**中文优先**。README、文档、面板全是中文。这个领域的开源项目大多是英文的，国内开发者的使用门槛其实不低。

**MIT 协议**。随便用、随便改、随便商用。

## 和其他方案对比

| | one-api | CCR | OmniRoute | Cascade |
|--|---------|-----|-----------|---------|
| 协议翻译 | ✗ | ✓ | ✓ | ✓ |
| 多工具支持 | ✗ | 仅 Claude Code | ✓ | 4 工具 |
| 多供应商 | ✓ | ✓ | ✓ | 4 供应商 |
| 管理面板 | ✓ | ✗ | ✓ | ✓ |
| 中文优先 | ✓ | ✗ | ✗ | ✓ |
| 零依赖 | ✗ | ✗ | ✗ | ✓ |

## 不足之处

老实说：

- 目前只充分测了 DeepSeek，Qwen/Kimi/GLM 的适配写了但没全面测试
- 管理面板是个单文件 HTML，800 行手写，UI 比较糙
- 非流式请求目前透传 raw response，不是标准格式
- WebSocket 断线重连还没做
- 没有 Docker 镜像、没有 systemd service 模板

后面慢慢修。开源项目就这样，有人用就有人提 issue，有人提 issue 就有人修。

## 最后

GitHub：github.com/young-ds1/cascade

MIT 协议，随便用。有用的话点个 Star，刚发布 Star 数为 0。

还想接什么模型或工具，评论区说，我加上。

---

## 写作备注

- 少用「解决方案」「技术架构」这种词
- 短句，口语节奏
- 承认不足（反而更有说服力）
- 技术细节要有但不炫技——让读者觉得自己也「懂了」
- 结尾留一个开放式问题，引导评论互动

---

## 备用短回答模板

如果目标问题比较窄（如「Claude Code 怎么接 DeepSeek」），用这个精简版：

---

我在本地跑了一个代理，把 DeepSeek 的 Chat API 翻译成 Claude Code 能吃的 Responses API 格式。

一行命令：
```bash
export DEEPSEEK_API_KEY=sk-你的key
node packages/proxy/cascade.mjs
```

然后 Claude Code 用 `--provider openai-compatible` 指到 localhost:8765 就能用。

原理不复杂：HTTP SSE 流式翻译 + WebSocket 帧处理。Node 原生模块就能干，零 npm 依赖。

支持 4 家模型（DeepSeek / Qwen / Kimi / GLM）+ 4 个工具（Codex CLI / Claude Code / Cursor / Cline）+ 浏览器管理面板。

开源 MIT，GitHub：github.com/young-ds1/cascade
