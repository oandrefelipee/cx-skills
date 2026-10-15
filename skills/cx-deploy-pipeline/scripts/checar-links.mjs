#!/usr/bin/env node
// Confere os links relativos de todos os .md da skill: cada alvo precisa existir.
// Sem dependências: Node 18+ ou Bun. Ignora links http(s), mailto e âncoras puras,
// e o conteúdo dentro de blocos de código.
//
// Uso:
//   node scripts/checar-links.mjs [pasta]   (padrão: a raiz da skill)

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = process.argv[2] || join(dirname(fileURLToPath(import.meta.url)), "..");
if (raiz === "--ajuda" || raiz === "-h") {
  console.log("Uso: node scripts/checar-links.mjs [pasta]");
  process.exit(0);
}

function arquivos(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (n === "node_modules" || n.startsWith(".")) return [];
    return statSync(p).isDirectory() ? arquivos(p) : n.endsWith(".md") ? [p] : [];
  });
}

let quebrados = 0;
let total = 0;
for (const arq of arquivos(raiz)) {
  const texto = readFileSync(arq, "utf8").replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, (m) => (m.includes("](") ? m : ""));
  for (const [, alvo] of texto.matchAll(/\]\(([^)\s]+)\)/g)) {
    if (/^(https?:|mailto:|#)/.test(alvo)) continue;
    total++;
    const caminho = join(dirname(arq), decodeURIComponent(alvo.split("#")[0]));
    if (!existsSync(caminho)) {
      quebrados++;
      console.log(`${relative(raiz, arq)}: link quebrado → ${alvo}`);
    }
  }
}
console.log(`${total} links relativos, ${quebrados} quebrados.`);
process.exit(quebrados ? 1 : 0);
