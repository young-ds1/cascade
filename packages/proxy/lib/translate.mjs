// Responses API ↔ Chat Completions API 协议翻译

export function convertMessages(inputList) {
  return (inputList || []).map(item => {
    if (item.role === 'developer') return { role: 'system', content: item.content };
    if (Array.isArray(item.content)) {
      return {
        role: item.role,
        content: item.content.map(p => p.type === 'input_text' ? p.text : `[${p.type}]`).join('\n'),
      };
    }
    return { role: item.role, content: item.content || '' };
  });
}

export function convertTools(tools) {
  if (!tools?.length) return undefined;
  return tools.filter(t => t.type === 'function').map(t => ({
    type: 'function',
    function: { name: t.name, description: t.description || '', parameters: t.parameters || {} },
  }));
}

export function buildRequestBody(parsed, provider) {
  const model = provider.model;
  const isStream = parsed.stream !== false;
  const body = { model, messages: convertMessages(parsed.input), stream: isStream };

  const tools = convertTools(parsed.tools);
  if (tools) body.tools = tools;
  if (parsed.max_output_tokens) body.max_tokens = parsed.max_output_tokens;
  if (parsed.temperature != null) body.temperature = parsed.temperature;
  if (parsed.top_p != null) body.top_p = parsed.top_p;

  // 供应商特定适配
  if (provider.adaptRequest) provider.adaptRequest(body, parsed);

  return { model, isStream, body };
}

// SSE → Responses API 事件流翻译
export async function* streamTranslate(response, requestId) {
  let buf = '', content = '', reasoning = '', msgStarted = false;

  for await (const chunk of response) {
    buf += chunk.toString();
    const lines = buf.split('\n');
    buf = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') {
        if (msgStarted) {
          yield JSON.stringify({ type: 'response.content_part.done', item_id: `msg-${requestId}-0`, part: { type: 'output_text', text: content } });
          yield JSON.stringify({ type: 'response.output_item.done', item: { id: `msg-${requestId}-0`, type: 'message', status: 'completed' } });
        }
        yield JSON.stringify({ type: 'response.completed', response: { id: `resp-${requestId}`, object: 'response', status: 'completed' } });
        return;
      }
      try {
        const delta = JSON.parse(data).choices?.[0]?.delta;
        if (!delta) continue;
        if (delta.reasoning_content) { reasoning += delta.reasoning_content; continue; }
        if (delta.content) {
          if (!msgStarted) {
            msgStarted = true;
            yield JSON.stringify({ type: 'response.output_item.added', item: { id: `msg-${requestId}-0`, type: 'message', role: 'assistant', status: 'in_progress' } });
            yield JSON.stringify({ type: 'response.content_part.added', item_id: `msg-${requestId}-0`, part: { type: 'output_text', text: '' } });
          }
          content += delta.content;
          yield JSON.stringify({ type: 'response.output_text.delta', item_id: `msg-${requestId}-0`, delta: delta.content });
        }
      } catch { /* skip malformed SSE lines */ }
    }
  }
}
