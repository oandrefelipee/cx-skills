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
import { pathToFileURL } from "node:url";
import { argumentos } from "./_adaptador.mjs";

// [nome, regex, quantos grupos de prefixo/sufixo manter]. Grupos 1 (e 2, se houver) são preservados;
// o valor entre eles vira [REDIGIDO]. A ordem importa: regras de contexto vêm antes das soltas.
export const REGRAS = [
  ["chave privada", /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g],
  ["cabeçalho de credencial", /(\b(?:x-api-key|circle-token|authorization|proxy-authorization)\s*:\s*(?:(?:Basic|Bearer|token|Token|Digest)\s+)?)[^\s]{6,}/gi],
  ["esquema Basic/Bearer", /(\b(?:Basic|Bearer)\s+)[A-Za-z0-9._~+/=-]{8,}/g],
  // Senha em URL: vai até o último @ antes do espaço (a senha pode conter / e @).
  ["senha em URL", /(\b[a-z][a-z0-9+.-]*:\/\/[^\s:@/]*:)[^\s]+(@)(?=[^\s@]*(?:\s|$))/gi],
  ["token do GitHub", /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g],
  ["token do CircleCI", /\bCCIP(?:AT|RJ)_[A-Za-z0-9_]{10,}\b/g],
  ["chave de API (sk-, rk-, pk_live)", /\b(?:sk|rk)-[A-Za-z0-9_-]{16,}\b|\b(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]{16,}\b/g],
  ["token Slack", /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/g],
  ["chave AWS", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
  ["token de job (tr_)", /\btr_(?:dev|stg|prod|pat)_[A-Za-z0-9]{10,}\b/g],
  ["JWT", /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g],
  ["variável sensível", /(\b[A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|PASSWD|API_KEY|PRIVATE_KEY|ACCESS_KEY)[A-Z0-9_]*\s*[=:]\s*["']?)[^\s"']{6,}/g],
];

/** Devolve { saida, total, porRegra }. */
export function redigir(texto, extra) {
  const regras = extra ? [...REGRAS, ["extra", new RegExp(extra, "g")]] : REGRAS;
  let total = 0;
  const porRegra = {};
  let saida = texto;
  for (const [nome, re] of regras) {
    const nGrupos = new RegExp(`${re.source}|`).exec("").length - 1;
    saida = saida.replace(re, (...m) => {
      const grupos = m.slice(1, 1 + nGrupos).map((g) => g ?? "");
      const valor = m[0].slice(grupos[0]?.length ?? 0, m[0].length - (grupos[1]?.length ?? 0));
      if (valor === "[REDIGIDO]") return m[0];
      total++;
      porRegra[nome] = (porRegra[nome] || 0) + 1;
      return nGrupos ? `${grupos[0]}[REDIGIDO]${grupos[1] ?? ""}` : "[REDIGIDO]";
    });
  }
  return { saida, total, porRegra };
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  const opts = argumentos(process.argv.slice(2), ["extra"]);
  if (opts.ajuda || opts.help) {
    console.log("Uso: <comando> 2>&1 | node redigir.mjs [--verificar] [--extra <regex>]   ou   node redigir.mjs <arquivo>");
    process.exit(0);
  }
  const entrada = opts._[0] ? readFileSync(opts._[0], "utf8") : readFileSync(0, "utf8");
  const { saida, total, porRegra } = redigir(entrada, opts.extra);
  const resumo = total ? `redigir: ${total} trecho(s) mascarado(s): ${Object.entries(porRegra).map(([k, v]) => `${k} ${v}`).join(", ")}` : "redigir: nada a mascarar.";
  if (opts.verificar) { console.error(resumo); process.exit(total ? 1 : 0); }
  process.stdout.write(saida);
  console.error(resumo);
}
