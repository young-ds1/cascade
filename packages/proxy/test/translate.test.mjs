// Responses API ↔ Chat Completions 翻译测试
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { convertMessages, convertTools, buildRequestBody, streamTranslate } from '../lib/translate.mjs';

describe('translate', () => {
  describe('convertMessages', () => {
    it('converts developer role to system', () => {
      const input = [{ role: 'developer', content: 'You are a helpful assistant' }];
      const result = convertMessages(input);
      assert.equal(result[0].role, 'system');
      assert.equal(result[0].content, 'You are a helpful assistant');
    });

    it('handles multimodal content arrays', () => {
      const input = [{
        role: 'user',
        content: [
          { type: 'input_text', text: 'Describe this image' },
          { type: 'input_image', image_url: { url: 'https://example.com/img.png' } },
        ],
      }];
      const result = convertMessages(input);
      assert.ok(result[0].content.includes('Describe this image'));
      assert.ok(result[0].content.includes('input_image'));
    });

    it('handles null content', () => {
      const input = [{ role: 'assistant', content: null }];
      const result = convertMessages(input);
      assert.equal(result[0].content, '');
    });

    it('handles empty input', () => {
      assert.deepEqual(convertMessages([]), []);
      assert.deepEqual(convertMessages(null), []);
      assert.deepEqual(convertMessages(undefined), []);
    });
  });

  describe('convertTools', () => {
    it('filters to function type only', () => {
      const tools = [
        { type: 'function', name: 'search', description: 'search the web', parameters: { type: 'object' } },
        { type: 'code_interpreter' },
      ];
      const result = convertTools(tools);
      assert.equal(result.length, 1);
      assert.equal(result[0].type, 'function');
      assert.equal(result[0].function.name, 'search');
    });

    it('returns undefined for empty/null', () => {
      assert.equal(convertTools([]), undefined);
      assert.equal(convertTools(null), undefined);
    });
  });

  describe('buildRequestBody', () => {
    const provider = { model: 'test-model' };

    it('builds basic request', () => {
      const { body, isStream, model } = buildRequestBody({ input: [] }, provider);
      assert.equal(model, 'test-model');
      assert.equal(isStream, true);
      assert.equal(body.stream, true);
    });

    it('respects explicit stream=false', () => {
      const { isStream } = buildRequestBody({ input: [], stream: false }, provider);
      assert.equal(isStream, false);
    });

    it('passes max_output_tokens as max_tokens', () => {
      const { body } = buildRequestBody({ input: [], max_output_tokens: 4096 }, provider);
      assert.equal(body.max_tokens, 4096);
    });

    it('applies provider adaptRequest hook', () => {
      const p = {
        model: 'custom',
        adaptRequest(body) { body.custom_field = true; },
      };
      const { body } = buildRequestBody({ input: [] }, p);
      assert.equal(body.custom_field, true);
    });
  });

  describe('streamTranslate', () => {
    it('emits content events for stream chunks', async () => {
      const stream = Readable.from([
        'data: {"choices":[{"delta":{"content":"Hello"}}]}\n',
        'data: {"choices":[{"delta":{"content":" World"}}]}\n',
        'data: [DONE]\n',
      ]);

      const events = [];
      for await (const evt of streamTranslate(stream, 'test')) {
        events.push(JSON.parse(evt));
      }

      const types = events.map(e => e.type);
      assert.ok(types.includes('response.output_item.added'));
      assert.ok(types.includes('response.content_part.added'));
      assert.ok(types.includes('response.output_text.delta'));
      assert.ok(types.includes('response.content_part.done'));
      assert.ok(types.includes('response.output_item.done'));
      assert.ok(types.includes('response.completed'));
    });

    it('skips reasoning content but keeps connection alive', async () => {
      const stream = Readable.from([
        'data: {"choices":[{"delta":{"reasoning_content":"thinking..."}}]}\n',
        'data: {"choices":[{"delta":{"content":"Answer"}}]}\n',
        'data: [DONE]\n',
      ]);

      const events = [];
      for await (const evt of streamTranslate(stream, 'test')) {
        events.push(JSON.parse(evt));
      }

      const deltas = events.filter(e => e.type === 'response.output_text.delta');
      assert.equal(deltas.length, 1);
      assert.equal(deltas[0].delta, 'Answer');
    });

    it('handles malformed JSON gracefully', async () => {
      const stream = Readable.from([
        'data: {broken json\n',
        'data: {"choices":[{"delta":{"content":"OK"}}]}\n',
        'data: [DONE]\n',
      ]);

      const events = [];
      for await (const evt of streamTranslate(stream, 'test')) {
        events.push(JSON.parse(evt));
      }
      // Should still get the valid event and completion
      assert.ok(events.length > 0);
    });
  });
});
