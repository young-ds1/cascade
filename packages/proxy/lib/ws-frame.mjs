// WebSocket RFC 6455 frame encode/decode
import crypto from 'crypto';

const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

export function acceptKey(key) {
  return crypto.createHash('sha1').update(key + WS_GUID).digest('base64');
}

export function encodeFrame(payload) {
  const buf = Buffer.from(payload, 'utf8');
  const len = buf.length;
  if (len < 126) return Buffer.concat([Buffer.from([0x81, len]), buf]);
  if (len < 65536) return Buffer.concat([Buffer.from([0x81, 126, (len >> 8) & 0xff, len & 0xff]), buf]);
  const b = Buffer.alloc(10);
  b[0] = 0x81; b[1] = 127;
  b.writeBigUInt64BE(BigInt(len), 2);
  return Buffer.concat([b, buf]);
}

export function encodePing() {
  return Buffer.from([0x89, 0x00]);
}

export function decodeFrame(buffer) {
  if (buffer.length < 2) return null;
  const masked = (buffer[1] & 0x80) !== 0;
  let len = buffer[1] & 0x7f;
  let offset = 2;
  if (len === 126) { if (buffer.length < 4) return null; len = buffer.readUInt16BE(2); offset = 4; }
  else if (len === 127) { if (buffer.length < 10) return null; len = Number(buffer.readBigUInt64BE(2)); offset = 10; }
  const maskOff = offset; offset += masked ? 4 : 0;
  if (buffer.length < offset + len) return null;
  const payload = buffer.slice(offset, offset + len);
  if (masked) { const m = buffer.slice(maskOff, maskOff + 4); for (let i = 0; i < payload.length; i++) payload[i] ^= m[i % 4]; }
  return { payload: payload.toString('utf8'), consumed: offset + len };
}
