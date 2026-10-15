#!/usr/bin/env node
// Mascara segredos num texto antes que ele saia do terminal (chat, PR, relatório, issue).
// Sem dependências: Node 18+ ou Bun.
//
// Uso:
//   <comando> 2>&1 | node redigir.mjs [--verificar] [--extra <regex>]
//   node redigir.mjs <arquivo> [--verificar]
//
// --verificar: não imprime o texto; só diz quantos trechos seriam mascarados (saída 1 se houver).
// --extra: regex adicional (ex.: o prefixo de token da sua plataforma).
// Saída: o texto redigido em stdout; contagem em stderr.

import { readFileSync } from "node:fs";
import { argumentos } from "./_adaptador.mjs";

const opts = argumentos(process.argv.slice(2), ["extra"]);
if (opts.ajuda || opts.help) {
  console.log("Uso: <comando> 2>&1 | node redigir.mjs [--verificar] [--extra <regex>]   ou   node redigir.mjs <arquivo>");
  process.exit(0);
}

const REGRAS = [
  ["chave privada", /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g],
  ["token do GitHub", /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g],
  ["token do CircleCI", /\bCCIP(?:AT|RJ)_[A-Za-z0-9_]{10,}\b/g],
  ["chave de API (sk-, rk-, pk_live)", /\b(?:sk|rk)-[A-Za-z0-9_-]{16,}\b|\b(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]{16,}\b/g],
  ["token Slack", /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/g],
  ["chave AWS", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
  ["token de job (tr_)", /\btr_(?:dev|stg|prod|pat)_[A-Za-z0-9]{10,}\b/g],
  ["JWT", /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g],
  ["Bearer", /(\bBearer\s+)[A-Za-z0-9._~+/=-]{12,}/gi],
  ["senha em URL", /(\b[a-z][a-z0-9+.-]*:\/\/[^\s:/@]+:)[^\s@/]+(@)/gi],
  ["variável sensível", /(\b[A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|PASSWD|API_KEY|PRIVATE_KEY|ACCESS_KEY)[A-Z0-9_]*\s*[=:]\s*)(["']?)[^\s"']{6,}\2/g],
  ["cabeçalho de chave", /(\b(?:x-api-key|circle-token|authorization)\s*:\s*)[^\s]{8,}/gi],
];
if (opts.extra) REGRAS.push(["extra", new RegExp(opts.extra, "g")]);

const entrada = opts._[0] ? readFileSync(opts._[0], "utf8") : readFileSync(0, "utf8");
let total = 0;
const porRegra = {};
let saida = entrada;
for (const [nome, re] of REGRAS) {
  saida = saida.replace(re, (...m) => {
    total++;
    porRegra[nome] = (porRegra[nome] || 0) + 1;
    // Mantém o prefixo capturado (ex.: "Bearer ", "API_KEY=") e troca só o valor.
    const grupos = m.slice(1, -2).filter((g) => typeof g === "string");
    if (nome === "senha em URL") return `${grupos[0]}[REDIGIDO]${grupos[1]}`;
    if (grupos.length && nome !== "chave privada" && /^(Bearer|variável|cabeçalho)/.test(nome)) return `${grupos[0]}[REDIGIDO]`;
    return "[REDIGIDO]";
  });
}

const resumo = total ? `redigir: ${total} trecho(s) mascarado(s): ${Object.entries(porRegra).map(([k, v]) => `${k} ${v}`).join(", ")}` : "redigir: nada a mascarar.";
if (opts.verificar) { console.error(resumo); process.exit(total ? 1 : 0); }
process.stdout.write(saida);
console.error(resumo);
