#!/usr/bin/env node
// Lê os checks de um PR no GitHub (fonte da verdade) e resume o estado, qualquer que seja o provedor de CI.
// Sem dependências: Node 18+ ou Bun. Precisa do `gh` autenticado (só leitura).
//
// Uso:
//   node ci-status.mjs [<pr>|<url>|<branch>] [--repo dono/repo] [--required] [--json] [--adaptador caminho]
//
// Sem PR, usa o PR da branch atual. Com adaptador (descoberto ou passado), confere também se cada
// check exigido (`ci.requiredChecks`) apareceu no PR.
//
// Saída: tabela check × estado × provedor × link e uma linha de veredito.
// Códigos de saída (iguais aos do `gh pr checks`): 0 tudo verde, 1 falha ou check exigido ausente,
// 8 pendente, 2 erro de uso ou do `gh`.

import { spawnSync } from "node:child_process";
import { argumentos, lerAdaptador } from "./_adaptador.mjs";

const AJUDA = `Uso: node ci-status.mjs [<pr>|<url>|<branch>] [--repo dono/repo] [--required] [--json] [--adaptador caminho]
Saída: 0 verde · 1 falha ou exigido ausente · 8 pendente · 2 erro.`;

const opts = argumentos(process.argv.slice(2), ["repo", "adaptador"]);
if (opts.ajuda || opts.help) { console.log(AJUDA); process.exit(0); }

function gh(args) {
  const r = spawnSync("gh", args, { encoding: "utf8", env: { ...process.env, GH_PAGER: "cat", NO_COLOR: "1" } });
  if (r.error) { console.error("`gh` não encontrado. Instale a GitHub CLI e rode `gh auth login`."); process.exit(2); }
  return r;
}

const alvo = opts._[0];
const repo = opts.repo ? ["--repo", opts.repo] : [];

const pr = gh(["pr", "view", ...(alvo ? [alvo] : []), ...repo, "--json", "number,title,url,headRefOid,headRefName,mergeStateStatus,reviewDecision,isDraft"]);
if (pr.status !== 0) { console.error(pr.stderr.trim() || "PR não encontrado."); process.exit(2); }
const info = JSON.parse(pr.stdout);

const campos = "name,state,bucket,link,workflow,description,completedAt";
// `gh pr checks` sai com 1 (falha) ou 8 (pendente) mas ainda imprime o JSON: lemos o stdout sempre.
const ch = gh(["pr", "checks", String(info.number), ...repo, "--json", campos, ...(opts.required ? ["--required"] : [])]);
let checks = [];
if (ch.stdout.trim()) checks = JSON.parse(ch.stdout);
else if (!/no checks reported/i.test(ch.stderr)) { console.error(ch.stderr.trim()); process.exit(2); }

function provedor(link = "") {
  if (/github\.com\/.+\/actions\//.test(link)) return "github-actions";
  const host = (() => { try { return new URL(link).host; } catch { return ""; } })();
  for (const [re, nome] of [[/circleci\.com/, "circleci"], [/buildkite\.com/, "buildkite"], [/vercel\.com/, "vercel"], [/railway\.(app|com)/, "railway"], [/netlify\.com/, "netlify"], [/gitlab/, "gitlab"]]) {
    if (re.test(host)) return nome;
  }
  if (host === "github.com") return "github (app)";
  return host || "-";
}

const linhas = checks.map((c) => ({ check: c.name, estado: c.bucket || c.state, provedor: provedor(c.link), link: c.link || "", descricao: c.description || "" }));

let exigidosAusentes = [];
let adaptador = null;
try { adaptador = lerAdaptador(opts.adaptador); } catch (e) { console.error(e.message); }
const exigidos = adaptador?.dados?.ci?.requiredChecks ?? [];
if (exigidos.length) {
  const nomes = new Set(checks.map((c) => c.name));
  exigidosAusentes = exigidos.filter((n) => !nomes.has(n) && !nomes.has(n.replace(/^[^:]+:\s*/, "")));
}

const conta = (b) => linhas.filter((l) => l.estado === b).length;
const falhas = conta("fail") + conta("cancel");
const pendentes = conta("pending");
let veredito, codigo;
if (falhas || exigidosAusentes.length) { veredito = "VERMELHO"; codigo = 1; }
else if (pendentes) { veredito = "PENDENTE"; codigo = 8; }
else if (!linhas.length) { veredito = "SEM CHECKS"; codigo = 8; }
else { veredito = "VERDE"; codigo = 0; }

if (opts.json) {
  console.log(JSON.stringify({ pr: info.number, url: info.url, sha: info.headRefOid, merge: info.mergeStateStatus, revisao: info.reviewDecision, rascunho: info.isDraft, veredito, checks: linhas, exigidosAusentes }, null, 2));
  process.exit(codigo);
}

const SIMBOLO = { pass: "ok  ", fail: "FALHA", cancel: "cancel", pending: "...", skipping: "pulado" };
const larg = Math.max(5, ...linhas.map((l) => l.check.length));
console.log(`PR #${info.number} ${info.title}`);
console.log(`SHA ${info.headRefOid.slice(0, 7)} · branch ${info.headRefName} · merge ${info.mergeStateStatus} · revisão ${info.reviewDecision || "nenhuma"}${info.isDraft ? " · rascunho" : ""}`);
console.log("");
console.log(`${"check".padEnd(larg)}  estado  provedor        link`);
for (const l of linhas.sort((a, b) => (a.estado === "fail" ? -1 : 0) - (b.estado === "fail" ? -1 : 0))) {
  console.log(`${l.check.padEnd(larg)}  ${(SIMBOLO[l.estado] || l.estado).padEnd(6)}  ${l.provedor.padEnd(14)}  ${l.link}`);
}
for (const n of exigidosAusentes) console.log(`${n.padEnd(larg)}  AUSENTE (exigido no adaptador, não reportado)`);
console.log("");
console.log(`${veredito}: ${conta("pass")} ok, ${falhas} falha, ${pendentes} pendente, ${conta("skipping")} pulado${exigidosAusentes.length ? `, ${exigidosAusentes.length} exigido ausente` : ""}.`);
if (codigo === 1) console.log("Próximo passo: logs do primeiro check vermelho (ci.logs do adaptador), sempre por `redigir.mjs`.");
if (codigo === 8) console.log("Próximo passo: esperar (gh pr checks --watch) ou voltar mais tarde; não mesclar.");
process.exit(codigo);
