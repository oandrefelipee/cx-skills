#!/usr/bin/env node
// capture.mjs — captura de tela com Playwright (Chromium + SwiftShader) de um arquivo ou URL, em várias larguras e temas,
// com espera para animação, relógio virtual (congelar o tempo) e relatório de erros de console.
//
// Uso:
//   node capture.mjs pagina.html                          # 390 e 1280 px, claro e escuro, em ./capturas
//   node capture.mjs shader-playground.html --query "preset=2&panel=0" --widths 360,768,1280 --freeze 1500
//   node capture.mjs https://exemplo.com --schemes dark --reduced-motion --out /tmp/shots
//   node capture.mjs pagina.html --times 0,700,1400 --selector canvas      # uma captura por instante do relógio virtual
//
// Opções:
//   --out DIR            pasta de saída (padrão ./capturas)          --name PREFIXO   prefixo dos arquivos (padrão: nome do arquivo)
//   --widths a,b,c       larguras em px (padrão 390,1280)            --height N       altura da janela (padrão 800)
//   --schemes a,b        light,dark (padrão ambos; emula prefers-color-scheme)
//   --reduced-motion     emula prefers-reduced-motion: reduce (acrescenta -rm ao nome)
//   --wait MS            espera depois do load (padrão 600)          --dpr N          devicePixelRatio (padrão 1)
//   --freeze MS          relógio virtual fixo em MS: performance.now, Date.now e o timestamp do requestAnimationFrame
//   --times a,b,c        capturas em instantes do relógio virtual (MS); implica relógio virtual
//   --selector CSS       captura só esse elemento                    --full-page      captura a página inteira
//   --query "a=1&b=2"    acrescenta parâmetros à URL                 --eval "JS"      roda JS na página antes de cada captura
//   --wait-for "JS"      espera a expressão ficar verdadeira (ex.: "window.__playground.ready")
//   --gpu                não força SwiftShader (usa o GL do sistema, se houver)
//   --webgpu             liga WebGPU por software (Vulkan SwiftShader) no Chromium headless, para páginas com navigator.gpu
//   --fail-on-error      sai com código 1 se houver erro de console, exceção ou requisição falha
//
// Sobre o relógio virtual: funciona bem com animações de tempo absoluto (t = agora / 1000), como o playground. Animações que
// somam dt quadro a quadro não "pulam" para o instante pedido; use --wait nesses casos.
import path from "node:path";
import fs from "node:fs";
import { glRenderer, launchChromium, parseArgs, resolveTarget } from "./lib-browser.mjs";

const { flags, positional } = parseArgs(process.argv.slice(2), { booleans: ["reduced-motion", "full-page", "gpu", "webgpu", "fail-on-error"] });
const target = positional[0];
if (!target) {
  console.error("uso: node capture.mjs <arquivo|url> [opções]   (veja o cabeçalho do arquivo)");
  process.exit(2);
}
const widths = String(flags.widths ?? "390,1280").split(",").map(Number).filter(Boolean);
const schemes = String(flags.schemes ?? "light,dark").split(",").filter(Boolean);
const outDir = path.resolve(flags.out ?? "capturas");
const height = Number(flags.height ?? 800);
const wait = Number(flags.wait ?? 600);
const dpr = Number(flags.dpr ?? 1);
const times = flags.times ? String(flags.times).split(",").map(Number) : null;
const freeze = flags.freeze !== undefined ? Number(flags.freeze) : null;
const query = flags.query ? (String(flags.query).startsWith("?") ? "" : "?") + flags.query : "";
const baseName = flags.name ?? path.basename(String(target)).replace(/\.[^.]+$/, "").replace(/[^\w.-]+/g, "_") ?? "pagina";
fs.mkdirSync(outDir, { recursive: true });

const VIRTUAL_CLOCK = (initial) => `(() => {
  const st = window.__vt = { frozen: ${initial === null ? "false" : "true"}, t: ${initial ?? 0} };
  const realNow = performance.now.bind(performance), realDate = Date.now.bind(Date), dateBase = realDate();
  performance.now = () => (st.frozen ? st.t : realNow());
  Date.now = () => (st.frozen ? dateBase + st.t : realDate());
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => raf((ts) => cb(st.frozen ? st.t : ts));
  window.__setVirtualTime = (ms) => { st.frozen = true; st.t = ms; };
})();`;

const { url, close } = await resolveTarget(String(target), query);
const browser = await launchChromium({ gpu: !!flags.gpu, webgpu: !!flags.webgpu });
const problems = [];
const written = [];
let renderer = "";
try {
  for (const scheme of schemes) {
    for (const width of widths) {
      const context = await browser.newContext({
        viewport: { width, height },
        deviceScaleFactor: dpr,
        colorScheme: scheme === "dark" ? "dark" : "light",
        reducedMotion: flags["reduced-motion"] ? "reduce" : "no-preference",
      });
      if (freeze !== null || times) await context.addInitScript(VIRTUAL_CLOCK(freeze ?? (times ? times[0] : null)));
      const page = await context.newPage();
      const tag = `${baseName} ${width}px ${scheme}`;
      page.on("console", (m) => { if (["error", "warning"].includes(m.type())) problems.push(`[${tag}] console.${m.type()}: ${m.text()}`); });
      page.on("pageerror", (e) => problems.push(`[${tag}] exceção: ${e.message}`));
      page.on("requestfailed", (r) => problems.push(`[${tag}] requisição falhou: ${r.url()} (${r.failure()?.errorText})`));
      page.on("response", (r) => { if (r.status() >= 400) problems.push(`[${tag}] HTTP ${r.status()}: ${r.url()}`); });
      await page.goto(url, { waitUntil: "load" });
      if (!renderer) renderer = await glRenderer(page);
      if (flags["wait-for"]) await page.waitForFunction(String(flags["wait-for"]), null, { timeout: 15000 }).catch((e) => problems.push(`[${tag}] --wait-for não ficou verdadeiro: ${e.message.split("\n")[0]}`));
      await page.waitForTimeout(wait);
      if (flags.eval) await page.evaluate(String(flags.eval));
      const shoot = async (suffix) => {
        const file = path.join(outDir, `${baseName}-${width}w-${scheme}${flags["reduced-motion"] ? "-rm" : ""}${suffix}.png`);
        if (flags.selector) await page.locator(String(flags.selector)).first().screenshot({ path: file });
        else await page.screenshot({ path: file, fullPage: !!flags["full-page"] });
        written.push(file);
      };
      if (times) {
        for (const t of times) {
          await page.evaluate((ms) => window.__setVirtualTime && window.__setVirtualTime(ms), t);
          await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
          await shoot(`-t${t}`);
        }
      } else await shoot("");
      await context.close();
    }
  }
} finally {
  await browser.close();
  await close();
}
console.log(`renderizador WebGL: ${renderer}${/swiftshader|llvmpipe|software/i.test(renderer) ? "  (por software: prova correção, não desempenho de GPU)" : ""}`);
console.log(`${written.length} captura(s):\n  ` + written.join("\n  "));
if (problems.length) {
  const uniq = [...new Set(problems)];
  console.log(`\n${uniq.length} problema(s) no console/rede:\n  - ` + uniq.join("\n  - "));
  if (flags["fail-on-error"]) process.exit(1);
} else console.log("\nconsole limpo: nenhum erro, aviso, exceção nem requisição falha.");
