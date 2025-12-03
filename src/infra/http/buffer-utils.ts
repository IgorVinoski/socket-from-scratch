import { DynamicBuffer } from "../models/dynamic-buffer";

export const BufferUtils = {
  push(buf: DynamicBuffer, data: Buffer): void {
    const newLen = buf.length + data.length;
    if (buf.data.length < newLen) {
      let cap = Math.max(buf.data.length || 32, 32);
      while (cap < newLen) cap *= 2;
      const grown = Buffer.alloc(cap);
      if (buf.length > 0) buf.data.copy(grown, 0, 0, buf.length);
      buf.data = grown;
    }
    data.copy(buf.data, buf.length, 0);
    buf.length = newLen;
  },

  pop(buf: DynamicBuffer, n: number): void {
    if (n === 0 || n === buf.length) {
      buf.length = n === 0 ? buf.length : 0;
      return;
    }
    buf.data.copy(buf.data, 0, n, buf.length);
    buf.length -= n;
  },

  splitLines(data: Buffer): Buffer[] {
    const parts: Buffer[] = [];
    let start = 0;
    for (let i = 0; i < data.length; i++) {
      if (i + 1 < data.length && data[i] === 0x0d && data[i + 1] === 0x0a) {
        parts.push(Buffer.from(data.subarray(start, i)));
        i++;
        start = i + 1;
      }
    }
    parts.push(Buffer.from(data.subarray(start)));
    return parts;
  },
};