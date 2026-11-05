#!/usr/bin/env node
// dither-image.mjs — converte uma imagem em dither e grava um PNG. Sem instalar nada.
//
// Uso:
//   node dither-image.mjs --make-test teste.png                 # gera uma imagem sintética de teste (rampa, esfera, listras, degraus)
//   node dither-image.mjs entrada.png saida.png                  # Bayer 8x8, 1 bit, célula 1
//   node dither-image.mjs foto.jpg saida.png --algo floyd-steinberg --palette gameboy --cell 3
//   node dither-image.mjs foto.png saida.png --algo bayer-n --size 4 --palette gray:4 --cell 2
//   node dither-image.mjs foto.png saida.png --algo atkinson --palette "#101820,#f2e9d8" --serpentine
//   node dither-image.mjs foto.png saida.png --algo bayer --palette cga1-hi --mode rgb
//   node dither-image.mjs --list                                 # algoritmos e paletas
//
// Opções:
//   --algo        bayer | bayer-n | blue-noise | threshold | random | floyd-steinberg | atkinson | jarvis | stucki | burkes | sierra | sierra2 | sierra-lite   (padrão bayer)
//   --size N      bayer-n: 2,4,8,16,32; blue-noise: lado da textura (padrão 64)
//   --palette     1bit (padrão) | gameboy | cga0 | cga0-hi | cga1 | cga1-hi | ega | apple2 | pico8 | mac | rgb8 | gray:N | kmeans:N (N cores tiradas da imagem) | lista "#000,#888,#fff"
//                 (em projeto real, resolva os tokens do tema para hex com resolve-tokens.mjs e passe aqui)
//   --mode        luma (padrão: a paleta é uma rampa tonal) | rgb (preserva o matiz; use com paletas coloridas)
//   --space       linear (padrão, fisicamente correto) | srgb (visual "clássico", mais claro nos meios-tons)
//   --cell N      tamanho da célula de dither em px da saída (padrão 1); a imagem é reduzida N vezes, ditherizada e ampliada com vizinho mais próximo
//   --width N     redimensiona a entrada para N px de largura antes de tudo
//   --serpentine  varredura em serpentina (só difusão de erro)
//   --contrast C --brightness B --invert   ajustes antes do dither (C=1 neutro, B em -1..1)
//   --spread S    modo rgb: amplitude do deslocamento (padrão auto)
//   --seed N      semente de random/blue-noise
//   --no-upscale  grava a imagem pequena (uma célula = um pixel)
//   --browser     força decodificar a entrada pelo Chromium (necessário para JPG/WebP/GIF/SVG; PNG simples dispensa)
import fs from "node:fs";
import path from "node:path";
import { decodePNG, encodePNG } from "./png.mjs";
import { ALGOS, PALETTES, ditherImage, makeTestImage } from "./dither-core.mjs";
import { launchChromium, parseArgs } from "./lib-browser.mjs";

const { flags, positional } = parseArgs(process.argv.slice(2), { booleans: ["serpentine", "invert", "no-upscale", "browser", "list"] });

if (flags.list) {
  console.log("Algoritmos:\n  " + ALGOS.join("\n  "));
  console.log("\nPaletas:\n  " + Object.entries(PALETTES).map(([k, v]) => `${k.padEnd(8)} ${v.length} cores  ${v.slice(0, 4).join(" ")}${v.length > 4 ? " ..." : ""}`).join("\n  ") + "\n  gray:N   N tons de cinza (2..256)\n  kmeans:N N cores tiradas da imagem (k-means leve)\n  \"#rrggbb,#rrggbb,...\"");
  process.exit(0);
}

if (flags["make-test"]) {
  const out = flags["make-test"] === true ? "teste.png" : flags["make-test"];
  const img = makeTestImage(512, 320);
  fs.writeFileSync(out, encodePNG({ width: img.width, height: img.height, data: img.data, channels: 4 }));
  console.log(`escreveu ${out} (${img.width}x${img.height}): rampa, esfera iluminada, listras coloridas e 8 degraus de cinza`);
  process.exit(0);
}

const [inFile, outFile] = positional;
if (!inFile || !outFile) {
  console.error("uso: node dither-image.mjs <entrada> <saida.png> [opções]   (veja o cabeçalho do arquivo ou --list)");
  process.exit(2);
}

async function decodeWithChromium(file) {
  const ext = path.extname(file).slice(1).toLowerCase() || "png";
  const mime = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", svg: "image/svg+xml", avif: "image/avif" }[ext] ?? "application/octet-stream";
  const b64 = fs.readFileSync(file).toString("base64");
  const browser = await launchChromium();
  try {
    const page = await browser.newPage();
    await page.setContent("<canvas id=c></canvas>");
    const r = await page.evaluate(async ({ b64, mime }) => {
      const img = new Image();
      img.src = `data:${mime};base64,${b64}`;
      await img.decode();
      const w = img.naturalWidth || 512, h = img.naturalHeight || 512;
      const c = document.getElementById("c");
      c.width = w; c.height = h;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, w, h).data;
      let s = "";
      const CH = 0x8000;
      for (let i = 0; i < d.length; i += CH) s += String.fromCharCode.apply(null, d.subarray(i, i + CH));
      return { width: w, height: h, b64: btoa(s) };
    }, { b64, mime });
    return { width: r.width, height: r.height, data: new Uint8Array(Buffer.from(r.b64, "base64")) };
  } finally {
    await browser.close();
  }
}

let img;
const wantBrowser = flags.browser === true;
if (!wantBrowser && /\.png$/i.test(inFile)) {
  try { img = decodePNG(fs.readFileSync(inFile)); } catch (e) { console.error(`aviso: decodificador PNG interno falhou (${e.message}); usando o Chromium`); }
}
if (!img) img = await decodeWithChromium(inFile);

const t0 = Date.now();
const res = ditherImage(img, {
  algo: flags.algo ?? "bayer",
  size: flags.size ? Number(flags.size) : undefined,
  palette: flags.palette ?? "1bit",
  mode: flags.mode ?? "luma",
  space: flags.space ?? "linear",
  cell: flags.cell ? Math.max(1, Math.round(Number(flags.cell))) : 1,
  width: flags.width ? Number(flags.width) : 0,
  serpentine: !!flags.serpentine,
  contrast: flags.contrast ? Number(flags.contrast) : 1,
  brightness: flags.brightness ? Number(flags.brightness) : 0,
  invert: !!flags.invert,
  spread: flags.spread ?? "auto",
  seed: flags.seed ? Number(flags.seed) : 1,
  upscale: !flags["no-upscale"],
});
fs.writeFileSync(outFile, encodePNG({ width: res.width, height: res.height, data: res.data, channels: 4 }));
const used = new Set(res.indices).size;
console.log(`escreveu ${outFile}: ${res.width}x${res.height} (grade ${res.lowWidth}x${res.lowHeight}), algoritmo ${flags.algo ?? "bayer"}, ${res.palette.length} cores na paleta (${used} usadas), ${Date.now() - t0} ms`);
