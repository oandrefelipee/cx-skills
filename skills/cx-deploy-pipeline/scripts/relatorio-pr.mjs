#!/usr/bin/env node
// Gera o relatório HTML autocontido de um PR a partir de um JSON, e o index.html da pasta.
// Sem dependências: Node 18+ ou Bun. Imagens locais entram embutidas (data URI); nada é buscado na rede.
//
// Uso:
//   node relatorio-pr.mjs <dados.json> [--saida arquivo.html] [--dir pasta] [--adaptador caminho] [--sem-indice]
//
// Destino, nesta ordem: --saida; --dir; `relatorios.dir` do adaptador; docs/relatorios/pr na raiz do repo.
// Nome: <numero>-<slug-do-titulo>.html. O index.html da pasta lista todos os relatórios (lidos das <meta cx-*>).
// Formato do JSON: references/relatorio-pr.md (exemplo em assets/exemplo-relatorio.json).

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, extname, join, resolve, basename } from "node:path";
import { argumentos, lerAdaptador } from "./_adaptador.mjs";

const opts = argumentos(process.argv.slice(2), ["saida", "dir", "adaptador"]);
if (opts.ajuda || opts.help || !opts._[0]) {
  console.log("Uso: node relatorio-pr.mjs <dados.json> [--saida arq.html] [--dir pasta] [--adaptador caminho] [--sem-indice]");
  process.exit(opts._[0] ? 0 : 2);
}

const origem = resolve(opts._[0]);
const d = JSON.parse(readFileSync(origem, "utf8"));
const baseImg = dirname(origem);

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const slug = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
const MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml", ".avif": "image/avif" };

function imagem(src, alt) {
  if (/^(https?:|data:)/.test(src)) return `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy">`;
  const p = resolve(baseImg, src);
  if (!existsSync(p)) return `<p class="vazio">Captura não encontrada: ${esc(src)}</p>`;
  const b64 = readFileSync(p).toString("base64");
  return `<img src="data:${MIME[extname(p).toLowerCase()] || "application/octet-stream"};base64,${b64}" alt="${esc(alt)}" loading="lazy">`;
}

function lado(x, rotulo) {
  if (!x) return `<p class="vazio">Sem ${rotulo.toLowerCase()}</p>`;
  if (x.ascii) return `<pre class="ascii">${esc(x.ascii)}</pre>`;
  if (x.imagem) return imagem(x.imagem, `${rotulo}: ${x.legenda || ""}`);
  if (x.texto) return `<p>${esc(x.texto)}</p>`;
  return "";
}

const TOM = { pass: "ok", success: "ok", ok: "ok", saudavel: "ok", fail: "erro", failure: "erro", erro: "erro", degradado: "erro", cancel: "erro", pending: "aviso", pendente: "aviso", skipping: "neutro", pulado: "neutro", alto: "erro", medio: "aviso", baixo: "neutro" };
const NOME = { pass: "ok", fail: "falha", pending: "pendente", skipping: "pulado", cancel: "cancelado", alto: "alto", medio: "médio", baixo: "baixo", saudavel: "saudável", degradado: "degradado", pendente: "pendente" };
const selo = (estado) => `<span class="selo ${TOM[String(estado).toLowerCase()] || "neutro"}">${esc(NOME[estado] || estado)}</span>`;

const pr = d.pr || {};
const checks = (d.checks || []).map((c) => ({ nome: c.nome ?? c.check, estado: c.estado, link: c.link, provedor: c.provedor }));
const nOk = checks.filter((c) => ["pass", "ok", "success"].includes(c.estado)).length;

const secoes = [];
if (d.oQueMudou?.length) secoes.push(`<section><h2>O que mudou</h2><ul class="lista">${d.oQueMudou.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></section>`);
if (d.antesDepois?.length) secoes.push(`<section><h2>Antes → depois</h2>${d.antesDepois.map((p) => `
  <figure class="par">
    <figcaption>${esc(p.titulo)}</figcaption>
    <div class="lados"><div><span class="rotulo">Antes</span>${lado(p.antes, "Antes")}</div><div><span class="rotulo">Depois</span>${lado(p.depois, "Depois")}</div></div>
  </figure>`).join("")}</section>`);
