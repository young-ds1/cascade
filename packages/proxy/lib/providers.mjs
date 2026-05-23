// 供应商定义 + 适配钩子
// 每个供应商是纯数据对象，adaptRequest 是可选的适配函数

export const PROVIDERS = {
  deepseek: {
    name: 'DeepSeek V4 Pro',
    host: 'api.deepseek.com',
    path: '/v1/chat/completions',
    model: 'deepseek-v4-pro',
    color: '#4F46E5',
    adaptRequest(body) {
      body.chat_template_kwargs = { thinking: true };
    },
  },

  qwen: {
    name: 'Qwen3-Coder',
    host: 'dashscope.aliyuncs.com',
    path: '/compatible-mode/v1/chat/completions',
    model: 'qwen3-coder',
    color: '#00A4FF',
    adaptRequest(body) {
      // Qwen 用 enable_thinking 而非 chat_template_kwargs
      if (body.chat_template_kwargs) {
        body.enable_thinking = body.chat_template_kwargs.thinking;
        delete body.chat_template_kwargs;
      }
    },
  },

  kimi: {
    name: 'Kimi K2.6',
    host: 'api.moonshot.cn',
    path: '/v1/chat/completions',
    model: 'kimi-k2-0906-preview',
    color: '#8B5CF6',
    // Kimi 标准 OpenAI 兼容，无需 adaptRequest
  },

  glm: {
    name: 'GLM-5.1',
    host: 'open.bigmodel.cn',
    path: '/api/paas/v4/chat/completions',
    model: 'glm-4.6',
    color: '#3B82F6',
    adaptRequest(body) {
      // GLM 特殊路径 + temperature → do_sample 映射
      if (body.temperature != null) {
        body.do_sample = body.temperature > 0;
      }
    },
  },
};

// 工具模型 → 供应商前缀 映射
export const DEFAULT_MODEL_MAP = {
  'gpt-5.5': 'deepseek',
  'gpt-5.1': 'deepseek',
  'gpt-5': 'deepseek',
  'gpt-4o': 'deepseek',
  'claude-sonnet-4-6': 'deepseek',
  'claude-opus-4-7': 'deepseek',
  'deepseek-v4-pro': 'deepseek',
  'qwen3-coder': 'qwen',
  'kimi-k2': 'kimi',
  'glm-4': 'glm',
};

export function resolveProvider(modelName, modelMap, providers) {
  const providerKey = modelMap[modelName] || 'deepseek';
  const provider = providers[providerKey];
  if (!provider) throw new Error(`Provider "${providerKey}" not configured`);
  if (!provider.apiKey) throw new Error(`API Key for "${provider.name}" not set`);
  return { providerKey, provider };
}
