#!/usr/bin/env node
/**
 * check-layout.cjs - confere layout mobile/desktop de uma URL e falha (exit 1) se algo quebrar.
 *
 *   node check-layout.cjs <url> [--sizes 360x640,390x844,1280x800] [--primary 'button.btn.pri']
 *                         [--wait 1500] [--min-target 44] [--touch-max-width 768] [--min-font 12]
 *                         [--ignore-sel '.decor,[aria-hidden=true]'] [--steps 1,2 --step-selector '[data-go="{n}"]']
 *
 * Checagens por tamanho (cada falha vira uma string em `failures`):
 *   1. botao primario (--primary; padrao: primeiro entre [data-primary], .btn-primary, .primary, button)
 *      totalmente dentro da viewport e nao coberto por outro elemento;
 *   2. sem rolagem horizontal: scrollWidth <= largura do viewport pedido;
 *   3. alvos de toque >= --min-target px (so em viewports <= --touch-max-width);
 *   4. fonte < --min-font px em texto visivel;
 *   5. texto coberto por outro elemento (elementFromPoint no centro do texto; ignora
 *      pointer-events:none, entao overlays "so visuais" nao contam).
 * Saida: JSON em stdout ({ok, url, results:[{size, ok, failures, info}]}); exit 1 se falhar.
 */
const { launch, parseArgs, parseSizes, watchPage } = require('./_browser.cjs');

// roda NA PAGINA
function audit({ primary, minTarget, touchMax, minFont, ignoreSel, vw, vh }) {
  const failures = [], info = {};
  // vw/vh vem do tamanho pedido: em emulacao mobile o Chromium EXPANDE innerWidth ate o conteudo
  // (900px de conteudo => innerWidth 900), o que esconderia justamente a rolagem horizontal.
  const R = e => e.getBoundingClientRect();
  const ign = e => ignoreSel && e.closest(ignoreSel);
  // visivel de verdade: tamanho > 0, visibility ok e NENHUM ancestral com opacity ~0 (ex.: telas inativas)
  const vis = e => {
    const r = R(e), cs = getComputedStyle(e);
    if (!(r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none')) return false;
    for (let n = e; n && n.nodeType === 1; n = n.parentElement) if (+getComputedStyle(n).opacity <= 0.05) return false;
    return true;
  };
  const label = e => (e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '') + ' "' + (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 20) + '"');
  const relation = (a, b) => a === b || a.contains(b) || b.contains(a);

  // 1. botao primario
  let prim = null;
  const sels = primary ? [primary] : ['[data-primary]', '.btn-primary', '.primary', 'button'];
  for (const s of sels) { prim = [...document.querySelectorAll(s)].find(vis); if (prim) break; }
  if (!prim) { if (primary) failures.push(`botao primario nao encontrado/visivel (${primary})`); else info.primary = 'nenhum botao encontrado (ignorado)'; }
  else {
    const r = R(prim);
    info.primary = label(prim);
    if (r.left < -0.5 || r.top < -0.5 || r.right > vw + 0.5 || r.bottom > vh + 0.5)
      failures.push(`botao primario fora da viewport: ${label(prim)} (${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.right)},${Math.round(r.bottom)} em ${vw}x${vh})`);
    const hit = document.elementFromPoint(Math.min(vw - 1, Math.max(0, (r.left + r.right) / 2)), Math.min(vh - 1, Math.max(0, (r.top + r.bottom) / 2)));
    if (hit && !relation(prim, hit)) failures.push(`botao primario coberto por ${label(hit)}`);
  }

  // 2. rolagem horizontal
  const sw = Math.max(document.documentElement.scrollWidth, document.body ? document.body.scrollWidth : 0);
  info.scrollWidth = sw;
  if (sw > vw + 0.5) failures.push(`rolagem horizontal: scrollWidth ${sw} > largura ${vw}`);

  // 3. alvos de toque
  if (vw <= touchMax) {
    const seen = new Set();
    document.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,[role=button],[role=tab],[tabindex]:not([tabindex="-1"])').forEach(e => {
      if (!vis(e) || ign(e) || e.disabled) return;
      const r = R(e);
      if ((r.width < minTarget - 0.5 || r.height < minTarget - 0.5) && r.bottom > 0 && r.top < vh * 3) {
        const k = label(e); if (seen.has(k)) return; seen.add(k);
        failures.push(`alvo de toque pequeno ${Math.round(r.width)}x${Math.round(r.height)} (<${minTarget}): ${k}`);
      }
    });
  }

  // 4 e 5. texto: fonte e cobertura
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const done = new Set();
  let n;
  while ((n = walker.nextNode())) {
    if (!n.textContent.trim()) continue;
    const el = n.parentElement;
    if (!el || done.has(el) || /^(SCRIPT|STYLE|NOSCRIPT|TITLE)$/.test(el.tagName) || !vis(el) || ign(el)) continue;
    done.add(el);
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs < minFont - 0.01) failures.push(`fonte pequena ${fs}px (<${minFont}): ${label(el)}`);
    const rg = document.createRange(); rg.selectNodeContents(n);
    const r = rg.getBoundingClientRect();
    if (r.width < 1 || r.height < 1 || r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) continue;
    const cx = Math.min(vw - 1, Math.max(0, (r.left + r.right) / 2)), cy = Math.min(vh - 1, Math.max(0, (r.top + r.bottom) / 2));
    const hit = document.elementFromPoint(cx, cy);
    if (hit && !relation(el, hit) && !hit.contains(el)) failures.push(`texto coberto por ${label(hit)}: ${label(el)}`);
  }
  return { failures, info };
}

(async () => {
  const { pos, opt } = parseArgs(process.argv.slice(2));
  if (!pos.length) { console.error('uso: node check-layout.cjs <url> [--sizes WxH,...] [--primary seletor]'); process.exit(2); }
  const url = pos[0];
  const cfg = {
    primary: opt.primary || null,
    minTarget: Number(opt['min-target'] || 44),
    touchMax: Number(opt['touch-max-width'] || 768),
    minFont: Number(opt['min-font'] || 12),
    ignoreSel: opt['ignore-sel'] || null,
  };
  const steps = opt.steps ? String(opt.steps).split(',').map(Number) : [1];
  const stepSel = opt['step-selector'] || '[data-go="{n}"]';
  const browser = await launch();
  const results = [];
  for (const [w, h] of parseSizes(opt.sizes || '360x640,390x844,1280x800')) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 768, hasTouch: w < 768 });
    const page = await ctx.newPage();
    const problems = watchPage(page, null);
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(Number(opt.wait || 1500));
    for (const n of steps) {
      if (n !== steps[0]) {
        const el = await page.$(stepSel.replace('{n}', n));
        if (el) { await el.click().catch(() => {}); await page.waitForTimeout(Number(opt.wait || 1500)); }
      }
      const r = await page.evaluate(audit, { ...cfg, vw: w, vh: h });
      const failures = [...r.failures];
      if (n === steps[0]) failures.push(...problems.map(p => 'pagina: ' + p));
      results.push({ size: `${w}x${h}`, step: steps.length > 1 ? n : undefined, ok: failures.length === 0, failures, info: r.info });
    }
    await ctx.close();
  }
  await browser.close();
  const ok = results.every(r => r.ok);
  console.log(JSON.stringify({ ok, url, results }, null, 2));
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
