#!/usr/bin/env node
// Verificação pós-deploy igual para qualquer provedor: status HTTP, latência e diferença contra a linha de base.
// Sem dependências: Node 18+ (fetch) ou Bun.
//
// Uso:
//   node checar-health.mjs <url> [<url>...] [opções]
//   node checar-health.mjs --ambiente <nome> [--adaptador caminho] [opções]   (usa deploy.environments[].healthUrls)
//
// Opções:
//   --tentativas N        checagens por URL (padrão 3)
//   --intervalo S         segundos entre checagens (padrão 5)
//   --timeout S           tempo máximo por requisição (padrão 10)
//   --esperar-sha <sha>   exige que a resposta contenha este SHA (útil quando /health devolve a versão)
//   --linha-de-base arq   JSON {url: ms}; alerta se a mediana passar de 2x a base
//   --salvar-linha-de-base arq   grava as medianas desta rodada como nova base
//   --json
//
// Regra: uma URL é saudável quando a maioria das tentativas volta 2xx (falha isolada não é alerta).
// Saída: 0 saudável · 1 degradado · 2 erro de uso.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { argumentos, lerAdaptador } from "./_adaptador.mjs";

const opts = argumentos(process.argv.slice(2), ["ambiente", "adaptador", "tentativas", "intervalo", "timeout", "esperar-sha", "linha-de-base", "salvar-linha-de-base"]);
if (opts.ajuda || opts.help || (!opts._.length && !opts.ambiente)) {
  console.log("Uso: node checar-health.mjs <url>... | --ambiente <nome> [--tentativas 3] [--intervalo 5] [--esperar-sha <sha>] [--linha-de-base arq] [--json]");
  process.exit(opts.ajuda || opts.help ? 0 : 2);
}

let urls = opts._;
if (opts.ambiente) {
  const a = lerAdaptador(opts.adaptador);
  const amb = a?.dados?.deploy?.environments?.find((e) => e.name === opts.ambiente);
  if (!amb?.healthUrls?.length) { console.error(`Ambiente "${opts.ambiente}" sem healthUrls no adaptador.`); process.exit(2); }
  urls = amb.healthUrls;
}

const tentativas = Number(opts.tentativas ?? 3);
const intervalo = Number(opts.intervalo ?? 5) * 1000;
const timeout = Number(opts.timeout ?? 10) * 1000;
const base = opts["linha-de-base"] && existsSync(opts["linha-de-base"]) ? JSON.parse(readFileSync(opts["linha-de-base"], "utf8")) : {};
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const mediana = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : null; };

async function checar(url) {
  const r = [];
  for (let i = 0; i < tentativas; i++) {
    const t0 = performance.now();
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(timeout), redirect: "follow", headers: { "cache-control": "no-cache" } });
      const corpo = await res.text();
      const ms = Math.round(performance.now() - t0);
      const shaOk = opts["esperar-sha"] ? corpo.includes(opts["esperar-sha"].slice(0, 7)) : true;
      r.push({ ok: res.ok && shaOk, status: res.status, ms, shaOk });
    } catch (e) {
      r.push({ ok: false, status: e.name === "TimeoutError" ? "timeout" : "erro", ms: null, shaOk: false });
    }
    if (i < tentativas - 1) await dormir(intervalo);
  }
  const oks = r.filter((x) => x.ok).length;
  const med = mediana(r.filter((x) => x.ms != null).map((x) => x.ms));
  const lenta = base[url] && med != null && med > 2 * base[url];
  return { url, saudavel: oks > tentativas / 2 && !lenta, oks, tentativas, status: [...new Set(r.map((x) => x.status))].join(","), medianaMs: med, baseMs: base[url] ?? null, lenta: !!lenta, shaConfere: opts["esperar-sha"] ? r.some((x) => x.shaOk) : null };
}

const resultados = await Promise.all(urls.map(checar));
if (opts["salvar-linha-de-base"]) {
  const nova = Object.fromEntries(resultados.filter((x) => x.medianaMs != null).map((x) => [x.url, x.medianaMs]));
  writeFileSync(opts["salvar-linha-de-base"], JSON.stringify(nova, null, 2) + "\n");
}
const tudoOk = resultados.every((x) => x.saudavel);
if (opts.json) { console.log(JSON.stringify({ saudavel: tudoOk, resultados }, null, 2)); process.exit(tudoOk ? 0 : 1); }
for (const x of resultados) {
  const extra = [x.lenta ? `LENTA (base ${x.baseMs} ms)` : "", x.shaConfere === false ? "SHA não confere" : ""].filter(Boolean).join(" · ");
  console.log(`${x.saudavel ? "ok   " : "FALHA"}  ${x.oks}/${x.tentativas}  status ${x.status}  mediana ${x.medianaMs ?? "-"} ms  ${x.url}${extra ? "  " + extra : ""}`);
}
console.log(tudoOk ? "SAUDÁVEL." : "DEGRADADO: siga workflows/07-rollback.md (peça o \"pode\" se o ambiente exigir).");
process.exit(tudoOk ? 0 : 1);
