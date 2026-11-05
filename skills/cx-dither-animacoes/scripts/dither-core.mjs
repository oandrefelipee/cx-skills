// dither-core.mjs — algoritmos de dither de imagem em JS puro (sem DOM, roda em Node e no navegador).
// Usado por dither-image.mjs e pelo selftest.mjs.
//
// Pipeline de ditherImage():
//   1. (opcional) redimensiona a imagem e reduz para a grade de células (cell px por célula), calculando a média em luz linear;
//   2. converte para o espaço de trabalho (linear por padrão: a proporção de pixels acesos passa a bater com o brilho percebido,
//      ver Surma "Ditherpunk", seção Gamma);
//   3. escolhe um índice da paleta por pixel com o algoritmo pedido;
//   4. devolve os índices e o RGBA final (opcionalmente ampliado por vizinho mais próximo).
//
// Modos de paleta:
//   "luma": a paleta é uma rampa tonal ordenada por luminância; o dither mistura os dois tons vizinhos na proporção certa
//           (é o que os snippets e o playground fazem com --c0..--c3). Ignora o matiz da imagem de entrada.
//   "rgb" : preserva o matiz: escolhe a cor da paleta mais próxima de (cor + spread·(limiar − 0.5)) por canal.
import { bayerMatrix } from "./bayer.mjs";
import { blueNoise } from "./blue-noise.mjs";

// ---- cor ----
export const srgbToLinear = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
export const linearToSrgb = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
export const lumaOf = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

