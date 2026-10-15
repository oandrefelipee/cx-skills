#!/usr/bin/env node
// Valida o adaptador do projeto contra o contrato (references/contrato-adaptador.md).
// Sem dependências: Node 18+ ou Bun. `--gh` usa a GitHub CLI só para leitura.
//
// Uso:
//   node checar-config.mjs [caminho/adaptador.json] [--gh] [--descobrir] [--json]
//
// Sem caminho, descobre o adaptador na ordem: .cx/pipeline/ → AGENTS.md/CLAUDE.md → docs/deploy/pipeline/.
// Confere: campos obrigatórios, valores aceitos, scripts citados que não existem no package.json,
// valores que parecem segredo e, com --gh, checks exigidos que o GitHub nunca viu na branch padrão.
// Saída: 0 ok (avisos permitidos) · 1 erro · 2 adaptador não encontrado ou ilegível.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { argumentos, lerAdaptador, CAMINHOS_PADRAO } from "./_adaptador.mjs";

const opts = argumentos(process.argv.slice(2));
if (opts.ajuda || opts.help) {
  console.log("Uso: node checar-config.mjs [adaptador.json] [--gh] [--descobrir] [--json]\nSaída: 0 ok · 1 erro · 2 não encontrado.");
  process.exit(0);
}

let a;
try { a = lerAdaptador(opts._[0]); } catch (e) { console.error(e.message); process.exit(2); }
if (!a) {
  console.error(`Adaptador não encontrado. Ordem de busca: ${CAMINHOS_PADRAO[0]}, referência no AGENTS.md ou CLAUDE.md, ${CAMINHOS_PADRAO[1]}.\nModelo: references/adaptador-modelo.md`);
  process.exit(2);
}
if (opts.descobrir) { console.log(`Adaptador: ${a.caminho} (encontrado por ${a.origem})`); process.exit(0); }

const d = a.dados;
const erros = [];
const avisos = [];
const get = (p) => p.split(".").reduce((o, k) => (o == null ? undefined : o[k]), d);
const exigir = (p, tipo) => {
  const v = get(p);
  if (v === undefined || v === null || v === "") erros.push(`falta ${p}`);
  else if (tipo === "array" && !Array.isArray(v)) erros.push(`${p} deve ser lista`);
  else if (tipo && tipo !== "array" && typeof v !== tipo) erros.push(`${p} deve ser ${tipo}`);
  return v;
};

exigir("ci.provider", "string");
const req = exigir("ci.requiredChecks", "array");
if (Array.isArray(req) && !req.length) erros.push("ci.requiredChecks vazio: sem checks exigidos não há portão de merge");
exigir("ci.status", "string");
exigir("ci.logs", "string");
const est = exigir("merge.estrategia", "string");
if (est && !["trem", "merge-queue", "direto"].includes(est)) erros.push(`merge.estrategia "${est}" inválida (trem, merge-queue ou direto)`);
if (est === "trem" && !get("merge.comandoTrem")) avisos.push("merge.estrategia = trem sem merge.comandoTrem: diga como o lote é montado");
exigir("deploy.provider", "string");
const envs = exigir("deploy.environments", "array") || [];
for (const [i, e] of (Array.isArray(envs) ? envs : []).entries()) {
  const n = e?.name || `#${i}`;
  if (!e?.name) erros.push(`deploy.environments[${i}].name ausente`);
  if (!e?.trigger) erros.push(`ambiente ${n}: falta trigger`);
  if (typeof e?.needsPode !== "boolean") erros.push(`ambiente ${n}: needsPode deve ser true ou false`);
  if (/prod/i.test(n) && e?.needsPode === false) erros.push(`ambiente ${n}: produção sem "pode" humano não é aceito`);
  if (!Array.isArray(e?.healthUrls) || !e.healthUrls.length) erros.push(`ambiente ${n}: sem healthUrls não há verificação pós-deploy`);
  if (!e?.smoke) avisos.push(`ambiente ${n}: sem smoke (só health)`);
}
exigir("deploy.status", "string");
exigir("deploy.logs", "string");
exigir("deploy.rollback", "string");
const mig = exigir("deploy.migrations", "string");
if (mig && !["expand-contract", "forward-only", "down-permitido"].includes(mig)) erros.push(`deploy.migrations "${mig}" inválida`);
if (mig && mig !== "expand-contract") avisos.push(`deploy.migrations = ${mig}: o padrão da skill é expand-contract`);
const piso = exigir("recursos.pisoDiscoGb", "number");
if (typeof piso === "number" && piso < 2) avisos.push("recursos.pisoDiscoGb abaixo de 2 GB: build e install costumam precisar de mais");
exigir("recursos.proibidoNoLaptop", "array");
exigir("segredos.onde", "string");
if (!get("relatorios.dir")) avisos.push("relatorios.dir ausente: o relatório do PR vai para docs/relatorios/pr");

