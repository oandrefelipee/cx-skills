#!/usr/bin/env node
// Mascara segredos num texto antes que ele saia do terminal (chat, PR, relatório, issue).
// Sem dependências: Node 18+ ou Bun. Testes: node redigir.test.mjs
//
// Uso:
//   <comando> 2>&1 | node redigir.mjs [--verificar] [--extra <regex>]
//   node redigir.mjs <arquivo> [--verificar]
//
// --verificar: não imprime o texto; só diz quantos trechos seriam mascarados (saída 1 se houver).
// --extra: regex adicional (ex.: o prefixo de token da sua plataforma).
// Saída: o texto redigido em stdout; contagem em stderr.

import { readFileSync } from "node:fs";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { basename } from "node:path";
import { argumentos } from "./_adaptador.mjs";

// [nome, regex, opções]. Só regras embutidas podem ter { manterPrefixo } (preserva o grupo 1) e
// { manterSufixo } (preserva o grupo 2); o resto do trecho vira [REDIGIDO]. Regras do usuário (--extra)
// sempre trocam o trecho inteiro. A ordem importa: regras de contexto vêm antes das soltas.
const P = { manterPrefixo: true };
const PS = { manterPrefixo: true, manterSufixo: true };
export const REGRAS = [
  ["chave privada", /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g],
  ["cabeçalho de credencial", /(\b(?:x-api-key|circle-token|authorization|proxy-authorization)\s*:\s*(?:(?:Basic|Bearer|token|Token|Digest)\s+)?)[^\s]{6,}/gi, P],
  ["esquema Basic/Bearer", /(\b(?:Basic|Bearer)\s+)[A-Za-z0-9._~+/=-]{8,}/gi, P],
  // Senha em URL: vai até o último @ antes do espaço (a senha pode conter / e @).
  ["senha em URL", /(\b[a-z][a-z0-9+.-]*:\/\/[^\s:@/]*:)[^\s]+(@)(?=[^\s@]*(?:\s|$))/gi, PS],
  ["token do GitHub", /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g],
  ["token do CircleCI", /\bCCIP(?:AT|RJ)_[A-Za-z0-9_]{10,}\b/g],
  ["chave de API (sk-, rk-, pk_live)", /\b(?:sk|rk)-[A-Za-z0-9_-]{16,}\b|\b(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]{16,}\b/g],
  ["token Slack", /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/g],
  ["chave AWS", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
  ["token de job (tr_)", /\btr_(?:dev|stg|prod|pat)_[A-Za-z0-9]{10,}\b/g],
  ["JWT", /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g],
  ["variável sensível", /(\b[A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|PASSWD|API_KEY|PRIVATE_KEY|ACCESS_KEY)[A-Z0-9_]*\s*[=:]\s*["']?)[^\s"']{6,}/g, P],
];

/** Devolve { saida, total, porRegra }. */
export function redigir(texto, extra) {
  const regras = extra ? [...REGRAS, ["extra", new RegExp(extra, "g"), {}]] : REGRAS;
  let total = 0;
  const porRegra = {};
  let saida = texto;
  for (const [nome, re, op = {}] of regras) {
    saida = saida.replace(re, (...m) => {
      const prefixo = op.manterPrefixo && typeof m[1] === "string" ? m[1] : "";
      const sufixo = op.manterSufixo && typeof m[2] === "string" ? m[2] : "";
      if (m[0].slice(prefixo.length, m[0].length - sufixo.length) === "[REDIGIDO]") return m[0];
      total++;
      porRegra[nome] = (porRegra[nome] || 0) + 1;
      return `${prefixo}[REDIGIDO]${sufixo}`;
    });
  }
  return { saida, total, porRegra };
}

// Execução direta: compara caminhos reais (a skill costuma ser instalada por symlink).
function caminhoReal(p) { try { return realpathSync(p); } catch { return null; } }
const chamado = process.argv[1] ? caminhoReal(process.argv[1]) : null;
const este = caminhoReal(fileURLToPath(import.meta.url));
const ehPrincipal = chamado !== null && chamado === este;
// Falha fechada: chamado como "redigir…" mas sem confirmar que é este arquivo → sai com erro, sem eco.
if (!ehPrincipal && process.argv[1] && /^redigir(?:-cli)?(?:\.m?js)?$/.test(basename(process.argv[1]))) {
  console.error("redigir: não consegui confirmar a execução direta; nada foi impresso.");
  process.exit(2);
}

if (ehPrincipal) {
  const opts = argumentos(process.argv.slice(2), ["extra"]);
  if (opts.ajuda || opts.help) {
    console.log("Uso: <comando> 2>&1 | node redigir.mjs [--verificar] [--extra <regex>]   ou   node redigir.mjs <arquivo>");
    process.exit(0);
  }
  try {
    const entrada = opts._[0] ? readFileSync(opts._[0], "utf8") : readFileSync(0, "utf8");
    const { saida, total, porRegra } = redigir(entrada, opts.extra);
    const resumo = total ? `redigir: ${total} trecho(s) mascarado(s): ${Object.entries(porRegra).map(([k, v]) => `${k} ${v}`).join(", ")}` : "redigir: nada a mascarar.";
    if (opts.verificar) { console.error(resumo); process.exit(total ? 1 : 0); }
    process.stdout.write(saida);
    console.error(resumo);
  } catch (e) {
    // Nunca devolve o texto cru em caso de erro (regex --extra inválida, arquivo ilegível…).
    console.error(`redigir: erro (${e.message}); nada foi impresso.`);
    process.exit(2);
  }
}