export function parseHex(s) {
  let h = String(s).trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error(`cor inválida: "${s}" (use #rgb ou #rrggbb)`);
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** Paletas prontas (escuro -> claro quando faz sentido). Valores populares, não normas oficiais: veja references/algoritmos.md. */
export const PALETTES = {
  "1bit": ["#000000", "#ffffff"],
  mac: ["#000000", "#ffffff"],
  gameboy: ["#0f380f", "#306230", "#8bac0f", "#9bbc0f"],
  "cga0": ["#000000", "#00aa00", "#aa0000", "#aa5500"],
  "cga0-hi": ["#000000", "#55ff55", "#ff5555", "#ffff55"],
  "cga1": ["#000000", "#00aaaa", "#aa00aa", "#aaaaaa"],
  "cga1-hi": ["#000000", "#55ffff", "#ff55ff", "#ffffff"],
  ega: ["#000000", "#0000aa", "#00aa00", "#00aaaa", "#aa0000", "#aa00aa", "#aa5500", "#aaaaaa",
        "#555555", "#5555ff", "#55ff55", "#55ffff", "#ff5555", "#ff55ff", "#ffff55", "#ffffff"],
  apple2: ["#000000", "#ffffff", "#14f53c", "#ff44fd", "#ff6a3c", "#14cff5"], // alta resolução, aproximação NTSC
  pico8: ["#000000", "#1d2b53", "#7e2553", "#008751", "#ab5236", "#5f574f", "#c2c3c7", "#fff1e8",
          "#ff004d", "#ffa300", "#ffec27", "#00e436", "#29adff", "#83769c", "#ff77a8", "#ffccaa"],
  rgb8: ["#000000", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff", "#ffffff"],
};

/**
 * k-means leve no RGB (sRGB 0..255): devolve k cores que representam a imagem, ordenadas do escuro ao claro (o que o modo luma espera).
 * Amostra no máximo ~4096 pixels e usa centros iniciais espaçados por luminância: determinístico, sem sorteio. Ignora pixels transparentes.
 */
export function kmeansPalette(rgba, k = 4, iters = 12) {
  if (k < 2 || k > 256) throw new Error("kmeans:N exige 2 <= N <= 256");
  const n = rgba.length / 4, step = Math.max(1, Math.floor(n / 4096)), pts = [];
  for (let i = 0; i < n; i += step) if (rgba[4 * i + 3] > 127) pts.push([rgba[4 * i], rgba[4 * i + 1], rgba[4 * i + 2]]);
  if (pts.length < k) throw new Error("poucos pixels opacos para kmeans:" + k);
  const lum = (p) => 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2];
  const sorted = [...pts].sort((a, b) => lum(a) - lum(b));
  let cen = Array.from({ length: k }, (_, i) => [...sorted[Math.floor(((i + 0.5) * sorted.length) / k)]]);
  for (let it = 0; it < iters; it++) {
    const sum = cen.map(() => [0, 0, 0, 0]);
    for (const p of pts) {
      let best = 0, bd = Infinity;
      for (let j = 0; j < k; j++) { const c = cen[j], d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2; if (d < bd) { bd = d; best = j; } }
      const a = sum[best]; a[0] += p[0]; a[1] += p[1]; a[2] += p[2]; a[3]++;
    }
    cen = cen.map((c, j) => (sum[j][3] ? [sum[j][0] / sum[j][3], sum[j][1] / sum[j][3], sum[j][2] / sum[j][3]] : c));
  }
  return cen.map((c) => c.map(Math.round)).sort((a, b) => lum(a) - lum(b));
}

/** "gameboy" | "gray:4" | "#000,#888,#fff" | array de [r,g,b] -> array de [r,g,b] (0..255). */
export function parsePalette(spec) {
  if (Array.isArray(spec)) return spec.map((c) => (typeof c === "string" ? parseHex(c) : c));
  const s = String(spec ?? "1bit").trim();
  if (PALETTES[s]) return PALETTES[s].map(parseHex);
  const g = /^gray:(\d+)$/.exec(s);
  if (g) {
    const n = Number(g[1]);
    if (n < 2 || n > 256) throw new Error("gray:N exige 2 <= N <= 256");
    return Array.from({ length: n }, (_, i) => { const v = Math.round((i * 255) / (n - 1)); return [v, v, v]; });
  }
  const list = s.split(",").map((x) => x.trim()).filter(Boolean);
  if (list.length < 2) throw new Error(`paleta inválida: "${s}". Nomes: ${Object.keys(PALETTES).join(", ")}, gray:N ou lista "#000,#fff".`);
  return list.map(parseHex);
}

// ---- núcleos de difusão de erro: [dx, dy, peso], divisor ----
export const KERNELS = {
  "floyd-steinberg": { div: 16, taps: [[1, 0, 7], [-1, 1, 3], [0, 1, 5], [1, 1, 1]] },
  atkinson: { div: 8, taps: [[1, 0, 1], [2, 0, 1], [-1, 1, 1], [0, 1, 1], [1, 1, 1], [0, 2, 1]] },
  jarvis: { div: 48, taps: [[1, 0, 7], [2, 0, 5], [-2, 1, 3], [-1, 1, 5], [0, 1, 7], [1, 1, 5], [2, 1, 3], [-2, 2, 1], [-1, 2, 3], [0, 2, 5], [1, 2, 3], [2, 2, 1]] },
  stucki: { div: 42, taps: [[1, 0, 8], [2, 0, 4], [-2, 1, 2], [-1, 1, 4], [0, 1, 8], [1, 1, 4], [2, 1, 2], [-2, 2, 1], [-1, 2, 2], [0, 2, 4], [1, 2, 2], [2, 2, 1]] },
  burkes: { div: 32, taps: [[1, 0, 8], [2, 0, 4], [-2, 1, 2], [-1, 1, 4], [0, 1, 8], [1, 1, 4], [2, 1, 2]] },
  sierra: { div: 32, taps: [[1, 0, 5], [2, 0, 3], [-2, 1, 2], [-1, 1, 4], [0, 1, 5], [1, 1, 4], [2, 1, 2], [-1, 2, 2], [0, 2, 3], [1, 2, 2]] },
  sierra2: { div: 16, taps: [[1, 0, 4], [2, 0, 3], [-2, 1, 1], [-1, 1, 2], [0, 1, 3], [1, 1, 2], [2, 1, 1]] },
  "sierra-lite": { div: 4, taps: [[1, 0, 2], [-1, 1, 1], [0, 1, 1]] },
};

export const ORDERED = ["threshold", "random", "bayer", "bayer-n", "blue-noise"];
export const ALGOS = [...ORDERED, ...Object.keys(KERNELS)];

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Função de limiar t(x, y) em (0,1) para os algoritmos ordenados. */
export function thresholdFn(algo, { size = 8, seed = 1 } = {}) {
  switch (algo) {
    case "threshold": return () => 0.5;
    case "random": { const r = mulberry32(seed); return () => r(); }
    case "bayer": case "bayer-n": {
      const n = algo === "bayer" ? 8 : size;
      const m = bayerMatrix(n);
      return (x, y) => (m[y % n][x % n] + 0.5) / (n * n);
    }
    case "blue-noise": {
      const n = size >= 8 ? size : 64;
      const r = blueNoise(n, { seed });
      return (x, y) => (r[(y % n) * n + (x % n)] + 0.5) / (n * n);
    }
    default: throw new Error("algoritmo ordenado desconhecido: " + algo);
  }
}

// ---- reamostragem em luz linear ----
function resampleLinear(src, sw, sh, lw, lh, opts) {
  const { contrast = 1, brightness = 0, invert = false, bg = [255, 255, 255] } = opts;
  const lut = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    let v = i / 255;
    if (invert) v = 1 - v;
    v = Math.min(1, Math.max(0, (v - 0.5) * contrast + 0.5 + brightness));
    lut[i] = srgbToLinear(v);
  }
  const bgLin = bg.map((c) => srgbToLinear(c / 255));
  const px = (x, y, out) => {
    const o = (y * sw + x) * 4;
    const a = src[o + 3] / 255;
    for (let c = 0; c < 3; c++) out[c] = lut[src[o + c]] * a + bgLin[c] * (1 - a);
  };
  const out = new Float32Array(lw * lh * 3);
  const t = [0, 0, 0];
  if (lw * lh <= sw * sh) {
    // redução por média de caixa
    const fx = sw / lw, fy = sh / lh;
    for (let y = 0; y < lh; y++) {
      const y0 = Math.floor(y * fy), y1 = Math.max(y0 + 1, Math.min(sh, Math.floor((y + 1) * fy)));
      for (let x = 0; x < lw; x++) {
        const x0 = Math.floor(x * fx), x1 = Math.max(x0 + 1, Math.min(sw, Math.floor((x + 1) * fx)));
        let r = 0, g = 0, b = 0, n = 0;
        for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) { px(xx, yy, t); r += t[0]; g += t[1]; b += t[2]; n++; }
        const o = (y * lw + x) * 3;
        out[o] = r / n; out[o + 1] = g / n; out[o + 2] = b / n;
      }
    }
  } else {
    // ampliação bilinear
    const a = [0, 0, 0], b = [0, 0, 0], c = [0, 0, 0], d = [0, 0, 0];
    for (let y = 0; y < lh; y++) {
      const sy = Math.min(sh - 1, Math.max(0, ((y + 0.5) * sh) / lh - 0.5));
      const y0 = Math.floor(sy), y1 = Math.min(sh - 1, y0 + 1), wy = sy - y0;
      for (let x = 0; x < lw; x++) {
        const sx = Math.min(sw - 1, Math.max(0, ((x + 0.5) * sw) / lw - 0.5));
        const x0 = Math.floor(sx), x1 = Math.min(sw - 1, x0 + 1), wx = sx - x0;
        px(x0, y0, a); px(x1, y0, b); px(x0, y1, c); px(x1, y1, d);
        const o = (y * lw + x) * 3;
        for (let k = 0; k < 3; k++) out[o + k] = (a[k] * (1 - wx) + b[k] * wx) * (1 - wy) + (c[k] * (1 - wx) + d[k] * wx) * wy;
      }
    }
  }
  return out;
}

