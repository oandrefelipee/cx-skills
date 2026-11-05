#!/usr/bin/env node
// test-snippets.mjs — abre cada página de scripts/snippets/ no Chromium (SwiftShader), em tema claro e escuro, e confere:
//   1. a página avisa `window.__ready` e não gera erro de console, exceção nem requisição falha (as bibliotecas vêm do CDN: precisa de rede);
//   2. o desenho usa SÓ as cores dos tokens (exatas, lidas da própria página) — nos snippets de 1 bit, só preto e branco;
//   3. se anima, dois quadros espaçados são diferentes; com prefers-reduced-motion: reduce, são idênticos (quadro parado).
//
// Uso:
//   node test-snippets.mjs                       # todos os snippets, claro e escuro
//   node test-snippets.mjs snippets/ogl.html     # só um
//   node test-snippets.mjs --out /tmp/shots      # guarda as capturas (por padrão não guarda)
//   node test-snippets.mjs --sheet proof/snippets-claro.png --sheet-scheme light   # folha de contato com todas as capturas
// Sai com código 1 se algum snippet falhar. Prova CORREÇÃO (SwiftShader), não desempenho de GPU.
import fs from "node:fs";
import path from "node:path";
import { here, launchChromium, parseArgs, serveDir } from "./lib-browser.mjs";
import { decodePNG, encodePNG } from "./png.mjs";

const { flags, positional } = parseArgs(process.argv.slice(2));
const dir = path.join(here, "snippets");
const schemes = String(flags.schemes ?? "light,dark").split(",").filter(Boolean);
const outDir = flags.out ? path.resolve(flags.out) : null;
if (outDir) fs.mkdirSync(outDir, { recursive: true });

// O que esperar de cada snippet. Arquivo novo sem entrada aqui = `canvas`, cores dos tokens, animação só informada.
const SPECS = {
  "canvas2d.html": { targets: ["canvas"], kind: "tokens", animated: true },
  "webgl2-puro.html": { targets: ["canvas"], kind: "tokens", animated: true },
  "webgpu.html": { targets: ["canvas"], kind: "tokens", animated: true },
  "ogl.html": { targets: ["canvas"], kind: "tokens", animated: true },
  "regl.html": { targets: ["canvas"], kind: "tokens", animated: true },
  "twgl.html": { targets: ["canvas"], kind: "tokens", animated: true },
  "three-postprocessing.html": { targets: ["canvas"], kind: "tokens", animated: true },
  "pixi-filter.html": { targets: ["canvas"], kind: "tokens", animated: false },
  "p5.html": { targets: ["canvas"], kind: "tokens", animated: true },
  "paper-shaders.html": { targets: ["#hero"], kind: "tokens", animated: true, minTokenShare: 0.9 },
  "svg-filter.html": { targets: [".grain"], kind: "bw", animated: false },
  "css-only.html": { targets: [".dither-bayer", ".halftone"], kind: "bw", animated: false },
};

const files = positional.length
  ? positional.map((p) => path.resolve(p))
  : fs.readdirSync(dir).filter((f) => f.endsWith(".html")).sort().map((f) => path.join(dir, f));

/** Fração de pixels diferentes entre dois PNGs do mesmo tamanho. Rasterização de filtros CSS/SVG oscila em pouquíssimos pixels (0,05%
 *  nos testes): por isso "mudou" só vale acima de 0,2%. */
function diffShare(a, b) {
  if (a.equals(b)) return 0;
  const A = decodePNG(a), B = decodePNG(b);
  if (A.width !== B.width || A.height !== B.height) return 1;
  let n = 0;
  for (let i = 0; i < A.data.length; i += 4) if (A.data[i] !== B.data[i] || A.data[i + 1] !== B.data[i + 1] || A.data[i + 2] !== B.data[i + 2]) n++;
  return n / (A.width * A.height);
}
const MOVED = 0.002;

const hex = (r, g, b) => "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
const key = (d, i) => (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];

/** Estatística de cores de um PNG: quantas cores distintas, e que fração dos pixels cai no conjunto esperado. */
function colorStats(png, allowed) {
  const { data, width, height } = decodePNG(png);
  const counts = new Map();
  for (let i = 0; i < data.length; i += 4) counts.set(key(data, i), (counts.get(key(data, i)) ?? 0) + 1);
  const total = width * height;
  let inSet = 0;
  for (const [k, n] of counts) if (allowed.has(k)) inSet += n;
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([k, n]) => `${hex(k >> 16, (k >> 8) & 255, k & 255)}:${((100 * n) / total).toFixed(1)}%`);
  return { distinct: counts.size, share: inSet / total, top, width, height, data };
}

