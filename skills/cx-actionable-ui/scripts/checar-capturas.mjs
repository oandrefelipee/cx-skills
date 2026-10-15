#!/usr/bin/env node
// Lista as capturas velhas (anteriores ao último commit de UI) e as que faltam na matriz larguras × temas.
// Sem dependências: Node 18+ ou Bun, com git no PATH.
//
// Uso:
//   node checar-capturas.mjs <pasta> --ui <caminho> [--ui <caminho> ...] [--larguras 390,1280] [--temas claro,escuro] [--json] [--estrito]
//
//   <pasta>      Pasta das capturas (png, jpg, jpeg, webp).
//   --ui         Caminho(s) do código de UI; o último commit que tocou neles é a referência. Padrão: "src".
//   --larguras   Larguras esperadas. Padrão: 390,1280.
//   --temas      Temas esperados. Padrão: claro,escuro (aceita light/dark nos nomes).
//   --estrito    Sai com código 1 se houver captura velha ou faltando.
//
// Convenção de nome: <tela>-<largura>-<tema>.<ext>, por exemplo "lista-vazia-390-escuro.png".
// Data de uma captura: a do último commit dela; se estiver modificada ou fora do git, a do arquivo no disco.
// Comparar com a data de commit evita o falso "atual" de um clone recém-feito.

import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const EXTENSOES = /\.(png|jpe?g|webp)$/i;
const ALIASES = { light: "claro", dark: "escuro", claro: "claro", escuro: "escuro" };

function ajuda(codigo = 0) {
  const linhas = readFileSync(new URL(import.meta.url)).toString().split("\n");
  console.log(linhas.slice(1, linhas.findIndex((l) => l.startsWith("import"))).map((l) => l.replace(/^\/\/ ?/, "")).join("\n"));
  process.exit(codigo);
}

function git(cwd, ...args) {
  try {
    return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

export function lerNome(arquivo, temas) {
  const base = arquivo.replace(EXTENSOES, "");
  const partes = base.split("-");
  if (partes.length < 3) return null;
  const tema = ALIASES[partes.at(-1).toLowerCase()] ?? partes.at(-1).toLowerCase();
  const largura = partes.at(-2);
  if (!/^\d+$/.test(largura) || !temas.includes(tema)) return null;
  return { tela: partes.slice(0, -2).join("-"), largura, tema };
}

function main(argv) {
  const args = [...argv];
  if (args.length === 0 || args.includes("-h") || args.includes("--ajuda")) ajuda(args.length === 0 ? 1 : 0);
  const ui = [];
  let larguras = ["390", "1280"];
  let temas = ["claro", "escuro"];
  let json = false;
  let estrito = false;
  let pasta = null;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--ui") ui.push(args[++i]);
    else if (a === "--larguras") larguras = args[++i].split(",");
    else if (a === "--temas") temas = args[++i].split(",").map((t) => ALIASES[t] ?? t);
    else if (a === "--json") json = true;
    else if (a === "--estrito") estrito = true;
    else pasta = a;
  }
  pasta = resolve(pasta);
  const raiz = git(pasta, "rev-parse", "--show-toplevel");
  if (!raiz) {
    console.error("A pasta precisa estar dentro de um repositório git.");
    process.exit(2);
  }
  const caminhosUi = (ui.length ? ui : ["src"]).map((c) => relative(raiz, resolve(c)) || ".");
  const refUi = git(raiz, "log", "-1", "--format=%ct%x09%h%x09%s", "--", ...caminhosUi);
  const [tsUi, hashUi, assuntoUi] = refUi ? refUi.split("\t") : ["0", "", "(nenhum commit de UI)"];
  const marcoUi = Number(tsUi) * 1000;

  const modificados = new Set(
    git(raiz, "status", "--porcelain", "--untracked-files=all", "--", relative(raiz, pasta))
      .split("\n")
      .filter(Boolean)
      .map((l) => resolve(raiz, l.slice(3))),
  );

  const arquivos = readdirSync(pasta).filter((a) => EXTENSOES.test(a)).sort();
  const capturas = [];
  const foraDoPadrao = [];
  for (const arquivo of arquivos) {
    const caminho = join(pasta, arquivo);
    const nome = lerNome(arquivo, temas);
    if (!nome) {
      foraDoPadrao.push(arquivo);
      continue;
    }
    let data;
    let origem;
    const tsCommit = modificados.has(caminho) ? "" : git(raiz, "log", "-1", "--format=%ct", "--", relative(raiz, caminho));
    if (tsCommit) {
      data = Number(tsCommit) * 1000;
      origem = "commit";
    } else {
      data = statSync(caminho).mtimeMs;
      origem = "disco";
    }
    capturas.push({ arquivo, ...nome, data, origem, velha: data < marcoUi });
  }

  const telas = [...new Set(capturas.map((c) => c.tela))];
  const faltando = [];
  for (const tela of telas)
    for (const largura of larguras)
      for (const tema of temas)
        if (!capturas.some((c) => c.tela === tela && c.largura === largura && c.tema === tema))
          faltando.push(`${tela}-${largura}-${tema}`);

  const velhas = capturas.filter((c) => c.velha);
  const relatorio = {
    referenciaUi: { commit: hashUi, data: marcoUi ? new Date(marcoUi).toISOString() : null, assunto: assuntoUi, caminhos: caminhosUi },
    total: capturas.length,
    telas: telas.length,
    velhas: velhas.map((c) => ({ arquivo: c.arquivo, data: new Date(c.data).toISOString(), origem: c.origem })),
    faltando,
    foraDoPadrao,
  };

  if (json) console.log(JSON.stringify(relatorio, null, 2));
  else {
    console.log(`Referência de UI: ${hashUi || "-"} ${relatorio.referenciaUi.data ?? ""} "${assuntoUi}"`);
    console.log(`Capturas: ${capturas.length} em ${telas.length} tela(s); matriz ${larguras.join("/")} × ${temas.join("/")}.`);
    console.log(`\nVelhas (${velhas.length}):`);
    for (const c of velhas) console.log(`- ${c.arquivo}  ${new Date(c.data).toISOString()} (${c.origem})`);
    console.log(`\nFaltando (${faltando.length}):`);
    for (const f of faltando) console.log(`- ${f}`);
    if (foraDoPadrao.length) {
      console.log(`\nFora do padrão <tela>-<largura>-<tema> (${foraDoPadrao.length}):`);
      for (const f of foraDoPadrao) console.log(`- ${f}`);
    }
    if (!velhas.length && !faltando.length) console.log("\nTudo atual e completo.");
  }
  process.exit(estrito && (velhas.length || faltando.length) ? 1 : 0);
}

if (process.argv[1]?.endsWith("checar-capturas.mjs")) main(process.argv.slice(2));
