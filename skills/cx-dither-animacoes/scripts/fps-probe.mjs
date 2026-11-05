#!/usr/bin/env node
// fps-probe.mjs — mede os quadros por segundo de uma página com canvas/WebGL: requestAnimationFrame por N segundos,
// com média, mediana, p95/p99 do tempo de quadro e contagem de quadros lentos.
//
// Uso:
//   node fps-probe.mjs pagina.html                         # 5 s, 1280x720, SwiftShader
//   node fps-probe.mjs shader-playground.html --query "preset=2&cell=3" --seconds 6 --wait-for "window.__playground.ready"
//   node fps-probe.mjs https://exemplo.com --width 390 --height 844 --cpu-throttle 4 --json
//
// Opções: --seconds N (5)  --warmup N (1, segundos descartados)  --width/--height (1280/720)  --dpr (1)
//         --cpu-throttle X  (Emulation.setCPUThrottlingRate; 4 = CPU 4x mais lenta, aproxima um celular médio de CPU, NÃO de GPU)
//         --query "a=1"  --wait-for "JS"  --gpu (não força SwiftShader)  --webgpu (WebGPU por software)  --json
//
// AVISO HONESTO: no Chromium sem GPU o WebGL roda em SwiftShader (CPU). O número serve para comparar variantes entre si
// (por exemplo cell=2 contra cell=4) e achar regressões, não para prometer FPS em GPU real, em celular ou em tela 4K.
// O requestAnimationFrame em headless também pode ser limitado a 60 Hz.
import { glRenderer, launchChromium, parseArgs, resolveTarget } from "./lib-browser.mjs";

const { flags, positional } = parseArgs(process.argv.slice(2), { booleans: ["gpu", "webgpu", "json"] });
const target = positional[0];
if (!target) { console.error("uso: node fps-probe.mjs <arquivo|url> [opções]"); process.exit(2); }
const seconds = Number(flags.seconds ?? 5), warmup = Number(flags.warmup ?? 1);
const query = flags.query ? (String(flags.query).startsWith("?") ? "" : "?") + flags.query : "";

const { url, close } = await resolveTarget(String(target), query);
const browser = await launchChromium({ gpu: !!flags.gpu, webgpu: !!flags.webgpu });
let result;
try {
  const context = await browser.newContext({ viewport: { width: Number(flags.width ?? 1280), height: Number(flags.height ?? 720) }, deviceScaleFactor: Number(flags.dpr ?? 1) });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  if (flags["cpu-throttle"]) {
    const cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: Number(flags["cpu-throttle"]) });
  }
  await page.goto(url, { waitUntil: "load" });
  if (flags["wait-for"]) await page.waitForFunction(String(flags["wait-for"]), null, { timeout: 20000 });
  const renderer = await glRenderer(page);
  const stamps = await page.evaluate(({ ms }) => new Promise((resolve) => {
    const ts = [];
    const stop = performance.now() + ms;
    const tick = (now) => { ts.push(now); if (now < stop) requestAnimationFrame(tick); else resolve(ts); };
    requestAnimationFrame(tick);
  }), { ms: (seconds + warmup) * 1000 });
  const t0 = stamps[0] + warmup * 1000;
  const kept = stamps.filter((t) => t >= t0);
  const dts = [];
  for (let i = 1; i < kept.length; i++) dts.push(kept[i] - kept[i - 1]);
  const sorted = [...dts].sort((a, b) => a - b);
  const q = (p) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
  const avgMs = dts.reduce((s, v) => s + v, 0) / dts.length;
  result = {
    url, renderer, viewport: `${flags.width ?? 1280}x${flags.height ?? 720}@${flags.dpr ?? 1}x`, cpuThrottle: Number(flags["cpu-throttle"] ?? 1),
    seconds, frames: dts.length, fpsAvg: +(1000 / avgMs).toFixed(1), frameMs: { avg: +avgMs.toFixed(2), median: +q(0.5).toFixed(2), p95: +q(0.95).toFixed(2), p99: +q(0.99).toFixed(2), max: +sorted[sorted.length - 1].toFixed(2) },
    slowFrames: { over20ms: dts.filter((d) => d > 20).length, over33ms: dts.filter((d) => d > 33.4).length },
    errors: [...new Set(errors)],
    software: /swiftshader|llvmpipe|software/i.test(renderer),
  };
} finally {
  await browser.close();
  await close();
}
if (flags.json) console.log(JSON.stringify(result, null, 2));
else {
  console.log(`página:        ${result.url}`);
  console.log(`renderizador:  ${result.renderer}${result.software ? "  <- POR SOFTWARE (CPU): não representa GPU real" : ""}`);
  console.log(`janela:        ${result.viewport}   CPU x${result.cpuThrottle}`);
  console.log(`quadros:       ${result.frames} em ${result.seconds} s (após ${warmup} s de aquecimento)`);
  console.log(`FPS médio:     ${result.fpsAvg}`);
  console.log(`tempo/quadro:  média ${result.frameMs.avg} ms | mediana ${result.frameMs.median} | p95 ${result.frameMs.p95} | p99 ${result.frameMs.p99} | máx ${result.frameMs.max}`);
  console.log(`quadros lentos: ${result.slowFrames.over20ms} acima de 20 ms, ${result.slowFrames.over33ms} acima de 33 ms`);
  if (result.errors.length) console.log(`erros:         ${result.errors.join(" | ")}`);
  if (result.software) console.log("\naviso: SwiftShader é render por CPU. Use para comparar variantes e achar regressões; meça em GPU real antes de prometer FPS.");
}
