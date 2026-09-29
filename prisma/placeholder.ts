import { deflateSync } from "zlib";

function crc32(buf: Buffer): number {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
  }
  return ~c >>> 0;
}

function chunk(type: string, data: Buffer) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}

function hex(h: string): [number, number, number] {
  const s = h.replace("#", "");
  return [
    Number.parseInt(s.slice(0, 2), 16),
    Number.parseInt(s.slice(2, 4), 16),
    Number.parseInt(s.slice(4, 6), 16),
  ];
}

/** Small gradient PNG so the demo works with no network and no image library. */
export function gradientPng(width: number, height: number, from: string, to: string): Buffer {
  const a = hex(from);
  const b = hex(to);
  const raw = Buffer.alloc((width * 3 + 1) * height);
  let offset = 0;
  for (let y = 0; y < height; y++) {
    raw[offset++] = 0;
    const ty = height === 1 ? 0 : y / (height - 1);
    for (let x = 0; x < width; x++) {
      const tx = width === 1 ? 0 : x / (width - 1);
      const t = tx * 0.55 + ty * 0.45;
      raw[offset++] = Math.round(a[0] + (b[0] - a[0]) * t);
      raw[offset++] = Math.round(a[1] + (b[1] - a[1]) * t);
      raw[offset++] = Math.round(a[2] + (b[2] - a[2]) * t);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