/**
 * @param {{width:number,height:number,data:Uint8Array|Uint8ClampedArray}} img  RGBA 8 bits
 * @param {object} o
 *   algo ("bayer"), size (matriz: bayer-n 2..32; blue-noise 64), palette ("1bit"; também "kmeans:N" = N cores tiradas da imagem), mode ("luma"|"rgb"), space ("linear"|"srgb"),
 *   cell (1), width (largura alvo antes de reduzir pela célula), serpentine (false), contrast, brightness, invert,
 *   spread (modo rgb; "auto"), seed (1), upscale (true), bg ([255,255,255])
 */
export function ditherImage(img, o = {}) {
  const {
    algo = "bayer", size = 8, palette = "1bit", mode = "luma", space = "linear", cell = 1, width = 0,
    serpentine = false, contrast = 1, brightness = 0, invert = false, spread = "auto", seed = 1, upscale = true,
  } = o;
  if (!ALGOS.includes(algo)) throw new Error(`algoritmo "${algo}" desconhecido. Opções: ${ALGOS.join(", ")}`);
  if (!["luma", "rgb"].includes(mode)) throw new Error("mode deve ser luma ou rgb");
  if (!["linear", "srgb"].includes(space)) throw new Error("space deve ser linear ou srgb");
  const km = typeof palette === "string" ? /^kmeans:(\d+)$/.exec(palette.trim()) : null;   // paleta tirada da própria imagem
  const pal = km ? kmeansPalette(img.data, Number(km[1])) : parsePalette(palette);

  const outW0 = width > 0 ? Math.round(width) : img.width;
  const outH0 = Math.max(1, Math.round((img.height * outW0) / img.width));
  const lw = Math.max(1, Math.floor(outW0 / cell));
  const lh = Math.max(1, Math.round(outH0 / cell));

  // espaço de trabalho
  const lin = resampleLinear(img.data, img.width, img.height, lw, lh, { contrast, brightness, invert, bg: o.bg });
  const toWork = space === "linear" ? (v) => v : (v) => linearToSrgb(Math.min(1, Math.max(0, v)));
  const work = new Float32Array(lin.length);
  for (let i = 0; i < lin.length; i++) work[i] = toWork(lin[i]);
  const palWork = pal.map(([r, g, b]) => {
    const l = [r, g, b].map((c) => srgbToLinear(c / 255));
    return l.map(toWork);
  });
  const palLuma = palWork.map(([r, g, b]) => lumaOf(r, g, b));

  // ordem de índices por luminância (modo luma)
  const sorted = pal.map((_, i) => i).sort((a, b) => palLuma[a] - palLuma[b]);
  const yRamp = sorted.map((i) => palLuma[i]);

  const idx = new Uint16Array(lw * lh);
  const isOrdered = ORDERED.includes(algo);

  const nearestRgb = (r, g, b) => {
    let best = 0, bd = Infinity;
    for (let i = 0; i < palWork.length; i++) {
      const p = palWork[i];
      const d = (p[0] - r) ** 2 + (p[1] - g) ** 2 + (p[2] - b) ** 2;
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  };
  const nearestRamp = (y) => {
    let best = 0, bd = Infinity;
    for (let k = 0; k < yRamp.length; k++) { const d = Math.abs(yRamp[k] - y); if (d < bd) { bd = d; best = k; } }
    return best;
  };

  // amplitude do deslocamento no modo rgb
  let r_spread = 0.5;
  if (mode === "rgb") {
    if (spread === "auto") {
      // grade uniforme de níveis por canal -> o passo; senão distância média ao vizinho mais próximo / √3
      const axes = [0, 1, 2].map((c) => [...new Set(palWork.map((p) => +p[c].toFixed(5)))].sort((a, b) => a - b));
      if (axes[0].length * axes[1].length * axes[2].length === palWork.length) {
        const gaps = axes.flatMap((a) => a.slice(1).map((v, i) => v - a[i]));
        r_spread = gaps.length ? gaps.reduce((s, v) => s + v, 0) / gaps.length : 1;
      } else {
        let s = 0;
        for (let i = 0; i < palWork.length; i++) {
          let m = Infinity;
          for (let j = 0; j < palWork.length; j++) if (i !== j) m = Math.min(m, Math.hypot(...[0, 1, 2].map((c) => palWork[i][c] - palWork[j][c])));
          s += m;
        }
        r_spread = s / palWork.length / Math.sqrt(3);
      }
    } else r_spread = Number(spread);
  }

  if (isOrdered) {
    const thr = thresholdFn(algo, { size, seed });
    for (let y = 0; y < lh; y++) {
      for (let x = 0; x < lw; x++) {
        const t = thr(x, y);
        const o3 = (y * lw + x) * 3;
        if (mode === "luma") {
          const Y = lumaOf(work[o3], work[o3 + 1], work[o3 + 2]);
          let k;
          if (Y <= yRamp[0]) k = 0;
          else if (Y >= yRamp[yRamp.length - 1]) k = yRamp.length - 1;
          else {
            k = 0;
            while (Y > yRamp[k + 1]) k++;
            const f = (Y - yRamp[k]) / (yRamp[k + 1] - yRamp[k]);
            if (f > t) k++;
          }
          idx[y * lw + x] = sorted[k];
        } else {
          const off = r_spread * (t - 0.5);
          idx[y * lw + x] = nearestRgb(work[o3] + off, work[o3 + 1] + off, work[o3 + 2] + off);
        }
      }
    }
  } else {
    const { div, taps } = KERNELS[algo];
    const ch = mode === "luma" ? 1 : 3;
    const buf = new Float32Array(lw * lh * ch);
    if (ch === 1) for (let i = 0; i < lw * lh; i++) buf[i] = lumaOf(work[i * 3], work[i * 3 + 1], work[i * 3 + 2]);
    else buf.set(work);
    const lo = ch === 1 ? yRamp[0] : 0, hi = ch === 1 ? yRamp[yRamp.length - 1] : 1;
    for (let y = 0; y < lh; y++) {
      const rev = serpentine && (y & 1) === 1;
      for (let s = 0; s < lw; s++) {
        const x = rev ? lw - 1 - s : s;
        const i = y * lw + x;
        let chosen;
        const err = [0, 0, 0];
        if (ch === 1) {
          const v = Math.min(hi, Math.max(lo, buf[i]));
          const k = nearestRamp(v);
          chosen = sorted[k];
          err[0] = v - yRamp[k];
        } else {
          const r = Math.min(1, Math.max(0, buf[i * 3])), g = Math.min(1, Math.max(0, buf[i * 3 + 1])), b = Math.min(1, Math.max(0, buf[i * 3 + 2]));
          chosen = nearestRgb(r, g, b);
          const p = palWork[chosen];
          err[0] = r - p[0]; err[1] = g - p[1]; err[2] = b - p[2];
        }
        idx[i] = chosen;
        for (const [dx0, dy, w] of taps) {
          const dx = rev ? -dx0 : dx0;
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || xx >= lw || yy >= lh) continue;
          const j = (yy * lw + xx) * ch;
          const f = w / div;
          for (let c = 0; c < ch; c++) buf[j + c] += err[c] * f;
        }
      }
    }
  }

  // saída
  const sc = upscale ? cell : 1;
  const ow = lw * sc, oh = lh * sc;
  const out = new Uint8Array(ow * oh * 4);
  for (let y = 0; y < oh; y++) {
    for (let x = 0; x < ow; x++) {
      const c = pal[idx[Math.floor(y / sc) * lw + Math.floor(x / sc)]];
      const q = (y * ow + x) * 4;
      out[q] = c[0]; out[q + 1] = c[1]; out[q + 2] = c[2]; out[q + 3] = 255;
    }
  }
  return { width: ow, height: oh, data: out, lowWidth: lw, lowHeight: lh, indices: idx, palette: pal, workLuma: (() => {
    const L = new Float32Array(lw * lh);
    for (let i = 0; i < lw * lh; i++) L[i] = lumaOf(lin[i * 3], lin[i * 3 + 1], lin[i * 3 + 2]);
    return L; // luminância LINEAR da entrada já reduzida (referência para testes de brilho)
  })() };
}

