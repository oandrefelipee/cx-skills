#!/usr/bin/env node
// bayer.mjs — gera matrizes de Bayer NxN (N = 2, 4, 8, 16 ou 32) e as exporta como JSON, GLSL, JS ou CSS.
//
// Uso:
//   node bayer.mjs 8                      # JSON (padrão) com a matriz inteira e a normalizada
//   node bayer.mjs 8 --format glsl        # tabela const (GLSL ES 3.00, só até 16) + função procedural (ES 1.00 e 3.00)
//   node bayer.mjs 8 --format js          # export const BAYER8 = [...] (Uint8Array plano, linha a linha)
//   node bayer.mjs 8 --format css         # textura de limiar como PNG em data URI + receita CSS
//   node bayer.mjs 8 --format ascii       # grade para olhar no terminal
//   node bayer.mjs 8 --format png --out bayer8.png   # PNG cinza NxN (valor/N² * 255)
//   node bayer.mjs --test                 # testes de propriedades (soma, valores únicos, recursão x forma fechada, ...)
//
// Matemática (Wikipedia "Ordered dithering"; Surma "Ditherpunk"):
//   M_2 = [[0,2],[3,1]];   M_2n = [[4M_n + 0, 4M_n + 2], [4M_n + 3, 4M_n + 1]]
//   Limiar normalizado: t = (M + 0.5) / N²   (o +0.5 centra os limiares: a média é exatamente 0.5, sem viés de brilho)
//   Forma fechada por bits (a que o shader usa): M(x,y) = Σ_b 4^b · q(bit_{k-1-b}(x), bit_{k-1-b}(y)),
//   onde k = log2(N) e q(xb,yb) = 2·xb + 3·yb − 4·xb·yb  (0,2,3,1 para (0,0),(1,0),(0,1),(1,1)).
import { pathToFileURL } from "node:url";
import { writeFileSync } from "node:fs";

export const isPow2 = (n) => Number.isInteger(n) && n >= 2 && (n & (n - 1)) === 0;

/** Matriz de índices (inteiros 0..N²-1) por recursão. Retorna array de linhas. */
export function bayerMatrix(n) {
  if (!isPow2(n)) throw new RangeError(`N deve ser potência de 2 (2, 4, 8, 16, 32...), recebi ${n}`);
  let m = [[0]];
  while (m.length < n) {
    const s = m.length;
    const next = Array.from({ length: 2 * s }, () => new Array(2 * s));
    for (let y = 0; y < 2 * s; y++) {
      for (let x = 0; x < 2 * s; x++) {
        const quad = y < s ? (x < s ? 0 : 2) : x < s ? 3 : 1;
        next[y][x] = 4 * m[y % s][x % s] + quad;
      }
    }
    m = next;
  }
  return m;
}

/** Forma fechada por bits: mesmo valor de bayerMatrix(n)[y][x], sem tabela. */
export function bayerValue(x, y, n) {
  const k = Math.log2(n);
  let v = 0;
  for (let b = 0; b < k; b++) {
    const bit = k - 1 - b;
    const xb = (x >> bit) & 1;
    const yb = (y >> bit) & 1;
    v += (2 * xb + 3 * yb - 4 * xb * yb) * 4 ** b;
  }
  return v;
}

/** Limiares normalizados em (0,1): (M + 0.5) / N². */
export function bayerThresholds(n) {
  return bayerMatrix(n).map((row) => row.map((v) => (v + 0.5) / (n * n)));
}

/** Matriz plana (linha a linha) de inteiros. */
export function bayerFlat(n) {
  return bayerMatrix(n).flat();
}

/** GLSL: função procedural desenrolada para N (sem tabela, funciona em GLSL ES 1.00/WebGL1 e 3.00). */
export function glslProcedural(n) {
  const k = Math.log2(n);
  const lines = [];
  lines.push(`// Bayer ${n}x${n} procedural: limiar em (0,1) para a célula c (coordenada inteira de célula, não de pixel).`);
  lines.push(`float bayer${n}(vec2 c) {`);
  lines.push(`  vec2 q = mod(floor(c), ${n}.0);`);
  lines.push(`  float v = 0.0;`);
  for (let b = 0; b < k; b++) {
    const bit = k - 1 - b;
    const div = 2 ** bit;
    const xb = div === 1 ? "mod(q.x, 2.0)" : `mod(floor(q.x / ${div}.0), 2.0)`;
    const yb = div === 1 ? "mod(q.y, 2.0)" : `mod(floor(q.y / ${div}.0), 2.0)`;
    lines.push(`  { float xb = ${xb}, yb = ${yb}; v += (2.0 * xb + 3.0 * yb - 4.0 * xb * yb) * ${(4 ** b).toFixed(1)}; }`);
  }
  lines.push(`  return (v + 0.5) / ${(n * n).toFixed(1)};`);
  lines.push(`}`);
  return lines.join("\n");
}

