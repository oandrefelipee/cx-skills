#!/usr/bin/env node
// Confere o espaço livre antes de build, teste ou instalação. Abaixo do piso, o agente para.
// Sem dependências: Node 18.15+ (fs.statfs) ou Bun; cai para `df -Pk` se statfs não existir.
//
// Uso:
//   node preflight-disco.mjs [--piso <GB>] [--caminho <pasta>] [--adaptador caminho] [--json]
//
// Piso: --piso, senão `recursos.pisoDiscoGb` do adaptador, senão 5 GB.
// Saída: 0 acima do piso; 1 abaixo (com o protocolo de parada); 2 erro.

import { statfsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { argumentos, lerAdaptador } from "./_adaptador.mjs";

const opts = argumentos(process.argv.slice(2), ["piso", "caminho", "adaptador"]);
if (opts.ajuda || opts.help) {
  console.log("Uso: node preflight-disco.mjs [--piso <GB>] [--caminho <pasta>] [--adaptador caminho] [--json]\nSaída: 0 ok · 1 abaixo do piso · 2 erro.");
  process.exit(0);
}

const caminho = resolve(opts.caminho || process.cwd());
let adaptador = null;
try { adaptador = lerAdaptador(opts.adaptador, caminho); } catch { /* sem adaptador válido: usa o padrão */ }
const piso = Number(opts.piso ?? adaptador?.dados?.recursos?.pisoDiscoGb ?? 5);

function livreEmBytes(p) {
  try {
    const s = statfsSync(p);
    return { livre: s.bavail * s.bsize, total: s.blocks * s.bsize };
  } catch {
    const r = spawnSync("df", ["-Pk", p], { encoding: "utf8" });
    const cols = r.stdout?.trim().split("\n").pop()?.split(/\s+/);
    if (!cols || cols.length < 4) return null;
    return { livre: Number(cols[3]) * 1024, total: Number(cols[1]) * 1024 };
  }
}

const d = livreEmBytes(caminho);
if (!d) { console.error(`Não consegui ler o disco de ${caminho}.`); process.exit(2); }
const gb = (b) => b / 1024 ** 3;
const livre = gb(d.livre);
const ok = livre >= piso;

if (opts.json) {
  console.log(JSON.stringify({ caminho, livreGb: +livre.toFixed(2), totalGb: +gb(d.total).toFixed(1), pisoGb: piso, ok }, null, 2));
  process.exit(ok ? 0 : 1);
}

console.log(`Disco em ${caminho}: ${livre.toFixed(1)} GB livres de ${gb(d.total).toFixed(0)} GB · piso ${piso} GB → ${ok ? "OK" : "ABAIXO DO PISO"}`);
if (ok) {
  if (livre < piso * 1.5) console.log("Atenção: perto do piso. Evite instalar dependências ou rodar suítes pesadas agora.");
  process.exit(0);
}
console.log(`
Protocolo de parada (workflows/09-disco-e-recursos.md):
  1. Pare o que é pesado: build, E2E, instalação, download, contêiner.
  2. Salve o trabalho: git add -A && git commit -m "wip: <o que falta>" && git push.
  3. Limpe só o que é seguro e seu: saídas de teste, caches de build da worktree, worktrees órfãs.
     Nunca apague pasta de outro agente, volume de banco nem nada fora do projeto sem o "pode" humano.
  4. Avise o humano com o número acima e o que ficou pendente.`);
process.exit(1);
