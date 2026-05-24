# Competitor Tracking — 竞品地图

更新时间：2026.05.24

## 直接竞品

| 项目 | Stars | 做什么 | 和 Cascade 差异 |
|------|-------|--------|----------------|
| **CCR** (claude-code-router) | 18K | Claude Code ↔ 其他模型 | 单工具。Cascade 支持 4 工具 + 管理面板 |
| **codex-proxy** | — | Codex CLI ↔ DeepSeek | 单供应商。Cascade 支持 4 供应商 + 面板 |
| **one-api** | 33K | API Key 分发管理 | 不分发翻译。互补关系 |

## 间接竞品

| 项目 | Stars | 做什么 |
|------|-------|--------|
| **OmniRoute** | — | 160+ 供应商路由 | 太重，开发者和独立用户用不上 |
| **LiteLLM** | 20K+ | 统一 LLM 调用 | 库而非服务，面向代码调用而非工具代理 |
| **openai-reverse-proxy** | — | 通用反代 | 无供应商适配、无面板、无中文 |

## Cascade 护城河

1. **4 工具 × 4 模型矩阵** — 覆盖面最完整
2. **零依赖单文件** — 部署成本最低（Node 18+ 即可）
3. **浏览器管理面板** — 同类唯一可视化方案
4. **中文优先** — 文档、面板、设计面向中国开发者
5. **MIT 协议** — 最宽松，随便商用

## 需警惕

- 如果 OpenAI 或 Anthropic 自己开放 Chat Completions 兼容 → 核心翻译价值削弱
- 如果国产模型直接支持 Responses API → 部分价值消失
- 应对：不依赖单一翻译方向，扩展为「AI 编程工具通用适配层」
