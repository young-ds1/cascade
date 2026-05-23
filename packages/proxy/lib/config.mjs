// 配置加载：config.json + 环境变量覆盖
import fs from 'fs';
import path from 'path';
import { PROVIDERS, DEFAULT_MODEL_MAP } from './providers.mjs';

export function loadConfig(configPath) {
  const defaults = {
    port: 8765,
    host: '127.0.0.1',
    providers: Object.fromEntries(
      Object.entries(PROVIDERS).map(([k, v]) => [k, { ...v }])
    ),
    modelMap: { ...DEFAULT_MODEL_MAP },
    stats: { requests: 0, startTime: Date.now() },
  };

  // 注入环境变量中的 API Key（优先级最高）
  const envKeys = {
    deepseek: process.env.DEEPSEEK_API_KEY,
    qwen: process.env.QWEN_API_KEY || process.env.DASHSCOPE_API_KEY,
    kimi: process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY,
    glm: process.env.GLM_API_KEY || process.env.ZHIPU_API_KEY,
  };
  for (const [k, v] of Object.entries(envKeys)) {
    if (v && defaults.providers[k]) defaults.providers[k].apiKey = v;
  }

  // 环境变量覆盖端口
  if (process.env.CASCADE_PORT) defaults.port = parseInt(process.env.CASCADE_PORT, 10);
	if (process.env.CASCADE_HOST) defaults.host = process.env.CASCADE_HOST;

  // 加载 config.json 合并
  try {
    const user = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (user.port) defaults.port = user.port;
    if (user.host) defaults.host = user.host;
    if (user.modelMap) Object.assign(defaults.modelMap, user.modelMap);
    if (user.providers) {
      for (const [k, v] of Object.entries(user.providers)) {
        if (defaults.providers[k]) {
          if (v.apiKey) defaults.providers[k].apiKey = v.apiKey;
          if (v.model) defaults.providers[k].model = v.model;
          if (v.name) defaults.providers[k].name = v.name;
        }
      }
    }
  } catch { /* config.json 不存在或格式错误，使用默认值 */ }

  return defaults;
}

export function saveConfig(configPath, config) {
  const toSave = {
    port: config.port,
    host: config.host,
    modelMap: config.modelMap,
    providers: {},
  };
  for (const [k, v] of Object.entries(config.providers)) {
    toSave.providers[k] = { apiKey: v.apiKey || '', model: v.model, name: v.name };
  }
  fs.writeFileSync(configPath, JSON.stringify(toSave, null, 2));
}