// Segredos: nenhum valor do adaptador pode parecer credencial.
const PARECE_SEGREDO = /gh[pousr]_[A-Za-z0-9]{20,}|github_pat_|CCIP(?:AT|RJ)_|\b(?:sk|rk)-[A-Za-z0-9_-]{16,}|AKIA[A-Z0-9]{16}|eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.|xox[abprs]-|tr_(?:dev|stg|prod|pat)_|-----BEGIN/;
(function varrer(o, p = "") {
  if (typeof o === "string" && PARECE_SEGREDO.test(o)) erros.push(`${p} parece conter um segredo: tire do arquivo e troque a credencial`);
  else if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) varrer(v, p ? `${p}.${k}` : k);
})(d);

// Scripts citados ("bun run x", "npm run x", "pnpm x", "yarn x") precisam existir no package.json da raiz.
let raiz = dirname(a.caminho);
while (!existsSync(join(raiz, ".git")) && dirname(raiz) !== raiz) raiz = dirname(raiz);
const pkgPath = join(raiz, "package.json");
if (existsSync(pkgPath)) {
  const scripts = JSON.parse(readFileSync(pkgPath, "utf8")).scripts || {};
  const textos = JSON.stringify({ ...d, recursos: undefined }).match(/(?:bun run|npm run|pnpm(?: run)?|yarn(?: run)?) ([a-z0-9:_-]+)/gi) || [];
  for (const t of new Set(textos)) {
    const nome = t.split(" ").pop();
    if (!["install", "add", "dlx", "exec", "test", "x"].includes(nome) && !(nome in scripts)) erros.push(`script "${nome}" citado no adaptador não existe no package.json`);
  }
} else avisos.push("sem package.json na raiz: não conferi os scripts citados");

// --gh: os checks exigidos já apareceram no GitHub?
if (opts.gh && Array.isArray(req) && req.length) {
  const gh = (args) => spawnSync("gh", args, { encoding: "utf8", cwd: raiz, env: { ...process.env, GH_PAGER: "cat" } });
  const repo = gh(["repo", "view", "--json", "nameWithOwner,defaultBranchRef", "--jq", ".nameWithOwner + \" \" + .defaultBranchRef.name"]);
  if (repo.status === 0) {
    const [nwo, branch] = repo.stdout.trim().split(" ");
    const runs = gh(["api", `repos/${nwo}/commits/${branch}/check-runs`, "--jq", ".check_runs[].name"]).stdout || "";
    const sts = gh(["api", `repos/${nwo}/commits/${branch}/status`, "--jq", ".statuses[].context"]).stdout || "";
    const vistos = new Set((runs + "\n" + sts).split("\n").filter(Boolean));
    for (const c of req) if (!vistos.has(c)) avisos.push(`check exigido "${c}" não aparece no último commit de ${branch} (pode rodar só em PR; confira o nome exato)`);
  } else avisos.push("--gh: não consegui ler o repositório com o gh");
}

if (opts.json) { console.log(JSON.stringify({ adaptador: a.caminho, origem: a.origem, erros, avisos }, null, 2)); process.exit(erros.length ? 1 : 0); }
console.log(`Adaptador: ${a.caminho} (${a.origem})`);
for (const e of erros) console.log(`ERRO   ${e}`);
for (const w of avisos) console.log(`aviso  ${w}`);
console.log(erros.length ? `${erros.length} erro(s), ${avisos.length} aviso(s).` : `OK, ${avisos.length} aviso(s).`);
process.exit(erros.length ? 1 : 0);
