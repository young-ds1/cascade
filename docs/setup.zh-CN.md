# Cascade 安装指南

## 前置要求

- Node.js 18 或更高版本（`node -v`）
- 至少一个国产大模型 API Key

## 方式一：交互式配置（推荐新手）

```bash
bash scripts/setup.sh
```

向导会提示你输入各供应商的 API Key，然后自动生成 `config.json` 并启动服务。

## 方式二：环境变量（推荐老手）

```bash
# 最少只需一个 Key
export DEEPSEEK_API_KEY=sk-xxx

# 启动
node packages/proxy/cascade.mjs
```

支持的环境变量：

| 变量 | 说明 |
|------|------|
| `DEEPSEEK_API_KEY` | DeepSeek API Key |
| `QWEN_API_KEY` / `DASHSCOPE_API_KEY` | 阿里云百炼（Qwen）API Key |
| `KIMI_API_KEY` / `MOONSHOT_API_KEY` | 月之暗面（Kimi）API Key |
| `GLM_API_KEY` / `ZHIPU_API_KEY` | 智谱清言（GLM）API Key |
| `CASCADE_PORT` | 代理端口（默认 8765） |

## 方式三：config.json

```bash
cp config.example.json config.json
# 编辑 config.json 填入 API Key
node packages/proxy/cascade.mjs
```

## 验证

```bash
# 健康检查
curl http://127.0.0.1:8765/health

# 测试 DeepSeek 连接
curl -X POST http://127.0.0.1:8765/admin/test/deepseek

# 打开管理面板
open http://127.0.0.1:8765/admin
```

## API Key 获取地址

- **DeepSeek**: https://platform.deepseek.com/api_keys
- **Qwen（阿里百炼）**: https://bailian.console.aliyun.com/
- **Kimi（月之暗面）**: https://platform.moonshot.cn/console/api-keys
- **GLM（智谱）**: https://open.bigmodel.cn/usercenter/apikeys

## 下一步

配置你的 AI 编程工具连接 Cascade → [工具连接指南](tools.zh-CN.md)