if (checks.length) secoes.push(`<section><h2>Checks <span class="conta">${nOk}/${checks.length} ok</span></h2><table><thead><tr><th>Check</th><th>Estado</th><th>Provedor</th></tr></thead><tbody>${checks.map((c) => `<tr><td>${c.link ? `<a href="${esc(c.link)}">${esc(c.nome)}</a>` : esc(c.nome)}</td><td>${selo(c.estado)}</td><td class="sutil">${esc(c.provedor || "")}</td></tr>`).join("")}</tbody></table></section>`);
if (d.deploy?.length) secoes.push(`<section><h2>Deploy</h2><table><thead><tr><th>Ambiente</th><th>SHA</th><th>Health</th><th>Quando</th></tr></thead><tbody>${d.deploy.map((x) => `<tr><td>${x.link ? `<a href="${esc(x.link)}">${esc(x.ambiente)}</a>` : esc(x.ambiente)}</td><td><code>${esc(String(x.sha || "").slice(0, 7))}</code></td><td>${selo(x.health || x.estado || "pendente")}</td><td class="sutil">${esc(x.quando || "")}</td></tr>`).join("")}</tbody></table></section>`);
if (d.dora) {
  const k = [["Deploys", d.dora.frequenciaDeploy], ["Tempo até produção", d.dora.leadTime], ["Taxa de falha", d.dora.taxaFalha], ["Recuperação", d.dora.recuperacao]];
  secoes.push(`<section><h2>DORA leve <span class="conta">${esc(d.dora.periodo || "")}</span></h2><div class="kpis">${k.map(([r, v]) => `<div class="kpi"><span class="rotulo">${r}</span><strong>${esc(v ?? "—")}</strong></div>`).join("")}</div></section>`);
}
if (d.riscos?.length) secoes.push(`<section><h2>Riscos</h2><ul class="riscos">${d.riscos.map((r) => `<li>${selo(r.nivel)}<div><p>${esc(r.texto)}</p>${r.mitigacao ? `<p class="sutil">Mitigação: ${esc(r.mitigacao)}</p>` : ""}</div></li>`).join("")}</ul></section>`);
if (d.rollback) secoes.push(`<section><h2>Plano de volta</h2><p>${esc(d.rollback)}</p></section>`);

const CSS = `
:root{--fundo:#fafaf9;--superficie:#fff;--texto:#1c1917;--sutil:#57534e;--linha:#e7e5e4;--destaque:#1d4ed8;
--ok:#15803d;--ok-f:#dcfce7;--erro:#b91c1c;--erro-f:#fee2e2;--aviso:#a16207;--aviso-f:#fef3c7;--neutro:#57534e;--neutro-f:#f5f5f4;color-scheme:light}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--fundo:#0c0a09;--superficie:#1c1917;--texto:#f5f5f4;--sutil:#a8a29e;--linha:#292524;--destaque:#93c5fd;
--ok:#86efac;--ok-f:#14532d55;--erro:#fca5a5;--erro-f:#7f1d1d55;--aviso:#fcd34d;--aviso-f:#78350f55;--neutro:#d6d3d1;--neutro-f:#29252488;color-scheme:dark}}
:root[data-theme="dark"]{--fundo:#0c0a09;--superficie:#1c1917;--texto:#f5f5f4;--sutil:#a8a29e;--linha:#292524;--destaque:#93c5fd;
--ok:#86efac;--ok-f:#14532d55;--erro:#fca5a5;--erro-f:#7f1d1d55;--aviso:#fcd34d;--aviso-f:#78350f55;--neutro:#d6d3d1;--neutro-f:#29252488;color-scheme:dark}
*{box-sizing:border-box}body{margin:0;background:var(--fundo);color:var(--texto);font:15px/1.55 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:960px;margin:0 auto;padding:32px 16px 64px}
header{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;padding-bottom:20px;border-bottom:1px solid var(--linha);margin-bottom:8px}
h1{font-size:24px;line-height:1.25;margin:4px 0 8px;letter-spacing:-.01em}h2{font-size:15px;margin:0 0 12px;display:flex;gap:8px;align-items:baseline}
.meta{color:var(--sutil);font-size:13px;display:flex;flex-wrap:wrap;gap:4px 14px}.meta code{font-size:12px}
.resumo{margin:12px 0 0;max-width:70ch}
section{padding:22px 0;border-bottom:1px solid var(--linha)}section:last-of-type{border-bottom:0}
a{color:var(--destaque);text-underline-offset:2px}code{font:12px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace}
.sutil,.conta{color:var(--sutil);font-weight:400;font-size:13px}
.lista{margin:0;padding-left:18px}.lista li{margin:2px 0}
table{width:100%;border-collapse:collapse;font-size:14px}th{text-align:left;font-weight:500;color:var(--sutil);font-size:12px;padding:6px 8px;border-bottom:1px solid var(--linha)}
td{padding:8px;border-bottom:1px solid var(--linha);vertical-align:top}tr:last-child td{border-bottom:0}
.selo{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:500;padding:2px 8px;border-radius:999px;white-space:nowrap}
.selo::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}
.ok{color:var(--ok);background:var(--ok-f)}.erro{color:var(--erro);background:var(--erro-f)}.aviso{color:var(--aviso);background:var(--aviso-f)}.neutro{color:var(--neutro);background:var(--neutro-f)}
.par{margin:0 0 20px}.par figcaption{font-weight:500;margin-bottom:8px}
.lados{display:grid;grid-template-columns:1fr 1fr;gap:12px}.lados>div{background:var(--superficie);border:1px solid var(--linha);border-radius:10px;padding:12px;min-width:0}
.rotulo{display:block;font-size:12px;color:var(--sutil);margin-bottom:6px}
.ascii{margin:0;overflow-x:auto;font:12px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre}
img{max-width:100%;height:auto;border-radius:6px;display:block}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.kpi{background:var(--superficie);border:1px solid var(--linha);border-radius:10px;padding:12px}
.kpi strong{font-size:20px;font-variant-numeric:tabular-nums}
.riscos{list-style:none;margin:0;padding:0}.riscos li{display:grid;grid-template-columns:72px 1fr;gap:12px;align-items:flex-start;padding:6px 0}.riscos p{margin:0}
.vazio{color:var(--sutil);font-size:13px;margin:0}
button.tema{font:inherit;font-size:13px;color:var(--sutil);background:transparent;border:1px solid var(--linha);border-radius:8px;padding:4px 10px;cursor:pointer}
footer{color:var(--sutil);font-size:12px;margin-top:24px}
@media (max-width:720px){.lados{grid-template-columns:1fr}.kpis{grid-template-columns:1fr 1fr}header{flex-direction:column}}
@media print{button.tema{display:none}}`;