/** GLSL ES 3.00: tabela const (só faz sentido até 16x16). */
export function glslTable(n) {
  const flat = bayerFlat(n);
  const rows = [];
  for (let y = 0; y < n; y++) rows.push("  " + flat.slice(y * n, (y + 1) * n).map((v) => v.toFixed(1)).join(", "));
  return [
    `// Bayer ${n}x${n} como tabela (GLSL ES 3.00 / WebGL2). Acesso: BAYER${n}[(y % ${n}) * ${n} + (x % ${n})]`,
    `const float BAYER${n}[${n * n}] = float[${n * n}](`,
    rows.join(",\n"),
    `);`,
    `float bayer${n}t(ivec2 c) { return (BAYER${n}[(c.y & ${n - 1}) * ${n} + (c.x & ${n - 1})] + 0.5) / ${(n * n).toFixed(1)}; }`,
  ].join("\n");
}

export function toGlsl(n) {
  const parts = [`// Gerado por bayer.mjs (N = ${n}). Limiar t em (0,1): acenda a célula quando luminância > t.`];
  if (n <= 16) parts.push(glslTable(n));
  parts.push(glslProcedural(n));
  parts.push(`// Uso: float t = bayer${n}(floor(gl_FragCoord.xy / uCell));   // uCell = tamanho da célula em px de dispositivo`);
  return parts.join("\n\n");
}

export function toJs(n) {
  const flat = bayerFlat(n);
  const type = n * n <= 256 ? "Uint8Array" : "Uint16Array";
  const rows = [];
  for (let y = 0; y < n; y++) rows.push("  " + flat.slice(y * n, (y + 1) * n).join(", "));
  return [
    `// Bayer ${n}x${n}, inteiros 0..${n * n - 1}, linha a linha. Limiar normalizado: (BAYER${n}[(y % ${n}) * ${n} + (x % ${n})] + 0.5) / ${n * n}`,
    `export const BAYER${n} = new ${type}([`,
    rows.join(",\n"),
    `]);`,
    `export const bayer${n}Threshold = (x, y) => (BAYER${n}[(y & ${n - 1}) * ${n} + (x & ${n - 1})] + 0.5) / ${n * n};`,
  ].join("\n");
}

export async function toPngBuffer(n, { half = false } = {}) {
  const { encodePNG } = await import("./png.mjs");
  const flat = bayerFlat(n);
  const data = new Uint8Array(n * n);
  // padrão: limiar t em 0..255. half: tile "invertido e pela metade" para a receita CSS: round(0.5 * (1 - t) * 255)
  for (let i = 0; i < n * n; i++) {
    const t = (flat[i] + 0.5) / (n * n);
    data[i] = Math.round((half ? 0.5 * (1 - t) : t) * 255);
  }
  return encodePNG({ width: n, height: n, data, channels: 1 });
}

export async function toCss(n) {
  const b64 = (await toPngBuffer(n, { half: true })).toString("base64");
  return [
    `/* Dither Bayer ${n}x${n} só com CSS (testado no Chromium 153; suporte a mix-blend-mode: plus-lighter em Safari e Firefox não foi verificado aqui, confira no MDN/caniuse).`,
    `   Ideia: soma-se a imagem (luminância L em 0..0.5) com o tile (1 - t)/2 e corta-se em 0.5 com contrast():`,
    `   0.5·L + 0.5·(1 - t) >= 0.5  <=>  L >= t, que é exatamente o teste do dither ordenado.`,
    `   Limites: a imagem precisa ser cinza e ir só até #808080; o corte é 1 bit (preto/branco); para tons e cor use shader/canvas. */`,
    `:root { --bayer-${n}: url("data:image/png;base64,${b64}"); }`,
    `.dither-bayer {`,
    `  --cell: 3px;                                   /* tamanho da célula */`,
    `  position: relative; isolation: isolate;`,
    `  background: linear-gradient(90deg, #000, #808080);   /* troque pela sua luminância (0..50% de cinza) */`,
    `  filter: contrast(1000);                        /* corte duro em 50% */`,
    `}`,
    `.dither-bayer::before {`,
    `  content: ""; position: absolute; inset: 0;`,
    `  background: var(--bayer-${n}) 0 0 / calc(${n} * var(--cell)) calc(${n} * var(--cell));`,
    `  image-rendering: pixelated;                    /* amplia o tile sem suavizar */`,
    `  mix-blend-mode: plus-lighter;`,
    `}`,
  ].join("\n");
}

