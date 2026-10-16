#!/usr/bin/env node
// Relatório HTML de um PR (v2), gerado de um JSON, e o index.html da pasta.
// Determinístico: o mesmo JSON gera o mesmo HTML (sem data atual, sem aleatório). Sem dependências: Node 18+ ou Bun.
// Autocontido: capturas locais entram embutidas (data URI); a única coisa de fora são as fontes do Google, com fallback.
//
// Uso:
//   node relatorio-pr.mjs <dados.json> [--saida arquivo.html] [--dir pasta] [--adaptador caminho] [--sem-indice]
//
// Destino, nesta ordem: --saida; --dir; `relatorios.dir` do adaptador; docs/relatorios/pr na raiz do repo.
// Nome: <numero>-<slug-do-titulo>.html. O index.html da pasta lista todos os relatórios (lidos das <meta cx-*>).
// Formato do JSON: references/relatorio-pr.md (exemplo em assets/exemplo-relatorio.json).
// Estrutura do corpo inspirada em humanlayer/skills (visual-pr) e o desenho em nicobailon/visual-explainer.

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
// Só http(s), âncora ou caminho relativo vira href; javascript:, data: e afins viram "#".
const href = (u) => { const v = String(u ?? "").trim(); return /^(https?:\/\/|#|\.{0,2}\/|[\w-]+(\.[\w-]+)*(\/|$))/i.test(v) && !/^[a-z][a-z0-9+.-]*:/i.test(v.replace(/^https?:\/\//i, "")) ? esc(v) : "#"; };
const MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml", ".avif": "image/avif" };
const numero = (n) => new Intl.NumberFormat("pt-BR").format(n);
function duracao(seg) {
  if (seg == null) return "";
  const s = Math.round(seg);
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m} min${s % 60 ? ` ${s % 60} s` : ""}` : `${Math.floor(m / 60)} h ${m % 60} min`;
}

function imagem(src, alt) {
  if (/^(https?:|data:)/.test(src)) return `<img src="${href(src)}" alt="${esc(alt)}" loading="lazy">`;
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

const TOM = { pass: "ok", success: "ok", ok: "ok", saudavel: "ok", feito: "ok", fail: "erro", failure: "erro", erro: "erro", degradado: "erro", cancel: "erro", pending: "aviso", pendente: "aviso", agora: "aviso", skipping: "neutro", pulado: "neutro", alto: "erro", medio: "aviso", baixo: "neutro", flaky: "aviso" };
const NOME = { pass: "ok", fail: "falha", pending: "pendente", skipping: "pulado", cancel: "cancelado", alto: "alto", medio: "médio", baixo: "baixo", saudavel: "saudável", degradado: "degradado", pendente: "pendente" };
const tom = (estado) => TOM[String(estado).toLowerCase()] || "neutro";
const selo = (estado, texto) => `<span class="selo ${tom(estado)}">${esc(texto ?? NOME[estado] ?? estado)}</span>`;

// Destaque mínimo e determinístico de diff: linhas + e - ganham cor; o resto fica como está.
function codigo(bloco) {
  const linhas = String(bloco.codigo ?? "").replace(/\s+$/, "").split("\n");
  const html = bloco.lang === "diff"
    ? linhas.map((l) => `<span class="${l.startsWith("+") ? "mais" : l.startsWith("-") ? "menos" : ""}">${esc(l)}</span>`).join("\n")
    : esc(linhas.join("\n"));
  return `<pre class="codigo" data-lang="${esc(bloco.lang || "text")}"><code>${html}</code></pre>`;
}

function sparkline(entrada) {
  const valores = (entrada || []).map(Number).filter(Number.isFinite);
  if (!valores.length) return "";
  const max = Math.max(...valores), min = Math.min(...valores), w = 160, h = 36, n = valores.length;
  const pts = valores.map((v, i) => `${n === 1 ? 0 : ((i / (n - 1)) * w).toFixed(1)},${(h - 2 - ((v - min) / (max - min || 1)) * (h - 6)).toFixed(1)}`).join(" ");
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(`Latência depois do deploy: ${valores.join(", ")} ms`)}"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
}

const pr = d.pr || {};
const checks = (d.checks || []).map((c) => ({ nome: c.nome ?? c.check, estado: c.estado, link: c.link, provedor: c.provedor, duracaoSeg: c.duracaoSeg, flaky: c.flaky, nota: c.nota }));
const nOk = checks.filter((c) => tom(c.estado) === "ok").length;
const nConta = checks.filter((c) => tom(c.estado) !== "neutro").length; // pulado não conta contra
const arquivos = d.arquivos || {};
const titulo = d.titulo || `PR #${pr.numero}`;

// ---- KPIs: os do JSON; senão, derivados dos dados ----
const kpis = d.kpis?.length ? d.kpis : [
  checks.length && { rotulo: "Checks", valor: `${nOk}/${nConta}`, nota: nOk === nConta ? "verde no SHA final" : "faltam checks", tom: nOk === nConta ? "ok" : "aviso" },
  d.dora?.leadTime && { rotulo: "Tempo até produção", valor: d.dora.leadTime, nota: d.dora.periodo ? `média de ${d.dora.periodo}` : "" },
  arquivos.total != null && { rotulo: "Arquivos", valor: numero(arquivos.total), nota: `+${numero(arquivos.mais ?? 0)} −${numero(arquivos.menos ?? 0)} linhas` },
  checks.some((c) => c.duracaoSeg) && { rotulo: "Tempo de CI", valor: duracao(checks.reduce((s, c) => Math.max(s, c.duracaoSeg || 0), 0)), nota: "check mais longo" },
].filter(Boolean);

// ---- Seções (cada uma entra na navegação) ----
const secoes = [];
const sec = (id, nome, html, extra = "") => secoes.push({ id, nome, html: `<section id="${id}" class="bloco ${extra}"><h2>${nome}</h2>${html}</section>` });

if (d.porque || d.atencao?.length) {
  sec("porque", "Por quê", `${d.porque ? `<p class="porque">${esc(d.porque)}</p>` : ""}${d.atencao?.length ? `<h3>Pontos de atenção</h3><ul class="atencao">${d.atencao.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}`, "destaque");
}
if (d.linhaDoTempo?.length) {
  sec("linha", "Linha do tempo", `<ol class="tempo">${d.linhaDoTempo.map((e) => `<li class="${esc(e.estado || "futuro")}"><b>${esc(e.etapa)}</b><span>${esc([e.quando, e.nota].filter(Boolean).join(" · "))}</span></li>`).join("")}</ol>`);
}
if (d.oQueMudou?.length) sec("mudou", "O que mudou", `<ul class="lista">${d.oQueMudou.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`);
if (d.antesDepois?.length) {
  const abas = d.antesDepois.length > 1
    ? `<div class="abas" role="tablist">${d.antesDepois.map((p, i) => `<button role="tab" type="button" aria-selected="${i === 0}" data-par="${i}">${esc(p.titulo)}</button>`).join("")}</div>` : "";
  const pares = d.antesDepois.map((p, i) => {
    const comparavel = p.antes?.imagem && p.depois?.imagem;
    const deslizante = comparavel ? `<div class="desliza" hidden><div class="desliza-pilha">${lado(p.antes, "Antes")}<div class="desliza-depois">${lado(p.depois, "Depois")}</div></div><input type="range" min="0" max="100" value="50" aria-label="Comparar antes e depois"></div>` : "";
    return `<figure class="par" data-par="${i}"${i ? " hidden" : ""}>
      <figcaption>${esc(p.titulo)}${comparavel ? `<span class="modo"><button type="button" aria-pressed="true" data-modo="lados">Lado a lado</button><button type="button" aria-pressed="false" data-modo="desliza">Deslizante</button></span>` : ""}</figcaption>
      <div class="lados">${p.antes ? `<div><span class="rotulo">Antes</span>${lado(p.antes, "Antes")}</div>` : ""}<div><span class="rotulo novo">${p.antes ? "Depois" : "Prévia"}</span>${lado(p.depois, "Depois")}</div></div>
      ${deslizante}
    </figure>`;
  }).join("");
  sec("antes-depois", "Antes → depois", abas + pares);
}
if (d.esboco?.length) {
  sec("esboco", "Esboço da mudança", d.esboco.map((b) => `<div class="esboco">${b.titulo ? `<h3>${esc(b.titulo)}</h3>` : ""}${b.nota ? `<p class="sutil">${esc(b.nota)}</p>` : ""}${codigo(b)}</div>`).join(""));
}
if (checks.length) {
  const maior = Math.max(...checks.map((c) => c.duracaoSeg || 0), 1);
  const linhas = (lista) => lista.map((c) => `<tr><td>${c.link ? `<a href="${href(c.link)}">${esc(c.nome)}</a>` : esc(c.nome)}${c.nota ? `<small>${esc(c.nota)}</small>` : ""}</td><td>${selo(c.estado)}</td><td class="sutil">${esc(c.provedor || "")}</td><td>${c.duracaoSeg ? `<div class="barra" title="${duracao(c.duracaoSeg)}"><span style="width:${Math.max(3, Math.round((c.duracaoSeg / maior) * 100))}%"></span></div><small class="num">${duracao(c.duracaoSeg)}</small>` : ""}</td></tr>`).join("");
  const instaveis = checks.filter((c) => c.flaky);
  sec("checks", `Checks <span class="conta">${nOk}/${nConta} ok${nConta < checks.length ? ` · ${checks.length - nConta} pulado(s)` : ""}</span>`, `<div class="rolagem"><table><thead><tr><th>Check</th><th>Estado</th><th>Provedor</th><th>Duração</th></tr></thead><tbody>${linhas(checks)}</tbody></table></div>${instaveis.length ? `<details><summary>${instaveis.length} instável(is) em quarentena</summary><ul class="lista">${instaveis.map((c) => `<li><code>${esc(c.nome)}</code> ${esc(c.flaky === true ? "" : c.flaky)}</li>`).join("")}</ul></details>` : ""}`);
}
if (d.deploy?.length) {
  sec("deploy", "Deploy", `<div class="deploys">${d.deploy.map((x) => `<div class="cartao"><div class="cartao-topo"><b>${x.link ? `<a href="${href(x.link)}">${esc(x.ambiente)}</a>` : esc(x.ambiente)}</b>${selo(x.health || x.estado || "pendente")}</div>
    <dl>${x.sha ? `<dt>SHA</dt><dd><code>${esc(String(x.sha).slice(0, 7))}</code></dd>` : ""}${x.versao ? `<dt>Versão</dt><dd>${esc(x.versao)}</dd>` : ""}${x.migracao ? `<dt>Migração</dt><dd>${esc(x.migracao)}</dd>` : ""}${x.p95 ? `<dt>p95</dt><dd>${esc(x.p95)}</dd>` : ""}${x.quando ? `<dt>Quando</dt><dd>${esc(x.quando)}</dd>` : ""}</dl>
    ${sparkline(x.latenciaMs)}</div>`).join("")}</div>`);
}
if (d.riscos?.length || d.rollback) {
  sec("riscos", "Riscos e plano de volta", `<div class="duas">${d.riscos?.length ? `<ul class="riscos">${d.riscos.map((r) => `<li>${selo(r.nivel)}<div><p>${esc(r.texto)}</p>${r.mitigacao ? `<p class="sutil">Mitigação: ${esc(r.mitigacao)}</p>` : ""}</div></li>`).join("")}</ul>` : "<div></div>"}${d.rollback ? `<div class="volta"><h3>Plano de volta</h3><p>${esc(d.rollback)}</p></div>` : ""}</div>`);
}
if (arquivos.lista?.length) {
  sec("arquivos", `Arquivos <span class="conta">${numero(arquivos.lista.length)}</span>`, `<details><summary>Ver a lista</summary><div class="rolagem"><table class="arq"><tbody>${arquivos.lista.map((a) => `<tr><td><code>${esc(a.caminho)}</code></td><td class="num mais">+${numero(a.mais ?? 0)}</td><td class="num menos">−${numero(a.menos ?? 0)}</td></tr>`).join("")}</tbody></table></div></details>`);
}

// ---- Página ----
const FONTES = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">`;

const CSS = `
:root{--fundo:#f7f6f3;--superficie:#fff;--recuo:#f1efea;--texto:#191714;--sutil:#605a52;--linha:rgba(25,23,20,.1);--destaque:#2f4fd8;--destaque-f:rgba(47,79,216,.08);
--ok:#15803d;--ok-f:#dcfce7;--erro:#b91c1c;--erro-f:#fee2e2;--aviso:#a16207;--aviso-f:#fef3c7;--neutro:#57534e;--neutro-f:#f0eeea;
--serif:"Instrument Serif",ui-serif,Georgia,serif;--sans:"Geist",ui-sans-serif,-apple-system,"Segoe UI",sans-serif;--mono:"Geist Mono",ui-monospace,SFMono-Regular,Menlo,monospace;color-scheme:light}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--fundo:#0e0d0c;--superficie:#171614;--recuo:#1d1b19;--texto:#f2f0ec;--sutil:#a39d94;--linha:rgba(255,255,255,.09);--destaque:#93a8ff;--destaque-f:rgba(147,168,255,.1);
--ok:#86efac;--ok-f:rgba(20,83,45,.4);--erro:#fca5a5;--erro-f:rgba(127,29,29,.4);--aviso:#fcd34d;--aviso-f:rgba(120,53,15,.4);--neutro:#d6d3d1;--neutro-f:rgba(68,64,60,.5);color-scheme:dark}}
:root[data-theme="dark"]{--fundo:#0e0d0c;--superficie:#171614;--recuo:#1d1b19;--texto:#f2f0ec;--sutil:#a39d94;--linha:rgba(255,255,255,.09);--destaque:#93a8ff;--destaque-f:rgba(147,168,255,.1);
--ok:#86efac;--ok-f:rgba(20,83,45,.4);--erro:#fca5a5;--erro-f:rgba(127,29,29,.4);--aviso:#fcd34d;--aviso-f:rgba(120,53,15,.4);--neutro:#d6d3d1;--neutro-f:rgba(68,64,60,.5);color-scheme:dark}
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:16px}@media (max-width:860px){html{scroll-padding-top:64px}}
body{margin:0;color:var(--texto);font:15px/1.6 var(--sans);background:var(--fundo);
background-image:radial-gradient(1200px 500px at 85% -10%,var(--destaque-f),transparent 70%),linear-gradient(var(--linha) 1px,transparent 1px);background-size:auto,100% 32px;background-attachment:fixed}
a{color:var(--destaque);text-underline-offset:2px}code,pre{font-family:var(--mono)}code{font-size:12.5px}
.casca{max-width:1180px;margin:0 auto;padding:32px 16px 72px;display:grid;grid-template-columns:168px minmax(0,1fr);gap:0 40px}
.indice{position:sticky;top:24px;align-self:start;display:flex;flex-direction:column;gap:2px;font-size:13px;padding-top:6px}
.indice span{font:500 11px var(--sans);letter-spacing:.08em;text-transform:uppercase;color:var(--sutil);margin-bottom:6px}
.indice a{color:var(--sutil);text-decoration:none;padding:4px 10px;border-left:2px solid var(--linha)}.indice a:hover,.indice a.ativo{color:var(--texto);border-left-color:var(--destaque)}
.principal{min-width:0}
.topo{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;color:var(--sutil);font-size:13px}.topo .esp{flex:1}
.btn{font:inherit;font-size:13px;color:var(--texto);background:var(--superficie);border:1px solid var(--linha);border-radius:8px;padding:5px 11px;cursor:pointer}
h1{font:400 clamp(30px,4.4vw,44px)/1.08 var(--serif);letter-spacing:-.01em;margin:14px 0 10px;text-wrap:balance}
.resumo{color:var(--sutil);max-width:68ch;margin:0;font-size:16px}.selos{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.links{display:flex;flex-wrap:wrap;gap:6px 14px;margin-top:10px;font-size:13px}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:26px 0 8px}
.kpi{background:var(--superficie);border:1px solid var(--linha);border-radius:14px;padding:14px 16px;min-width:0}
.kpi span{display:block;color:var(--sutil);font-size:12.5px}.kpi strong{display:block;font:400 30px/1.15 var(--serif);margin-top:4px;font-variant-numeric:tabular-nums}
.kpi small{color:var(--sutil);font-size:12px}.kpi.ok strong{color:var(--ok)}.kpi.aviso strong{color:var(--aviso)}
.bloco{container-type:inline-size;background:var(--superficie);border:1px solid var(--linha);border-radius:16px;padding:22px 22px 24px;margin-top:16px;min-width:0}
.bloco.destaque{background:linear-gradient(135deg,var(--destaque-f),var(--superficie) 60%)}
h2{font:400 24px/1.2 var(--serif);margin:0 0 14px;display:flex;gap:10px;align-items:baseline}h3{font-size:13px;font-weight:600;margin:16px 0 8px}
.conta,.sutil{color:var(--sutil);font-weight:400;font-size:13px;font-family:var(--sans)}
.porque{font-size:17px;margin:0;max-width:70ch}.atencao{margin:0;padding-left:20px}.atencao li{margin:4px 0}
.lista{margin:0;padding-left:20px}.lista li{margin:3px 0}
.tempo{list-style:none;margin:0;padding:0;display:grid;grid-auto-flow:column;grid-auto-columns:minmax(92px,1fr);overflow-x:auto;padding-bottom:4px}
.tempo li{position:relative;padding:24px 10px 0 0;min-width:0}
.tempo li::before{content:"";position:absolute;top:8px;left:0;right:0;height:2px;background:var(--linha)}
.tempo li::after{content:"";position:absolute;top:2px;left:0;width:14px;height:14px;border-radius:50%;background:var(--superficie);border:2px solid var(--linha)}
.tempo li.feito::before,.tempo li.feito::after{background:var(--ok);border-color:var(--ok)}
.tempo li.agora::after{border-color:var(--destaque);box-shadow:0 0 0 4px var(--destaque-f)}
.tempo b{display:block;font-size:13.5px}.tempo span{display:block;color:var(--sutil);font-size:12px}
.abas{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}
.abas button,.modo button{font:inherit;font-size:12.5px;color:var(--sutil);background:transparent;border:1px solid var(--linha);border-radius:8px;padding:4px 10px;cursor:pointer}
.abas button[aria-selected="true"],.modo button[aria-pressed="true"]{background:var(--recuo);color:var(--texto)}
.par{margin:0}.par figcaption{display:flex;flex-wrap:wrap;gap:8px;justify-content:space-between;align-items:center;font-weight:500;margin-bottom:10px}.modo{display:flex;gap:4px}
.lados{display:grid;grid-template-columns:1fr 1fr;gap:12px}.lados>div{background:var(--recuo);border-radius:12px;padding:12px;min-width:0}
.rotulo{display:block;font:500 11px var(--sans);letter-spacing:.08em;text-transform:uppercase;color:var(--sutil);margin-bottom:8px}.rotulo.novo{color:var(--destaque)}
.desliza{position:relative}.desliza-pilha{position:relative;border-radius:12px;overflow:hidden;background:var(--recuo)}
.desliza-depois{position:absolute;inset:0;clip-path:inset(0 0 0 var(--x,50%))}.desliza-depois img{width:100%}
.desliza input{width:100%;margin-top:10px;accent-color:var(--destaque)}
img{max-width:100%;height:auto;border-radius:8px;display:block}
.ascii,.codigo{margin:0;overflow-x:auto;font-size:12.5px;line-height:1.5;white-space:pre}
.codigo{background:var(--recuo);border-radius:12px;padding:14px 16px}.codigo .mais{color:var(--ok)}.codigo .menos{color:var(--erro)}
.esboco+.esboco{margin-top:18px}.esboco p{margin:0 0 8px}
.rolagem{overflow-x:auto}table{width:100%;border-collapse:collapse;font-size:14px}
th{text-align:left;font-weight:500;color:var(--sutil);font-size:12px;padding:6px 8px;border-bottom:1px solid var(--linha)}
td{padding:9px 8px;border-bottom:1px solid var(--linha);vertical-align:middle}tr:last-child td{border-bottom:0}td small{display:block;color:var(--sutil);font-size:12px}
.num{font-variant-numeric:tabular-nums}.arq td.num{text-align:right;white-space:nowrap;width:1%}.arq .mais{color:var(--ok)}.arq .menos{color:var(--erro)}
.barra{height:6px;border-radius:4px;background:var(--recuo);overflow:hidden;min-width:90px}.barra span{display:block;height:100%;background:var(--destaque);border-radius:4px}
.selo{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:500;padding:2px 9px;border-radius:999px;white-space:nowrap}
.selo::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}
.selo.ok{color:var(--ok);background:var(--ok-f)}.selo.erro{color:var(--erro);background:var(--erro-f)}.selo.aviso{color:var(--aviso);background:var(--aviso-f)}.selo.neutro{color:var(--neutro);background:var(--neutro-f)}
.deploys{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}
.cartao{background:var(--recuo);border-radius:12px;padding:14px;min-width:0}.cartao-topo{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:10px}
dl{display:grid;grid-template-columns:auto 1fr;gap:4px 14px;margin:0;font-size:13.5px}dt{color:var(--sutil)}dd{margin:0;min-width:0;overflow-wrap:anywhere}
.spark{display:block;width:100%;height:36px;margin-top:10px;color:var(--ok)}
.duas{display:grid;grid-template-columns:1.4fr 1fr;gap:20px}.volta{background:var(--recuo);border-radius:12px;padding:12px 16px}.volta h3{margin-top:0}.volta p{margin:0}
.riscos{list-style:none;margin:0;padding:0}.riscos li{display:grid;grid-template-columns:74px 1fr;gap:12px;align-items:flex-start;padding:6px 0}.riscos p{margin:0}
details{margin-top:12px}summary{cursor:pointer;color:var(--sutil);font-size:13px}
.vazio{color:var(--sutil);font-size:13px;margin:0}
footer{color:var(--sutil);font-size:12px;margin-top:26px;display:flex;flex-wrap:wrap;gap:6px 16px}
@media (max-width:860px){.casca{grid-template-columns:1fr}.indice{position:sticky;top:0;z-index:2;flex-direction:row;overflow-x:auto;gap:4px;padding:8px 0;margin:0 -16px 8px;padding-inline:16px;background:var(--fundo);border-bottom:1px solid var(--linha)}
.indice span{display:none}.indice a{border-left:0;border-radius:8px;white-space:nowrap}.indice a.ativo{background:var(--recuo)}.lados,.duas{grid-template-columns:1fr}.bloco{padding:18px 16px}}
@container (max-width:700px){.lados,.duas{grid-template-columns:1fr}}
@media (prefers-reduced-motion:no-preference){.bloco,.kpi{animation:sobe .4s ease both}@keyframes sobe{from{opacity:0;transform:translateY(6px)}}}
@media print{.indice,.btn,.abas,.modo,.desliza{display:none!important}.casca{display:block}.par[hidden]{display:block!important}body{background:#fff}}`;

const JS = `<script>(function(){var r=document.documentElement,k="cx-tema";try{var t=localStorage.getItem(k);if(t)r.dataset.theme=t}catch(e){}
document.addEventListener("click",function(ev){var b=ev.target.closest("button");if(!b)return;
if(b.classList.contains("tema")){var esc=r.dataset.theme?r.dataset.theme==="dark":matchMedia("(prefers-color-scheme: dark)").matches;r.dataset.theme=esc?"light":"dark";try{localStorage.setItem(k,r.dataset.theme)}catch(e){}}
if(b.classList.contains("pdf"))print();
if(b.dataset.par!=null&&b.getAttribute("role")==="tab"){b.parentNode.querySelectorAll("button").forEach(function(x){x.setAttribute("aria-selected",x===b)});document.querySelectorAll("figure.par").forEach(function(f){f.hidden=f.dataset.par!==b.dataset.par})}
if(b.dataset.modo){var f=b.closest("figure");f.querySelectorAll("[data-modo]").forEach(function(x){x.setAttribute("aria-pressed",x===b)});f.querySelector(".lados").hidden=b.dataset.modo!=="lados";f.querySelector(".desliza").hidden=b.dataset.modo!=="desliza"}});
document.addEventListener("input",function(ev){if(ev.target.matches(".desliza input"))ev.target.closest(".desliza").style.setProperty("--x",ev.target.value+"%")});
var links=[].slice.call(document.querySelectorAll(".indice a"));if("IntersectionObserver"in window&&links.length){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)links.forEach(function(a){a.classList.toggle("ativo",a.getAttribute("href")==="#"+e.target.id)})})},{rootMargin:"-20% 0px -70% 0px"});document.querySelectorAll("section.bloco").forEach(function(s){io.observe(s)})}})()</script>`;

const pagina = (tituloPagina, metas, corpo) => `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(tituloPagina)}</title>
${metas}
${FONTES}
<style>${CSS}</style>
</head>
<body>
${corpo}
${JS}
</body>
</html>
`;

const metas = [["cx-pr", pr.numero], ["cx-titulo", titulo], ["cx-estado", d.estado || ""], ["cx-data", d.data || ""]].map(([n, v]) => `<meta name="${n}" content="${esc(v)}">`).join("\n");
const selosTopo = [d.estado && selo(d.estado, d.estadoTexto), ...(d.selos || []).map((s) => selo(s.tom || "neutro", s.texto))].filter(Boolean).join("");
const corpo = `<div class="casca">
<nav class="indice" aria-label="Seções"><span>Neste relatório</span>${secoes.map((s) => `<a href="#${s.id}">${s.nome.replace(/<[^>]+>.*$/, "").trim()}</a>`).join("")}</nav>
<main class="principal">
  <div class="topo">${pr.url ? `<a href="${href(pr.url)}">PR #${esc(pr.numero)}</a>` : `<span>PR #${esc(pr.numero)}</span>`}${pr.branch ? `<code>${esc(pr.branch)} → ${esc(pr.base || "main")}</code>` : ""}${pr.autor ? `<span>${esc(pr.autor)}</span>` : ""}${d.data ? `<span>${esc(d.data)}</span>` : ""}<span class="esp"></span><button class="btn tema" type="button">Tema</button><button class="btn pdf" type="button">Exportar PDF</button></div>
  <h1>${esc(titulo)}</h1>
  ${d.resumo ? `<p class="resumo">${esc(d.resumo)}</p>` : ""}
  ${selosTopo ? `<div class="selos">${selosTopo}</div>` : ""}
  ${d.links?.length ? `<div class="links">${d.links.map((l) => `<a href="${href(l.url)}">${esc(l.texto)}</a>`).join("")}</div>` : ""}
  ${kpis.length ? `<div class="kpis">${kpis.map((k) => `<div class="kpi ${esc(k.tom || "")}"><span>${esc(k.rotulo)}</span><strong>${esc(k.valor)}</strong>${k.nota ? `<small>${esc(k.nota)}</small>` : ""}</div>`).join("")}</div>` : ""}
  ${secoes.map((s) => s.html).join("\n")}
  <footer>${d.dora ? `<span>DORA (${esc(d.dora.periodo || "período")}): ${esc(d.dora.frequenciaDeploy ?? "—")} deploys · ${esc(d.dora.leadTime ?? "—")} até produção · ${esc(d.dora.taxaFalha ?? "—")} de falha · ${esc(d.dora.recuperacao ?? "—")} para recuperar</span>` : ""}<span>Gerado por cx-deploy-pipeline · relatorio-pr.mjs</span></footer>
</main>
</div>`;

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
  const linhas = itens.map((x) => `<tr><td class="num">#${x.pr}</td><td><a href="${esc(basename(x.f))}">${x.titulo}</a></td><td>${x.estado ? selo(x.estado) : ""}</td><td class="sutil">${x.data}</td></tr>`).join("");
  const idx = `<div class="casca" style="grid-template-columns:1fr"><main class="principal"><div class="topo"><span>${itens.length} relatório(s)</span><span class="esp"></span><button class="btn tema" type="button">Tema</button></div>
<h1>Relatórios de PR</h1><section class="bloco"><div class="rolagem"><table><thead><tr><th>PR</th><th>Título</th><th>Estado</th><th>Data</th></tr></thead><tbody>${linhas}</tbody></table></div></section></main></div>`;
  writeFileSync(join(pasta, "index.html"), pagina("Relatórios de PR", "", idx));
  console.log(`Índice: ${join(pasta, "index.html")} (${itens.length})`);
}