/** Imagem sintética de teste: rampa horizontal, esfera iluminada, listras coloridas e degraus de cinza. */
export function makeTestImage(w = 512, h = 320) {
  const data = new Uint8Array(w * h * 4);
  const set = (x, y, r, g, b) => { const o = (y * w + x) * 4; data[o] = r; data[o + 1] = g; data[o + 2] = b; data[o + 3] = 255; };
  const band = Math.floor(h * 0.18);
  const steps = Math.floor(h * 0.16);
  const midTop = band, midBot = h - steps;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r, g, b;
      if (y < band) { // rampa preto -> branco (gradiente suave)
        r = g = b = Math.round((x / (w - 1)) * 255);
      } else if (y >= midBot) { // degraus de cinza em sRGB (8 tons)
        const k = Math.min(7, Math.floor((x / w) * 8));
        r = g = b = Math.round((k / 7) * 255);
      } else {
        const mx = x / w, my = (y - midTop) / (midBot - midTop);
        if (mx < 0.5) { // esfera com luz (esquerda)
          const cx = 0.25, cy = 0.5;
          const dx = (mx - cx) * w, dy = (my - cy) * (midBot - midTop), R = (midBot - midTop) * 0.42;
          const d2 = (dx * dx + dy * dy) / (R * R);
          if (d2 <= 1) {
            const nz = Math.sqrt(1 - d2), nx = dx / R, ny = dy / R;
            const l = Math.max(0, nx * -0.5 + ny * -0.6 + nz * 0.62);
            const v = 0.06 + 0.94 * l;
            r = Math.round(255 * Math.min(1, v * 1.05)); g = Math.round(255 * v * 0.85); b = Math.round(255 * v * 0.65);
          } else { // fundo: gradiente diagonal azulado
            const t = (mx + my) / 1.5;
            r = Math.round(40 + 40 * t); g = Math.round(60 + 60 * t); b = Math.round(110 + 90 * t);
          }
        } else { // listras diagonais com matiz variando (direita)
          const u = (mx - 0.5) * 2, t = ((u + my) * 6) % 1;
          const hue = (u * 300 + my * 60) % 360;
          const s = 0.75, v = 0.35 + 0.6 * Math.abs(t * 2 - 1);
          const c = v * s, hp = hue / 60, xx = c * (1 - Math.abs((hp % 2) - 1));
          const [r1, g1, b1] = hp < 1 ? [c, xx, 0] : hp < 2 ? [xx, c, 0] : hp < 3 ? [0, c, xx] : hp < 4 ? [0, xx, c] : hp < 5 ? [xx, 0, c] : [c, 0, xx];
          const m = v - c;
          r = Math.round((r1 + m) * 255); g = Math.round((g1 + m) * 255); b = Math.round((b1 + m) * 255);
        }
      }
      set(x, y, r, g, b);
    }
  }
  return { width: w, height: h, data };
}