export function toAscii(n) {
  const w = String(n * n - 1).length;
  return bayerMatrix(n).map((row) => row.map((v) => String(v).padStart(w)).join(" ")).join("\n");
}

/** Testes de propriedades. Lança Error na primeira falha; devolve o resumo. */
export function selfTest() {
  const report = [];
  const ok = (cond, msg) => {
    if (!cond) throw new Error("FALHOU: " + msg);
    report.push("ok  " + msg);
  };
  for (const n of [2, 4, 8, 16, 32]) {
    const m = bayerMatrix(n);
    const flat = m.flat();
    const N2 = n * n;
    ok(flat.length === N2, `N=${n}: tem ${N2} células`);
    ok(new Set(flat).size === N2, `N=${n}: valores únicos (permutação de 0..${N2 - 1})`);
    ok(Math.min(...flat) === 0 && Math.max(...flat) === N2 - 1, `N=${n}: mínimo 0 e máximo ${N2 - 1}`);
    const sum = flat.reduce((a, b) => a + b, 0);
    ok(sum === (N2 * (N2 - 1)) / 2, `N=${n}: soma = ${(N2 * (N2 - 1)) / 2}`);
    const th = bayerThresholds(n).flat();
    const mean = th.reduce((a, b) => a + b, 0) / N2;
    ok(Math.abs(mean - 0.5) < 1e-12, `N=${n}: média dos limiares normalizados = 0.5 (sem viés de brilho)`);
    ok(th.every((t) => t > 0 && t < 1), `N=${n}: limiares estritamente entre 0 e 1`);
    let same = true;
    for (let y = 0; y < n && same; y++) for (let x = 0; x < n; x++) if (bayerValue(x, y, n) !== m[y][x]) same = false;
    ok(same, `N=${n}: forma fechada por bits == recursão`);
    if (n > 2) {
      const half = n / 2;
      let sub = true;
      const small = bayerMatrix(half);
      for (let y = 0; y < half && sub; y++) for (let x = 0; x < half; x++) if (m[y][x] >> 2 !== small[y][x]) sub = false;
      ok(sub, `N=${n}: quadrante superior esquerdo = M_${half} (aninhamento: dividir por 4 dá a matriz menor)`);
    }
  }
  const m4 = bayerMatrix(4).map((r) => r.join(",")).join("|");
  ok(m4 === "0,8,2,10|12,4,14,6|3,11,1,9|15,7,13,5", "N=4 confere com a tabela publicada (Wikipedia, Ordered dithering)");
  const m8first = bayerMatrix(8)[0].join(",");
  ok(m8first === "0,32,8,40,2,34,10,42", "N=8: primeira linha confere com a tabela publicada (Wikipedia, Ordered dithering)");
  let threw = false;
  try { bayerMatrix(6); } catch { threw = true; }
  ok(threw, "N=6 (não potência de 2) é rejeitado");
  return report;
}

// ---- CLI ----
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const get = (flag, def) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : def;
  };
  if (args.includes("--test")) {
    try {
      const rep = selfTest();
      console.log(rep.join("\n"));
      console.log(`\n${rep.length} verificações passaram.`);
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }
  } else {
    const n = Number(args.find((a) => /^\d+$/.test(a)) ?? 8);
    const format = get("--format", "json");
    const out = get("--out", null);
    try {
      let text;
      if (format === "json") text = JSON.stringify({ n, max: n * n - 1, matrix: bayerMatrix(n), normalized: bayerThresholds(n) });
      else if (format === "glsl") text = toGlsl(n);
      else if (format === "js") text = toJs(n);
      else if (format === "css") text = await toCss(n);
      else if (format === "ascii") text = toAscii(n);
      else if (format === "png") {
        const target = out ?? `bayer${n}.png`;
        writeFileSync(target, await toPngBuffer(n));
        console.log(`escreveu ${target} (${n}x${n})`);
        process.exit(0);
      } else throw new Error("formato inválido: " + format + " (json, glsl, js, css, ascii, png)");
      if (out) { writeFileSync(out, text + "\n"); console.log(`escreveu ${out}`); } else console.log(text);
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }
  }
}
