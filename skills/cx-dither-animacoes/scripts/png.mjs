// png.mjs — codificador e decodificador mínimo de PNG, sem dependências (usa só node:zlib).
//
// encodePNG({ width, height, data, channels })  -> Buffer   (channels: 1 cinza, 3 RGB, 4 RGBA; 8 bits)
// decodePNG(buffer)                              -> { width, height, data: Uint8Array RGBA }
//   Suporta 1/2/4/8/16 bits, tipos de cor 0, 2, 3, 4 e 6, sem entrelaçamento (Adam7 lança erro;
//   o dither-image.mjs então cai para o Chromium, que decodifica qualquer formato).
import zlib from "node:zlib";

const SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

let crcTable = null;
function crc32(buf) {
  if (typeof zlib.crc32 === "function") return zlib.crc32(buf) >>> 0;
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

export function encodePNG({ width, height, data, channels = 4 }) {
  const colorType = { 1: 0, 3: 2, 4: 6 }[channels];
  if (colorType === undefined) throw new RangeError("channels deve ser 1, 3 ou 4");
  if (data.length !== width * height * channels) throw new RangeError("tamanho de data não confere com width*height*channels");
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bits por canal
  ihdr[9] = colorType;
  const stride = width * channels;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filtro "None"
    Buffer.from(data.buffer, data.byteOffset + y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }
  return Buffer.concat([
    SIGNATURE,
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

export function decodePNG(buf) {
  if (buf.length < 8 || !buf.subarray(0, 8).equals(SIGNATURE)) throw new Error("não é um PNG");
  let pos = 8;
  let ihdr = null;
  let plte = null;
  let trns = null;
  const idat = [];
  while (pos + 8 <= buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("latin1", pos + 4, pos + 8);
    const body = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") ihdr = body;
    else if (type === "PLTE") plte = body;
    else if (type === "tRNS") trns = body;
    else if (type === "IDAT") idat.push(body);
    else if (type === "IEND") break;
    pos += 12 + len;
  }
  if (!ihdr) throw new Error("PNG sem IHDR");
  const width = ihdr.readUInt32BE(0);
  const height = ihdr.readUInt32BE(4);
  const depth = ihdr[8];
  const colorType = ihdr[9];
  if (ihdr[12] !== 0) throw new Error("PNG entrelaçado (Adam7) não suportado");
  const samples = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
  if (!samples) throw new Error("tipo de cor PNG inválido: " + colorType);
  const bitsPerPixel = samples * depth;
  const bpp = Math.max(1, bitsPerPixel >> 3);
  const stride = Math.ceil((width * bitsPerPixel) / 8);
  const inflated = zlib.inflateSync(Buffer.concat(idat));
  const rows = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const ft = inflated[y * (stride + 1)];
    const src = y * (stride + 1) + 1;
    const dst = y * stride;
    for (let i = 0; i < stride; i++) {
      const x = inflated[src + i];
      const a = i >= bpp ? rows[dst + i - bpp] : 0;
      const b = y > 0 ? rows[dst - stride + i] : 0;
      const c = i >= bpp && y > 0 ? rows[dst - stride + i - bpp] : 0;
      let v;
      switch (ft) {
        case 0: v = x; break;
        case 1: v = x + a; break;
        case 2: v = x + b; break;
        case 3: v = x + ((a + b) >> 1); break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
          v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
          break;
        }
        default: throw new Error("filtro PNG inválido: " + ft);
      }
      rows[dst + i] = v & 255;
    }
  }
  const out = new Uint8Array(width * height * 4);
  const maxv = (1 << Math.min(depth, 8)) - 1;
  const sample = (y, idx) => {
    // idx = índice da amostra na linha (em unidades de amostra)
    if (depth === 8) return rows[y * stride + idx];
    if (depth === 16) return rows[y * stride + idx * 2]; // byte alto
    const bit = idx * depth;
    const byte = rows[y * stride + (bit >> 3)];
    return (byte >> (8 - depth - (bit & 7))) & maxv;
  };
  const scale = (v) => (depth >= 8 ? v : Math.round((v * 255) / maxv));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4;
      if (colorType === 0) {
        const g = scale(sample(y, x));
        out[o] = out[o + 1] = out[o + 2] = g;
        out[o + 3] = 255;
      } else if (colorType === 2) {
        out[o] = sample(y, x * 3);
        out[o + 1] = sample(y, x * 3 + 1);
        out[o + 2] = sample(y, x * 3 + 2);
        out[o + 3] = 255;
      } else if (colorType === 3) {
        const i = sample(y, x);
        out[o] = plte[i * 3];
        out[o + 1] = plte[i * 3 + 1];
        out[o + 2] = plte[i * 3 + 2];
        out[o + 3] = trns && i < trns.length ? trns[i] : 255;
      } else if (colorType === 4) {
        const g = sample(y, x * 2);
        out[o] = out[o + 1] = out[o + 2] = g;
        out[o + 3] = sample(y, x * 2 + 1);
      } else {
        out[o] = sample(y, x * 4);
        out[o + 1] = sample(y, x * 4 + 1);
        out[o + 2] = sample(y, x * 4 + 2);
        out[o + 3] = sample(y, x * 4 + 3);
      }
    }
  }
  return { width, height, data: out };
}
