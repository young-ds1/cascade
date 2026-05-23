// WebSocket RFC 6455 帧编解码测试
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { encodeFrame, encodePing, decodeFrame, acceptKey } from '../lib/ws-frame.mjs';

describe('ws-frame', () => {
  describe('encodeFrame / decodeFrame', () => {
    it('roundtrips a short payload', () => {
      const encoded = encodeFrame('hello');
      const decoded = decodeFrame(encoded);
      assert.equal(decoded.payload, 'hello');
      assert.equal(decoded.consumed, encoded.length);
    });

    it('roundtrips JSON payload', () => {
      const msg = JSON.stringify({ type: 'response.created', id: 'abc-123' });
      const encoded = encodeFrame(msg);
      const decoded = decodeFrame(encoded);
      assert.equal(decoded.payload, msg);
    });

    it('handles fragmented buffer (returns null until complete)', () => {
      const encoded = encodeFrame('test message with longer content');
      const half = Math.floor(encoded.length / 2);
      assert.equal(decodeFrame(encoded.slice(0, half)), null);
      assert.notEqual(decodeFrame(encoded), null);
    });

    it('handles empty payload', () => {
      const encoded = encodeFrame('');
      const decoded = decodeFrame(encoded);
      assert.equal(decoded.payload, '');
    });

    it('handles large payload (>65536 bytes)', () => {
      const large = 'x'.repeat(70000);
      const encoded = encodeFrame(large);
      const decoded = decodeFrame(encoded);
      assert.equal(decoded.payload, large);
    });

    it('handles Chinese characters', () => {
      const msg = '你好世界！Cascade 代理已启动';
      const encoded = encodeFrame(msg);
      const decoded = decodeFrame(encoded);
      assert.equal(decoded.payload, msg);
    });
  });

  describe('encodePing', () => {
    it('produces a valid ping frame', () => {
      const ping = encodePing();
      assert.equal(ping[0], 0x89); // FIN + ping opcode
      assert.equal(ping[1], 0x00); // zero-length payload
    });
  });

  describe('acceptKey', () => {
    it('computes correct accept key', () => {
      const key = 'dGhlIHNhbXBsZSBub25jZQ==';
      assert.equal(acceptKey(key), 's3pPLMBiTxaQ9kYGzzhZRbK+xOo=');
    });
  });

  describe('multiple frames in buffer', () => {
    it('decodes consecutive frames', () => {
      const f1 = encodeFrame('first');
      const f2 = encodeFrame('second');
      const combined = Buffer.concat([f1, f2]);

      const r1 = decodeFrame(combined);
      assert.equal(r1.payload, 'first');
      const remainder = combined.slice(r1.consumed);
      const r2 = decodeFrame(remainder);
      assert.equal(r2.payload, 'second');
    });
  });
});