const server = await serveDir(dir);
// WebGPU no Chromium headless: flags em lib-browser.mjs (WEBGPU_ARGS).
const browser = await launchChromium({ webgpu: true });
const rows = [];
const sheet = []; // { name, png } do esquema escolhido para a folha de contato

try {
  for (const file of files) {
    const name = path.basename(file);
    const spec = SPECS[name] ?? { targets: ["canvas"], kind: "tokens", animated: null };
    for (const scheme of schemes) {
      const problems = [];
      const ctx = await browser.newContext({ colorScheme: scheme, viewport: { width: 700, height: 520 }, deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      const errors = [];
      page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text().slice(0, 160)); });
      page.on("pageerror", (e) => errors.push("exceção: " + String(e.message).slice(0, 160)));
      page.on("requestfailed", (r) => errors.push("rede: " + r.url().slice(0, 100) + " " + (r.failure()?.errorText ?? "")));
      page.on("response", (r) => { if (r.status() >= 400) errors.push(`http ${r.status()}: ${r.url().slice(0, 100)}`); });

      const url = `${server.url}/${encodeURIComponent(name)}`;
      let ready = false;
      try {
        await page.goto(url, { waitUntil: "load", timeout: 30000 });
        await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
        ready = true;
      } catch (e) { problems.push("não ficou pronto: " + String(e.message).split("\n")[0]); }
      await page.waitForTimeout(700);

      // cores permitidas = tokens da página (ou preto e branco nos snippets de 1 bit)
      const tokens = spec.kind === "bw"
        ? [[0, 0, 0], [255, 255, 255]]
        : await page.evaluate(() => {
            const probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
            return [0, 1, 2, 3].map((i) => {
              const el = document.body.appendChild(document.createElement("i"));
              el.style.color = `var(--c${i})`;
              probe.canvas.width = probe.canvas.height = 1;
              probe.fillStyle = "#000"; probe.fillStyle = getComputedStyle(el).color; probe.fillRect(0, 0, 1, 1);
              el.remove();
              return [...probe.getImageData(0, 0, 1, 1).data.slice(0, 3)];
            });
          });
      const allowed = new Set(tokens.map(([r, g, b]) => (r << 16) | (g << 8) | b));

      const shoot = async (selector) => {
        const el = page.locator(selector).first();
        const box = await el.boundingBox();
        if (!box) throw new Error("elemento sem caixa: " + selector);
        const inset = spec.kind === "bw" ? 3 : 0; // tira a borda de 1 px dos quadros de CSS/SVG
        return page.screenshot({ clip: { x: box.x + inset, y: box.y + inset, width: box.width - 2 * inset, height: box.height - 2 * inset } });
      };

      const detail = [];
      let shareMin = 1, distinctMax = 0, firstPng = null;
      if (ready) {
        for (const sel of spec.targets) {
          try {
            const png = await shoot(sel);
            firstPng ??= png;
            const st = colorStats(png, allowed);
            shareMin = Math.min(shareMin, st.share);
            distinctMax = Math.max(distinctMax, st.distinct);
            detail.push(`${sel}: ${st.width}x${st.height}, ${st.distinct} cores, ${(100 * st.share).toFixed(1)}% nos tokens [${st.top.slice(0, 4).join(" ")}]`);
            if (outDir) fs.writeFileSync(path.join(outDir, `${name.replace(/\.html$/, "")}-${scheme}-${sel.replace(/[^a-z0-9]+/gi, "")}.png`), png);
          } catch (e) { problems.push("captura: " + e.message.split("\n")[0]); }
        }
        const minShare = spec.minTokenShare ?? 0.99;
        if (shareMin < minShare) problems.push(`só ${(100 * shareMin).toFixed(1)}% dos pixels estão nas cores permitidas (mínimo ${(100 * minShare).toFixed(0)}%)`);
        if (spec.kind === "tokens" && distinctMax < 2) problems.push("menos de 2 cores no desenho (tela vazia?)");

        // animação: dois quadros, 900 ms de intervalo
        if (spec.animated !== false || scheme === schemes[0]) {
          const a = await shoot(spec.targets[0]);
          await page.waitForTimeout(900);
          const b = await shoot(spec.targets[0]);
          const moved = diffShare(a, b) > MOVED;
          if (spec.animated === true && !moved) problems.push("deveria animar, mas dois quadros saíram idênticos");
          if (spec.animated === false && moved) problems.push("deveria ser estático, mas o quadro mudou");
          detail.push(moved ? "anima" : "estático");
        }
      }
      if (ready && scheme === schemes[0]) {
        // com prefers-reduced-motion: reduce o quadro tem de ficar parado
        const rctx = await browser.newContext({ colorScheme: scheme, reducedMotion: "reduce", viewport: { width: 700, height: 520 }, deviceScaleFactor: 1 });
        const rp = await rctx.newPage();
        const rerr = [];
        rp.on("pageerror", (e) => rerr.push(String(e.message).slice(0, 120)));
        try {
          await rp.goto(url, { waitUntil: "load", timeout: 30000 });
          await rp.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
          await rp.waitForTimeout(500);
          const sel = spec.targets[0];
          const grab = async () => { const box = await rp.locator(sel).first().boundingBox(); return rp.screenshot({ clip: { x: box.x, y: box.y, width: box.width, height: box.height } }); };
          const a = await grab(); await rp.waitForTimeout(900); const b = await grab();
          if (diffShare(a, b) > MOVED) problems.push("com reduced-motion o quadro continua mudando");
          else detail.push("reduced-motion: parado");
          if (rerr.length) problems.push("erro com reduced-motion: " + rerr[0]);
        } catch (e) { problems.push("reduced-motion: " + e.message.split("\n")[0]); }
        await rctx.close();
      }
      if (errors.length) problems.push(...[...new Set(errors)].slice(0, 4));
      if (firstPng && scheme === (flags["sheet-scheme"] ?? "light")) sheet.push({ name, png: firstPng });
      rows.push({ name, scheme, ok: problems.length === 0, detail, problems });
      await ctx.close();
    }
  }
} finally {
  await browser.close();
  await server.close();
}