const TEMA_JS = `<script>(function(){var r=document.documentElement,k="cx-tema";try{var t=localStorage.getItem(k);if(t)r.dataset.theme=t}catch(e){}
document.addEventListener("click",function(ev){if(!ev.target.closest(".tema"))return;var escuro=r.dataset.theme?r.dataset.theme==="dark":matchMedia("(prefers-color-scheme: dark)").matches;r.dataset.theme=escuro?"light":"dark";try{localStorage.setItem(k,r.dataset.theme)}catch(e){}})})()</script>`;

const pagina = (titulo, metas, corpo) => `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title>
${metas}
<style>${CSS}</style>
${TEMA_JS}
</head>
<body>
<main>
${corpo}
</main>
</body>
</html>
`;

const titulo = d.titulo || `PR #${pr.numero}`;
const metas = [["cx-pr", pr.numero], ["cx-titulo", titulo], ["cx-estado", d.estado || ""], ["cx-data", d.data || ""]].map(([n, v]) => `<meta name="${n}" content="${esc(v)}">`).join("\n");
const corpo = `<header>
  <div>
    <div class="meta">${pr.url ? `<a href="${esc(pr.url)}">PR #${esc(pr.numero)}</a>` : `PR #${esc(pr.numero)}`}${pr.branch ? `<code>${esc(pr.branch)} → ${esc(pr.base || "main")}</code>` : ""}${pr.autor ? `<span>${esc(pr.autor)}</span>` : ""}${d.data ? `<span>${esc(d.data)}</span>` : ""}</div>
    <h1>${esc(titulo)}</h1>
    ${d.estado ? selo(d.estado) : ""}
    ${d.resumo ? `<p class="resumo">${esc(d.resumo)}</p>` : ""}
  </div>
  <button class="tema" type="button">Tema</button>
</header>
${secoes.join("\n")}
<footer>Gerado por cx-deploy-pipeline · relatorio-pr.mjs</footer>`;

let destino;
if (opts.saida) destino = resolve(opts.saida);
else {
  let dir = opts.dir;
  if (!dir) {
    let a = null;
    try { a = lerAdaptador(opts.adaptador, dirname(origem)); } catch { /* segue com o padrão */ }
    let raiz = dirname(origem);
    while (!existsSync(join(raiz, ".git")) && dirname(raiz) !== raiz) raiz = dirname(raiz);
    dir = join(raiz, a?.dados?.relatorios?.dir || "docs/relatorios/pr");
  }
  destino = join(resolve(dir), `${pr.numero}-${slug(titulo)}.html`);
}
mkdirSync(dirname(destino), { recursive: true });
writeFileSync(destino, pagina(`${titulo} · PR #${pr.numero}`, metas, corpo));
console.log(`Relatório: ${destino}`);

if (!opts["sem-indice"]) {
  const pasta = dirname(destino);
  const lerMeta = (html, n) => (html.match(new RegExp(`<meta name="${n}" content="([^"]*)">`)) || [])[1] || "";
  const itens = readdirSync(pasta).filter((f) => f.endsWith(".html") && f !== "index.html").map((f) => {
    const html = readFileSync(join(pasta, f), "utf8");
    return { f, pr: Number(lerMeta(html, "cx-pr")) || 0, titulo: lerMeta(html, "cx-titulo") || f, estado: lerMeta(html, "cx-estado"), data: lerMeta(html, "cx-data") };
  }).filter((x) => x.pr).sort((a, b) => b.pr - a.pr);
  const linhas = itens.map((x) => `<tr><td>#${x.pr}</td><td><a href="${esc(basename(x.f))}">${x.titulo}</a></td><td>${x.estado ? selo(x.estado) : ""}</td><td class="sutil">${x.data}</td></tr>`).join("");
  const idx = `<header><div><h1>Relatórios de PR</h1><div class="meta">${itens.length} relatório(s)</div></div><button class="tema" type="button">Tema</button></header>
<section><table><thead><tr><th>PR</th><th>Título</th><th>Estado</th><th>Data</th></tr></thead><tbody>${linhas}</tbody></table></section>`;
  writeFileSync(join(pasta, "index.html"), pagina("Relatórios de PR", "", idx));
  console.log(`Índice: ${join(pasta, "index.html")} (${itens.length})`);
}
