# Product Principles — 做什么，不做什么

## 产品定位

Cascade = 协议翻译 + 管理面板。轻量、本地、零依赖。

## 做

- 协议翻译（Responses API ↔ Chat Completions，HTTP + WebSocket 双通道）
- 供应商适配（每个供应商一个定义对象，含 adaptRequest hook）
- 浏览器管理面板（Dashboard / Providers / Model Map / Logs）
- 零依赖单文件启动（Node 内置模块 only）
- MIT 开源

## 不做

- 不做 API Key 分发管理（one-api 做得更好）
- 不做负载均衡自动切换（先聚焦单供应商稳定）
- 不做云端托管（Key 不过服务器是底线）
- 不做 160+ 供应商（4 家核心，质量优先于数量）

## 产品判断标准

每加一个功能，问三问：
1. 能让用户少写一行配置吗？
2. 能让用户少记一个概念吗？
3. 如果去掉它，用户会痛吗？

三个全是 Yes → 做。
