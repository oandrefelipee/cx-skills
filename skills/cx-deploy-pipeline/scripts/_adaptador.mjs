// Descoberta e leitura do adaptador do projeto. Sem dependências: Node 18+ ou Bun.
// Ordem (a mesma do SKILL.md):
//   1. .cx/pipeline/adaptador.json
//   2. referência no AGENTS.md ou CLAUDE.md (um caminho .json citado na seção do pipeline)
//   3. docs/deploy/pipeline/adaptador.json

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

export const CAMINHOS_PADRAO = [".cx/pipeline/adaptador.json", "docs/deploy/pipeline/adaptador.json"];

function raizDoRepo(inicio) {
  let d = resolve(inicio);
  for (;;) {
    if (existsSync(join(d, ".git"))) return d;
    const pai = dirname(d);
    if (pai === d) return resolve(inicio);
    d = pai;
  }
}

function citadoNosAgentes(raiz) {
  for (const nome of ["AGENTS.md", "CLAUDE.md"]) {
    const arq = join(raiz, nome);
    if (!existsSync(arq)) continue;
    const texto = readFileSync(arq, "utf8");
    // Procura um caminho .json numa linha que fale de pipeline ou adaptador.
    for (const linha of texto.split("\n")) {
      if (!/pipeline|adaptador|adapter/i.test(linha)) continue;
      const m = linha.match(/[`(]([^`()\s]+\.json)[`)]/);
      if (m) {
        const p = resolve(raiz, m[1]);
        if (existsSync(p)) return { caminho: p, origem: nome };
      }
    }
  }
  return null;
}

/** Devolve { caminho, origem } do primeiro adaptador encontrado, ou null. */
export function acharAdaptador(inicio = process.cwd()) {
  const raiz = raizDoRepo(inicio);
  const primeiro = join(raiz, CAMINHOS_PADRAO[0]);
  if (existsSync(primeiro)) return { caminho: primeiro, origem: ".cx/" };
  const citado = citadoNosAgentes(raiz);
  if (citado) return citado;
  const ultimo = join(raiz, CAMINHOS_PADRAO[1]);
  if (existsSync(ultimo)) return { caminho: ultimo, origem: "docs/deploy/pipeline/" };
  return null;
}

/** Lê o adaptador indicado (ou o descoberto). Devolve { dados, caminho, origem } ou null. */
export function lerAdaptador(caminho, inicio = process.cwd()) {
  const achado = caminho ? { caminho: resolve(caminho), origem: "argumento" } : acharAdaptador(inicio);
  if (!achado) return null;
  try {
    return { ...achado, dados: JSON.parse(readFileSync(achado.caminho, "utf8")) };
  } catch (e) {
    throw new Error(`adaptador inválido em ${achado.caminho}: ${e.message}`);
  }
}

/** Lê "--nome valor" e flags "--nome" de argv. */
export function argumentos(argv, comValor = []) {
  const opts = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) { opts._.push(a); continue; }
    const nome = a.slice(2);
    if (comValor.includes(nome)) opts[nome] = argv[++i];
    else opts[nome] = true;
  }
  return opts;
}
