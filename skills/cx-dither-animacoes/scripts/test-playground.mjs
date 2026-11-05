#!/usr/bin/env node
// test-playground.mjs — testa de verdade o shader-playground.html no Chromium (SwiftShader).
//
//   node test-playground.mjs [caminho/do/shader-playground.html]
//
// Confere: compilação dos 4 presets, console limpo, as cores vêm dos tokens CSS (e mudam com o tema e com o :root),
// os presets ordenados usam só os 4 tons, animação roda/pausa/para com aba oculta e com movimento reduzido,
// erro de shader mostra a linha e mantém o programa anterior, sem rolagem horizontal em 360 px.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { decodePNG } from "./png.mjs";
import { launchChromium, resolveTarget } from "./lib-browser.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const file = process.argv[2] ?? path.join(here, "shader-playground.html");
let passed = 0;
const failures = [];
const ok = (c, m) => { if (c) { passed++; console.log("ok  " + m); } else { failures.push(m); console.log("FALHOU  " + m); } };

const { url, close } = await resolveTarget(file, "?panel=1&t=2");
const browser = await launchChromium();
const consoleProblems = [];
const watch = (page) => {
  page.on("console", (m) => { if (["error", "warning"].includes(m.type())) consoleProblems.push(m.text()); });
  page.on("pageerror", (e) => consoleProblems.push("exceção: " + e.message));
};
const distinctColors = (png) => {
  const { data, width, height } = decodePNG(png);
  const set = new Set();
  for (let i = 0; i < width * height; i++) set.add((data[i * 4] << 16) | (data[i * 4 + 1] << 8) | data[i * 4 + 2]);
  return set;
};
const hexToInt = (h) => parseInt(h.slice(1), 16);

