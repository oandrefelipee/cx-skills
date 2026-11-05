#!/usr/bin/env node
// blue-noise.mjs — gera uma textura de ruído azul (blue noise) por "void-and-cluster" (Ulichney, 1993), em JS puro.
//
// Uso:
//   node blue-noise.mjs 64 --out bluenoise64.png        # PNG cinza 64x64 (rank/N² * 255), repete sem emenda (toro)
//   node blue-noise.mjs 64 --format json                # {n, ranks[]} (ranks 0..N²-1)
//   node blue-noise.mjs --test                          # confere permutação, determinismo e que há menos energia em baixas frequências que o ruído branco
//
// Como funciona (resumo do método, https://cv.ulichney.com/papers/1993-void-cluster.pdf):
//   1. Mantém um "campo de energia" E = soma de gaussianas (σ≈1.5) centradas nos pixels ligados, sobre um toro (a imagem dá a volta nas bordas).
//   2. Padrão inicial: ~10% de pixels aleatórios. Repetidamente tira o pixel do aglomerado mais denso (maior E entre os ligados)
//      e põe no maior vazio (menor E entre os desligados), até estabilizar.
//   3. Fase 1: do padrão inicial, retira o aglomerado mais denso um a um, atribuindo ranks decrescentes (K-1 ... 0).
//   4. Fase 2: do padrão inicial, liga o maior vazio um a um, atribuindo ranks crescentes (K ... N²-1).
//   O resultado é uma permutação de 0..N²-1. Limiar normalizado = (rank + 0.5) / N².
// Custo: O(N⁴) pela busca do máximo/mínimo; 64x64 leva ~0.3 s, 128x128 uns segundos. Para N >= 256 use as texturas prontas
// de Christoph Peters (CC0): http://momentsingraphics.de/BlueNoise.html
import { pathToFileURL } from "node:url";
import { writeFileSync } from "node:fs";

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

/** Retorna Uint16Array de n*n ranks (permutação de 0..n²-1), linha a linha. Determinístico para o mesmo seed. */
export function blueNoise(n = 64, { sigma = 1.5, seed = 1 } = {}) {
  const N = n * n;
  const R = Math.ceil(sigma * 3);
  const kernel = [];
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) kernel.push([dx, dy, Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma))]);
  const E = new Float64Array(N);
  const bp = new Uint8Array(N);
  const add = (i, s) => {
    const x0 = i % n, y0 = (i / n) | 0;
    for (const [dx, dy, w] of kernel) E[(((y0 + dy) % n) + n) % n * n + ((((x0 + dx) % n) + n) % n)] += s * w;
  };
  const setBit = (i, on) => {
    bp[i] = on ? 1 : 0;
    add(i, on ? 1 : -1);
  };
  const tightestCluster = () => {
    let best = -1, bv = -Infinity;
    for (let i = 0; i < N; i++) if (bp[i] && E[i] > bv) { bv = E[i]; best = i; }
    return best;
  };
  const largestVoid = () => {
    let best = -1, bv = Infinity;
    for (let i = 0; i < N; i++) if (!bp[i] && E[i] < bv) { bv = E[i]; best = i; }
    return best;
  };

  // 2. padrão inicial
  const rnd = mulberry32(seed);
  const K = Math.max(1, Math.round(N / 10));
  const order = Array.from({ length: N }, (_, i) => i);
  for (let i = N - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  for (let i = 0; i < K; i++) setBit(order[i], true);
  for (let guard = 0; guard < 4 * N; guard++) {
    const c = tightestCluster();
    setBit(c, false);
    const v = largestVoid();
    setBit(v, true);
    if (v === c) break;
  }
  const initial = Uint8Array.from(bp);

  const ranks = new Uint16Array(N);
  // 3. fase 1
  let ones = 0;
  for (let i = 0; i < N; i++) ones += bp[i];
  for (let r = ones - 1; r >= 0; r--) {
    const c = tightestCluster();
    setBit(c, false);
    ranks[c] = r;
  }
  // restaura o padrão inicial
  E.fill(0);
  bp.fill(0);
  for (let i = 0; i < N; i++) if (initial[i]) setBit(i, true);
  // 4. fase 2 (e 3: o "maior vazio" vale até preencher tudo, porque a soma de energia sobre o toro é constante)
  for (let r = ones; r < N; r++) {
    const v = largestVoid();
    setBit(v, true);
    ranks[v] = r;
  }
  return ranks;
}

