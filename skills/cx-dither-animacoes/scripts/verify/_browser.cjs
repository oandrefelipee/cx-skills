// _browser.cjs - helper compartilhado por shots.cjs e check-layout.cjs.
// Resolve o Playwright e o Chromium headless shell JA em cache (nunca roda `playwright install`).
//   PLAYWRIGHT_PATH   caminho do pacote playwright (opcional)
//   CHROME_PATH       executavel do chrome/headless shell (opcional)
const fs = require('fs');
const os = require('os');
const path = require('path');

function loadPlaywright() {
  const cands = [process.env.PLAYWRIGHT_PATH, 'playwright', 'playwright-core', path.join(os.homedir(), 'node_modules/playwright')].filter(Boolean);
  for (const c of cands) { try { return require(c); } catch (_) { /* tenta o proximo */ } }
  throw new Error('Playwright nao encontrado. Defina PLAYWRIGHT_PATH=/caminho/node_modules/playwright');
}

// procura recursivamente (profundidade curta) um arquivo executavel por nome
function findExe(dir, names, depth = 3) {
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return null; }
  for (const e of entries) if (e.isFile() && names.includes(e.name)) return path.join(dir, e.name);
  if (depth > 0) for (const e of entries) {
    if (e.isDirectory()) { const r = findExe(path.join(dir, e.name), names, depth - 1); if (r) return r; }
  }
  return null;
}

// Pega o headless shell de MAIOR versao em cache (macOS e Linux); cai no chromium completo.
function findChrome() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const roots = [path.join(os.homedir(), 'Library/Caches/ms-playwright'), path.join(os.homedir(), '.cache/ms-playwright'), process.env.PLAYWRIGHT_BROWSERS_PATH].filter(Boolean);
  for (const prefix of ['chromium_headless_shell-', 'chromium-']) {
    for (const r of roots) {
      let dirs = [];
      try { dirs = fs.readdirSync(r).filter(d => d.startsWith(prefix)).sort((a, b) => parseInt(b.slice(prefix.length)) - parseInt(a.slice(prefix.length))); } catch (_) { continue; }
      for (const d of dirs) {
        const exe = findExe(path.join(r, d), prefix === 'chromium_headless_shell-' ? ['chrome-headless-shell'] : ['Chromium', 'chrome'], 4);
        if (exe) return exe;
      }
    }
  }
  return undefined; // deixa o Playwright tentar o padrao
}

// Flags para WebGL em Chromium sem GPU (SwiftShader). O aviso "GPU stall due to ReadPixels" e inofensivo.
const GL_ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-dev-shm-usage'];

async function launch() {
  const pw = loadPlaywright();
  const exe = findChrome();
  return pw.chromium.launch({ headless: true, executablePath: exe, args: GL_ARGS });
}

function parseArgs(argv) {
  const pos = [], opt = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const nxt = argv[i + 1];
      if (nxt === undefined || nxt.startsWith('--')) opt[k] = true; else { opt[k] = nxt; i++; }
    } else pos.push(a);
  }
  return { pos, opt };
}

const parseSizes = (s) => String(s || '390x844').split(',').map(x => x.trim().split('x').map(Number)).filter(a => a.length === 2 && a.every(Number.isFinite));

// Ouve console/rede e devolve a lista viva de problemas.
function watchPage(page, ignore) {
  const problems = [];
  const skip = (t) => ignore && ignore.test(t);
  page.on('console', m => { const t = m.text(); if (m.type() === 'error' && !skip(t)) problems.push('console.error: ' + t); });
  page.on('pageerror', e => { const t = String(e.message || e); if (!skip(t)) problems.push('pageerror: ' + t); });
  page.on('requestfailed', r => { const t = `${r.url()} (${r.failure() && r.failure().errorText})`; if (!skip(t)) problems.push('requestfailed: ' + t); });
  page.on('response', r => { if (r.status() >= 400 && !skip(r.url())) problems.push(`http ${r.status()}: ${r.url()}`); });
  return problems;
}

module.exports = { launch, loadPlaywright, findChrome, parseArgs, parseSizes, watchPage, GL_ARGS };