// relatório
let bad = 0;
for (const r of rows) {
  console.log(`${r.ok ? "OK    " : "FALHA "} ${r.name.padEnd(28)} ${r.scheme.padEnd(5)} ${r.detail.join(" | ")}`);
  for (const p of r.problems) console.log(`         - ${p}`);
  if (!r.ok) bad++;
}
console.log(`\n${rows.length - bad}/${rows.length} combinações (snippet x tema) passaram.`);

// folha de contato: reduz cada captura à metade (vizinho mais próximo) e junta em grade de 3 colunas
if (flags.sheet && sheet.length) {
  const cols = 3, pad = 8, cellW = 322, cellH = 182;
  const rowsN = Math.ceil(sheet.length / cols);
  const W = cols * (cellW + pad) + pad, H = rowsN * (cellH + pad) + pad;
  const out = new Uint8Array(W * H * 4);
  for (let i = 0; i < out.length; i += 4) { out[i] = 24; out[i + 1] = 26; out[i + 2] = 40; out[i + 3] = 255; }
  sheet.forEach(({ png }, n) => {
    const img = decodePNG(png);
    const ox = pad + (n % cols) * (cellW + pad), oy = pad + Math.floor(n / cols) * (cellH + pad);
    for (let y = 0; y < Math.min(cellH, Math.ceil(img.height / 2)); y++) for (let x = 0; x < Math.min(cellW, Math.ceil(img.width / 2)); x++) {
      const s = ((y * 2) * img.width + x * 2) * 4, d = ((oy + y) * W + ox + x) * 4;
      out[d] = img.data[s]; out[d + 1] = img.data[s + 1]; out[d + 2] = img.data[s + 2]; out[d + 3] = 255;
    }
  });
  fs.mkdirSync(path.dirname(path.resolve(String(flags.sheet))), { recursive: true });
  fs.writeFileSync(path.resolve(String(flags.sheet)), encodePNG({ width: W, height: H, data: out, channels: 4 }));
  console.log("folha de contato: " + path.resolve(String(flags.sheet)) + "  (ordem: " + sheet.map((s) => s.name.replace(".html", "")).join(", ") + ")");
}
process.exit(bad ? 1 : 0);