try {
  // ---- 1. presets, tons e cores ----
  {
    const ctx = await browser.newContext({ viewport: { width: 900, height: 700 }, colorScheme: "dark" });
    const page = await ctx.newPage();
    watch(page);
    await page.goto(url);
    await page.waitForFunction("window.__playground && window.__playground.ready");
    const darkTones = await page.evaluate(() => window.__playground.tones);
    for (let i = 0; i < 4; i++) {
      await page.evaluate((n) => window.__playground.setPreset(n), i);
      await page.waitForFunction("window.__playground.ready", null, { timeout: 15000 });
      await page.waitForTimeout(200);
      const log = await page.textContent("#log");
      ok(log.trim() === "compilado", `preset ${i}: compila (${log.trim()})`);
      // recorta o miolo do canvas: os cantos arredondados do palco e a etiqueta mostram a cor da página, que não é dither
      const box = await page.locator("canvas").boundingBox();
      const shot = await page.screenshot({ clip: { x: box.x + 16, y: box.y + 16, width: box.width - 32, height: box.height - 48 } });
      const colors = distinctColors(shot);
      if (i === 1) ok(colors.size > 4, `preset 1 (halftone): borda suave, ${colors.size} cores na imagem`);
      else {
        const tones = new Set(darkTones.map(hexToInt));
        const outside = [...colors].filter((c) => !tones.has(c));
        ok(outside.length === 0 && colors.size >= 3, `preset ${i}: a imagem usa só os tons de --c0..--c3 (${colors.size} cores distintas, ${outside.length} fora dos tokens)`);
      }
    }
    // tokens: tema claro x escuro
    await page.evaluate(() => window.__playground.setTheme("light"));
    await page.waitForTimeout(100);
    const lightTones = await page.evaluate(() => window.__playground.tones);
    ok(JSON.stringify(lightTones) !== JSON.stringify(darkTones), `trocar o tema muda os tons lidos (${darkTones[0]} -> ${lightTones[0]} em --c0)`);
    // tokens: sobrescrever no :root
    await page.evaluate(() => document.documentElement.style.setProperty("--c3", "oklch(0.7 0.2 30)"));
    await page.waitForTimeout(100);
    const t3 = (await page.evaluate(() => window.__playground.tones))[3];
    ok(t3 !== lightTones[3] && /^#[0-9a-f]{6}$/.test(t3), `--c3 em oklch() é resolvido por getComputedStyle (${t3})`);
    await ctx.close();
  }

  // ---- 2. animação: rodar, pausar, aba oculta ----
  {
    const ctx = await browser.newContext({ viewport: { width: 700, height: 500 } });
    const page = await ctx.newPage();
    watch(page);
    await page.goto(url.replace("&t=2", ""));
    await page.waitForFunction("window.__playground && window.__playground.ready");
    const f0 = await page.evaluate(() => window.__playground.frames);
    await page.waitForTimeout(700);
    const f1 = await page.evaluate(() => window.__playground.frames);
    ok(f1 - f0 >= 3, `animando: ${f1 - f0} quadros em 0,7 s`);
    await page.click("#play");
    await page.waitForTimeout(150);
    const p0 = await page.evaluate(() => window.__playground.frames);
    await page.waitForTimeout(500);
    const p1 = await page.evaluate(() => window.__playground.frames);
    ok(p1 === p0, `pausado: nenhum quadro novo (${p0} -> ${p1})`);
    await page.click("#play");
    await page.waitForTimeout(500);
    const r1 = await page.evaluate(() => window.__playground.frames);
    ok(r1 - p1 >= 3, `retomou ao tocar de novo (+${r1 - p1} quadros)`);
    // aba oculta: simula document.hidden
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.waitForTimeout(200);
    const h0 = await page.evaluate(() => window.__playground.frames);
    await page.waitForTimeout(500);
    const h1 = await page.evaluate(() => window.__playground.frames);
    ok(h1 === h0, `aba oculta: o laço para (${h0} -> ${h1})`);
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.waitForTimeout(500);
    const h2 = await page.evaluate(() => window.__playground.frames);
    ok(h2 - h1 >= 3, `aba visível de novo: o laço volta (+${h2 - h1} quadros)`);
    // saída da tela: rolar o canvas para fora da janela
    await page.evaluate(() => { document.body.style.paddingTop = "3000px"; window.scrollTo(0, 0); });
    await page.waitForTimeout(300);
    const o0 = await page.evaluate(() => window.__playground.frames);
    await page.waitForTimeout(500);
    const o1 = await page.evaluate(() => window.__playground.frames);
    ok(o1 === o0, `canvas fora da tela: o laço para (IntersectionObserver) (${o0} -> ${o1})`);
    await ctx.close();
  }

  // ---- 3. movimento reduzido ----
  {
    const ctx = await browser.newContext({ viewport: { width: 700, height: 500 }, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    watch(page);
    await page.goto(url.replace("&t=2", ""));
    await page.waitForFunction("window.__playground && window.__playground.ready");
    await page.waitForTimeout(300);
    const a = await page.evaluate(() => window.__playground.frames);
    await page.waitForTimeout(700);
    const b = await page.evaluate(() => window.__playground.frames);
    ok(a === b && a >= 1, `prefers-reduced-motion: desenha um quadro e fica parado (${a} -> ${b})`);
    const note = await page.textContent("#motion");
    ok(/reduzido/i.test(note), "avisa na página que o movimento está reduzido");
    ok((await page.getAttribute("#play", "aria-pressed")) === "false", "botão Tocar/Pausar reflete o estado (aria-pressed=false)");
    await page.click("#play");
    await page.waitForTimeout(500);
    const c = await page.evaluate(() => window.__playground.frames);
    ok(c - b >= 3, `“Tocar” liga a animação por escolha explícita (+${c - b} quadros)`);
    await ctx.close();
  }

  // ---- 4. erro de shader e edição ao vivo ----
  {
    const ctx = await browser.newContext({ viewport: { width: 700, height: 500 } });
    const page = await ctx.newPage();
    watch(page);
    await page.goto(url.replace("&t=2", ""));
    await page.waitForFunction("window.__playground && window.__playground.ready");
    const bad = await page.evaluate(() => window.__playground.setSource("void mainImage(out vec4 o, in vec2 fc) {\n  o = vec4(oops, 1.0);\n}\n"));
    const log = await page.textContent("#log");
    ok(bad === false && /linha 2/.test(log), `erro de compilação aponta a linha do código do usuário (“${log.split("\n")[0].slice(0, 60)}…”)`);
    const f0 = await page.evaluate(() => window.__playground.frames);
    await page.waitForTimeout(400);
    const f1 = await page.evaluate(() => window.__playground.frames);
    ok(f1 > f0, "o programa anterior continua rodando depois do erro");
    const good = await page.evaluate(() => window.__playground.setSource("void mainImage(out vec4 o, in vec2 fc) {\n  float t = bayer8(cellId(fc));\n  o = vec4(ditherTone4(fc.x / uRes.x, t), 1.0);\n}\n"));
    ok(good === true, "um shader novo e válido é aceito ao vivo");
    // digitar no editor recompila (debounce)
    await page.fill("#src", "void mainImage(out vec4 o, in vec2 fc) { o = vec4(ditherTone4(fc.y / uRes.y, ign(cellId(fc))), 1.0); }");
    await page.waitForTimeout(700);
    ok((await page.textContent("#log")).trim() === "compilado", "digitar no textarea recompila sozinho");
    await ctx.close();
  }

  // ---- 5. responsivo ----
  {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 740 } });
    const page = await ctx.newPage();
    watch(page);
    await page.goto(url.replace("&t=2", ""));
    await page.waitForFunction("window.__playground && window.__playground.ready");
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(over <= 0, `360 px: sem rolagem horizontal (excesso ${over}px)`);
    await ctx.close();
  }

  ok(consoleProblems.length === 0, `console sem erros nem avisos${consoleProblems.length ? ": " + [...new Set(consoleProblems)].join(" | ") : ""}`);
} finally {
  await browser.close();
  await close();
}
console.log(`\n${passed} verificações passaram, ${failures.length} falharam.`);
if (failures.length) { console.log("Falhas:\n- " + failures.join("\n- ")); process.exit(1); }
