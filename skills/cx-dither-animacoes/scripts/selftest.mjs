#!/usr/bin/env node
// selftest.mjs — testes automáticos de todos os scripts de cálculo (sem instalar nada).
//
//   node selftest.mjs          # testes em Node (bayer, ruído azul, PNG, núcleos de difusão, conservação de brilho, determinismo)
//   node selftest.mjs --gl     # + confere o GLSL gerado por bayer.mjs contra a matriz, dentro do Chromium (SwiftShader), em WebGL1 e WebGL2
//
// Sai com código 1 se algo falhar.
import * as bayer from "./bayer.mjs";
import * as blue from "./blue-noise.mjs";
import { decodePNG, encodePNG } from "./png.mjs";
import { ALGOS, KERNELS, ditherImage, kmeansPalette, makeTestImage, parsePalette, srgbToLinear } from "./dither-core.mjs";
import { launchChromium, parseArgs } from "./lib-browser.mjs";

const { flags } = parseArgs(process.argv.slice(2), { booleans: ["gl"] });
let passed = 0;
const failures = [];
const ok = (cond, msg) => {
  if (cond) { passed++; console.log("ok  " + msg); } else { failures.push(msg); console.log("FALHOU  " + msg); }
};
const section = (t) => console.log(`\n# ${t}`);

section("bayer.mjs");
try { bayer.selfTest().forEach(() => passed++); console.log("ok  42 propriedades de Bayer (N = 2..32)"); } catch (e) { failures.push(e.message); console.log(e.message); }

section("blue-noise.mjs");
try { blue.selfTest().forEach((l) => console.log(l)); passed += 3; } catch (e) { failures.push(e.message); console.log(e.message); }

section("png.mjs");
for (const channels of [1, 3, 4]) {
  const w = 7, h = 5;
  const data = new Uint8Array(w * h * channels).map((_, i) => (i * 37 + 11) & 255);
  const back = decodePNG(encodePNG({ width: w, height: h, data, channels }));
  let same = back.width === w && back.height === h;
  for (let i = 0; i < w * h && same; i++) {
    const o = i * channels;
    const exp = channels === 1 ? [data[o], data[o], data[o], 255] : [data[o], data[o + 1], data[o + 2], channels === 4 ? data[o + 3] : 255];
    for (let c = 0; c < 4; c++) if (back.data[i * 4 + c] !== exp[c]) same = false;
  }
  ok(same, `ida e volta PNG com ${channels} canal(is)`);
}

section("núcleos de difusão de erro");
for (const [name, { div, taps }] of Object.entries(KERNELS)) {
  const sum = taps.reduce((s, t) => s + t[2], 0);
  const expected = name === "atkinson" ? 6 : div;
  ok(sum === expected, `${name}: soma dos pesos = ${sum} (esperado ${expected}${name === "atkinson" ? ", de propósito: só 6/8 do erro é difundido" : ""})`);
  ok(taps.every(([dx, dy]) => dy > 0 || (dy === 0 && dx > 0)), `${name}: só difunde para pixels ainda não visitados`);
}

section("conservação de brilho (média da saída ≈ média da entrada em luz linear)");
const flat = (g) => { const w = 64, h = 64; const d = new Uint8Array(w * h * 4); for (let i = 0; i < w * h; i++) { d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = g; d[i * 4 + 3] = 255; } return { width: w, height: h, data: d }; };
for (const algo of ALGOS) {
  if (algo === "threshold") continue; // limiar fixo não conserva brilho por definição
  let worst = 0;
  for (const g of [32, 64, 128, 192, 224]) {
    const r = ditherImage(flat(g), { algo, palette: "1bit", upscale: false, size: algo === "blue-noise" ? 64 : 8, seed: 3 });
    let on = 0;
    for (const v of r.indices) on += v; // índice 1 = branco
    const frac = on / r.indices.length;
    worst = Math.max(worst, Math.abs(frac - srgbToLinear(g / 255)));
  }
  const tol = algo === "atkinson" ? 0.2 : algo === "random" ? 0.04 : 0.03;
  ok(worst <= tol, `${algo}: erro máximo de brilho ${(worst * 100).toFixed(2)}% (tolerância ${(tol * 100).toFixed(0)}%${algo === "atkinson" ? ", Atkinson perde 25% do erro de propósito" : ""})`);
}

