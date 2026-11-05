#!/usr/bin/env node
// frame-stability.mjs — mede o "ferver" (boiling/swimming) do dither entre quadros: que fração dos pixels de saída muda quando o
// conteúdo muda só um pouco (brilho +2% ou deslocamento de 1 px). Ordenado (Bayer, ruído azul) muda quase só onde o limiar é
// cruzado (~1%); difusão de erro propaga a mudança pelo resto da imagem (15 a 30%). É o argumento numérico para animar com
// ordenado e reservar difusão de erro para imagens paradas.
//
// Uso:
//   node frame-stability.mjs                      # usa uma imagem de teste gerada
//   node frame-stability.mjs foto.png [--algos bayer,floyd-steinberg] [--palette 1bit] [--shift 1] [--gain 1.02]
import fs from "node:fs";
import { decodePNG } from "./png.mjs";
import { ALGOS, ditherImage, makeTestImage } from "./dither-core.mjs";
import { parseArgs } from "./lib-browser.mjs";

const { flags, positional } = parseArgs(process.argv.slice(2));
const img = positional[0] ? decodePNG(fs.readFileSync(positional[0])) : makeTestImage(512, 320);
const { width: W, height: H } = img;
const algos = String(flags.algos ?? "bayer,blue-noise,random,floyd-steinberg,atkinson,sierra2").split(",");
for (const a of algos) if (!ALGOS.includes(a)) { console.error(`algoritmo desconhecido: ${a}. Opções: ${ALGOS.join(", ")}`); process.exit(2); }
const palette = flags.palette ?? "1bit";
const dx = Number(flags.shift ?? 1), gain = Number(flags.gain ?? 1.02);

const shifted = () => {
  const d = new Uint8Array(img.data.length);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const sx = Math.min(W - 1, Math.max(0, x - dx)), s = (y * W + sx) * 4;
    d.set(img.data.subarray(s, s + 4), (y * W + x) * 4);
  }
  return { width: W, height: H, data: d };
};
const brighter = () => {
  const d = new Uint8Array(img.data);
  for (let i = 0; i < d.length; i += 4) for (let c = 0; c < 3; c++) d[i + c] = Math.min(255, Math.round(d[i + c] * gain));
  return { width: W, height: H, data: d };
};
const run = (im, algo) => ditherImage(im, { algo, palette, upscale: false, size: 8, seed: 3 }).indices;
const diff = (a, b) => { let n = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++; return n / a.length; };

const bright = brighter(), moved = shifted();
console.log(`imagem ${W}x${H}, paleta ${palette}; fração de pixels de saída que mudam entre dois quadros`);
console.log(`${"algoritmo".padEnd(18)}${("brilho x" + gain).padEnd(14)}${"desloca " + dx + " px"}`);
for (const algo of algos) {
  const a = run(img, algo);
  console.log(`${algo.padEnd(18)}${(100 * diff(a, run(bright, algo))).toFixed(1).padStart(5)}%        ${(100 * diff(a, run(moved, algo))).toFixed(1).padStart(5)}%`);
}
console.log("\nLeitura: perto de 1% = o dither acompanha só o que mudou (estável para animar). 15% ou mais = a mudança se espalha (ferve).");
console.log("Obs.: 'random' aqui usa semente fixa. Com semente nova a cada quadro (visual de chuvisco de TV) mudou 24,8% dos pixels nesta imagem de teste (em cinza médio chega a 50%).");
