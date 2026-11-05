#!/usr/bin/env node
/**
 * shots.cjs - prints de uma URL em varios tamanhos (Playwright + Chromium headless com SwiftShader).
 *
 *   node shots.cjs <url> <saidaDir> [--sizes 360x640,390x844,1280x800] [--wait 2500]
 *                  [--steps 1,2,3] [--step-selector '[data-go="{n}"]'] [--dpr 1] [--full]
 *                  [--ignore 'regex'] [--prefix nome]
 *
 *  --wait ms          espera depois de carregar (animacoes/WebGL) antes de cada print.
 *  --steps 1,2,3      fluxo em passos: o passo 1 e a tela inicial; para cada n seguinte clica em
 *                     --step-selector (padrao [data-go="{n}"], {n} = numero) e tira outro print
 *                     (nome ...-s{n}.png).
 *  --full             full-page screenshot.
 *  --ignore regex     ignora mensagens de console/rede que casem (ex.: 'jsdelivr|GPU stall').
 * Saida: <saidaDir>/<prefix>-<WxH>[-s<n>].png. Imprime erros de console/pagina/rede (so
 * console.error, pageerror, requestfailed e HTTP >= 400). Codigo de saida 1 se houver erro.
 * Nao instala nada: usa o Chromium em cache (veja _browser.cjs). Sirva por HTTP (serve.mjs).
 */
const fs = require('fs');
const path = require('path');
const { launch, parseArgs, parseSizes, watchPage } = require('./_browser.cjs');

(async () => {
  const { pos, opt } = parseArgs(process.argv.slice(2));
  if (pos.length < 2) { console.error('uso: node shots.cjs <url> <saidaDir> [--sizes WxH,...] [--wait ms] [--steps 1,2,3]'); process.exit(2); }
  const [url, outDir] = pos;
  fs.mkdirSync(outDir, { recursive: true });
  const sizes = parseSizes(opt.sizes || '360x640,390x844,1280x800');
  const wait = Number(opt.wait ?? 2500);
  const steps = opt.steps ? String(opt.steps).split(',').map(Number) : [];
  const stepSel = opt['step-selector'] || '[data-go="{n}"]';
  const ignore = opt.ignore ? new RegExp(opt.ignore, 'i') : null;
  const prefix = opt.prefix || (new URL(url).pathname.split('/').filter(Boolean).pop() || 'index').replace(/\.html?$/, '');

  const browser = await launch();
  const allProblems = [];
  for (const [w, h] of sizes) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: Number(opt.dpr || 1), isMobile: w < 768, hasTouch: w < 768 });
    const page = await ctx.newPage();
    const problems = watchPage(page, ignore);
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(wait);
    const shot = async (suffix) => {
      const f = path.join(outDir, `${prefix}-${w}x${h}${suffix}.png`);
      await page.screenshot({ path: f, fullPage: !!opt.full });
      console.log('shot', f);
    };
    await shot(steps.length ? `-s${steps[0]}` : '');
    for (const n of steps.slice(1)) {
      const sel = stepSel.replace('{n}', n);
      const el = await page.$(sel);
      if (!el) { problems.push(`passo ${n}: seletor nao encontrado (${sel})`); continue; }
      await el.click({ timeout: 5000 }).catch(e => problems.push(`passo ${n}: clique falhou (${e.message.split('\n')[0]})`));
      await page.waitForTimeout(wait);
      await shot(`-s${n}`);
    }
    for (const p of problems) allProblems.push(`[${w}x${h}] ${p}`);
    await ctx.close();
  }
  await browser.close();
  if (allProblems.length) {
    console.log('\nPROBLEMAS (' + allProblems.length + '):');
    [...new Set(allProblems)].forEach(p => console.log(' - ' + p));
    process.exit(1);
  }
  console.log('\nsem erros de console/rede');
})().catch(e => { console.error(e); process.exit(2); });