section("extremos e paleta");
for (const algo of ALGOS) {
  const black = ditherImage(flat(0), { algo, upscale: false, seed: 2 });
  const white = ditherImage(flat(255), { algo, upscale: false, seed: 2 });
  ok(black.indices.every((v) => v === 0) && white.indices.every((v) => v === 1), `${algo}: preto fica preto e branco fica branco`);
}
{
  const img = makeTestImage(128, 80);
  const pal = parsePalette("gameboy");
  const set = new Set(pal.map((c) => c.join(",")));
  for (const algo of ["bayer", "floyd-steinberg", "atkinson", "blue-noise"]) {
    const r = ditherImage(img, { algo, palette: "gameboy", cell: 2 });
    let inside = true;
    for (let i = 0; i < r.width * r.height; i++) if (!set.has([r.data[i * 4], r.data[i * 4 + 1], r.data[i * 4 + 2]].join(","))) { inside = false; break; }
    ok(inside, `${algo}: a saída usa só cores da paleta (gameboy)`);
  }
  const a = ditherImage(img, { algo: "random", seed: 5, upscale: false }), b = ditherImage(img, { algo: "random", seed: 5, upscale: false });
  ok(a.indices.every((v, i) => v === b.indices[i]), "random com o mesmo seed é determinístico");
  const c = ditherImage(img, { algo: "bayer", cell: 4 });
  ok(c.width === 128 && c.height === 80 && c.lowWidth === 32 && c.lowHeight === 20, "cell=4 reduz para 32x20 e amplia de volta para 128x80");
  const s1 = ditherImage(img, { algo: "floyd-steinberg", serpentine: true, upscale: false });
  ok(new Set(s1.indices).size === 2, "serpentina roda e produz as duas cores");
  const m = ditherImage(img, { algo: "floyd-steinberg", palette: "rgb8", mode: "rgb", upscale: false });
  ok(new Set(m.indices).size > 2, "modo rgb com paleta de 8 cores usa várias cores");
  // k-means: duas cores bem separadas devem ser recuperadas quase exatas, ordenadas do escuro ao claro
  const two = new Uint8Array(40 * 4);
  for (let i = 0; i < 40; i++) two.set(i < 20 ? [10, 20, 30, 255] : [240, 230, 220, 255], i * 4);
  const kp = kmeansPalette(two, 2);
  ok(kp.length === 2 && kp[0].join() === "10,20,30" && kp[1].join() === "240,230,220", "kmeansPalette recupera 2 cores exatas, escuro -> claro");
  const k4 = ditherImage(img, { algo: "floyd-steinberg", palette: "kmeans:4", upscale: false });
  ok(k4.palette.length === 4 && new Set(k4.indices).size === 4, "palette 'kmeans:4' monta 4 cores da imagem e usa as 4");
  const k4b = ditherImage(img, { algo: "floyd-steinberg", palette: "kmeans:4", upscale: false });
  ok(k4.palette.join("|") === k4b.palette.join("|"), "kmeans é determinístico (mesma imagem, mesma paleta)");
}

if (flags.gl) {
  section("GLSL gerado x matriz (Chromium + SwiftShader)");
  const browser = await launchChromium();
  try {
    const page = await browser.newPage();
    await page.setContent("<body></body>");
    for (const n of [2, 4, 8, 16, 32]) {
      const glsl = bayer.glslProcedural(n);
      const expected = bayer.bayerThresholds(n).map((row) => row.map((t) => Math.round(t * 255)));
      const variants = [[1, "procedural"], [2, "procedural"], ...(n <= 16 ? [[2, "tabela"]] : [])];
      for (const [version, kind] of variants) {
        const frag = version === 2
          ? `#version 300 es\nprecision highp float;\nout vec4 o;\n${kind === "tabela" ? bayer.glslTable(n) : ""}\n${glsl}\nvoid main(){ float t = ${kind === "tabela" ? `bayer${n}t(ivec2(gl_FragCoord.xy))` : `bayer${n}(gl_FragCoord.xy)`}; o = vec4(vec3(t), 1.0); }`
          : `precision highp float;\n${glsl}\nvoid main(){ float t = bayer${n}(gl_FragCoord.xy); gl_FragColor = vec4(vec3(t), 1.0); }`;
        const vert = version === 2 ? "#version 300 es\nin vec2 p;void main(){gl_Position=vec4(p,0.,1.);}" : "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
        const res = await page.evaluate(({ n, frag, vert, version }) => {
          const c = document.createElement("canvas");
          c.width = n; c.height = n;
          const gl = c.getContext(version === 2 ? "webgl2" : "webgl", { preserveDrawingBuffer: true, antialias: false });
          if (!gl) return { error: "sem WebGL" + version };
          const mk = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
          const pr = gl.createProgram();
          gl.attachShader(pr, mk(gl.VERTEX_SHADER, vert)); gl.attachShader(pr, mk(gl.FRAGMENT_SHADER, frag));
          gl.linkProgram(pr); gl.useProgram(pr);
          const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
          const l = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 2, gl.FLOAT, false, 0, 0);
          gl.viewport(0, 0, n, n); gl.drawArrays(gl.TRIANGLES, 0, 3);
          const px = new Uint8Array(n * n * 4); gl.readPixels(0, 0, n, n, gl.RGBA, gl.UNSIGNED_BYTE, px);
          return { px: Array.from(px) };
        }, { n, frag, vert, version }).catch((e) => ({ error: e.message }));
        if (res.error) { ok(false, `GLSL ${kind} N=${n} (WebGL${version}): ${res.error}`); continue; }
        let maxDiff = 0;
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) maxDiff = Math.max(maxDiff, Math.abs(res.px[(y * n + x) * 4] - expected[y][x]));
        ok(maxDiff <= 1, `GLSL ${kind} N=${n} em WebGL${version}: diferença máxima ${maxDiff}/255 em relação à matriz (tolerância 1)`);
      }
    }
  } finally { await browser.close(); }
}

console.log(`\n${passed} verificações passaram, ${failures.length} falharam.`);
if (failures.length) { console.log("Falhas:\n- " + failures.join("\n- ")); process.exit(1); }