/** Limiares normalizados em (0,1). */
export function blueNoiseThresholds(n = 64, opts) {
  const r = blueNoise(n, opts);
  const out = new Float32Array(r.length);
  for (let i = 0; i < r.length; i++) out[i] = (r[i] + 0.5) / r.length;
  return out;
}

/** Variância do mapa depois de um desfoque gaussiano no toro: mede energia de baixa frequência. */
export function lowFreqVariance(values, n, sigma = 1.5) {
  const R = Math.ceil(sigma * 3);
  const k = [];
  let s = 0;
  for (let d = -R; d <= R; d++) { const w = Math.exp(-(d * d) / (2 * sigma * sigma)); k.push(w); s += w; }
  const kn = k.map((w) => w / s);
  const tmp = new Float64Array(n * n), out = new Float64Array(n * n);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    let a = 0;
    for (let d = -R; d <= R; d++) a += kn[d + R] * values[y * n + ((x + d + n * 8) % n)];
    tmp[y * n + x] = a;
  }
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    let a = 0;
    for (let d = -R; d <= R; d++) a += kn[d + R] * tmp[((y + d + n * 8) % n) * n + x];
    out[y * n + x] = a;
  }
  let m = 0;
  for (const v of out) m += v;
  m /= out.length;
  let v2 = 0;
  for (const v of out) v2 += (v - m) ** 2;
  return v2 / out.length;
}

export function selfTest() {
  const report = [];
  const ok = (cond, msg) => { if (!cond) throw new Error("FALHOU: " + msg); report.push("ok  " + msg); };
  const n = 32;
  const t0 = Date.now();
  const r = blueNoise(n, { seed: 7 });
  const ms = Date.now() - t0;
  ok(r.length === n * n && new Set(r).size === n * n, `${n}x${n}: ranks são uma permutação de 0..${n * n - 1} (${ms} ms)`);
  const r2 = blueNoise(n, { seed: 7 });
  ok(r.every((v, i) => v === r2[i]), "determinístico para o mesmo seed");
  const white = Float64Array.from({ length: n * n }, (_, i) => i);
  const rnd = mulberry32(3);
  for (let i = white.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [white[i], white[j]] = [white[j], white[i]]; }
  const vb = lowFreqVariance(r, n), vw = lowFreqVariance(white, n);
  ok(vb < vw * 0.2, `baixa frequência: ruído azul tem ${(vb / vw * 100).toFixed(1)}% da variância do ruído branco (esperado < 20%)`);
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const get = (f, d) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : d; };
  if (args.includes("--test")) {
    try { const rep = selfTest(); console.log(rep.join("\n")); console.log(`\n${rep.length} verificações passaram.`); }
    catch (e) { console.error(e.message); process.exit(1); }
  } else {
    const n = Number(args.find((a) => /^\d+$/.test(a)) ?? 64);
    const seed = Number(get("--seed", 1));
    const fmt = get("--format", "png");
    const t0 = Date.now();
    const ranks = blueNoise(n, { seed });
    if (fmt === "json") {
      const text = JSON.stringify({ n, ranks: Array.from(ranks) });
      const out = get("--out", null);
      if (out) writeFileSync(out, text); else console.log(text);
    } else {
      const { encodePNG } = await import("./png.mjs");
      const data = new Uint8Array(n * n);
      for (let i = 0; i < n * n; i++) data[i] = Math.floor(((ranks[i] + 0.5) / (n * n)) * 256);
      const out = get("--out", `bluenoise${n}.png`);
      writeFileSync(out, encodePNG({ width: n, height: n, data, channels: 1 }));
      console.log(`escreveu ${out} (${n}x${n}, seed ${seed}, ${Date.now() - t0} ms)`);
    }
  }
}
