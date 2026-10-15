#!/usr/bin/env node
// Regrava o bloco JSON do guia visual (references/guia.html) a partir dos .md.
// Fonte única: references/{principios,leis,tecnicas}/*.md e references/livros.md.
// Sem dependências: Node 18+ ou Bun. O resto do HTML fica intacto.
//
// Uso:
//   node scripts/gerar-guia.mjs              regrava references/guia.html
//   node scripts/gerar-guia.mjs --verificar  só confere; sai com 1 se o guia estiver desatualizado
//   node scripts/gerar-guia.mjs --ajuda
//
// Formato de um item (.md):
//   frontmatter com id, pt, en, ctx: [..], fontes: [..], destaque: true|false;
//   seções "## Definição", "## Quando usar" (com a linha "**Exemplo:** ..."), "## Anti-padrão",
//   "## Prompt" (citação "> ..."); e, no fim, os mocks HTML do guia em
//   <!-- guia:antes ... --> e <!-- guia:depois ... -->.
// A ordem dos itens no guia segue a ordem dos links no INDEX.md de cada pasta.

import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
if (args.includes("--ajuda") || args.includes("-h")) {
  const linhas = readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n");
  console.log(linhas.slice(1, linhas.findIndex((l) => l.startsWith("import"))).map((l) => l.replace(/^\/\/ ?/, "")).join("\n"));
  process.exit(0);
}

const REF = join(dirname(fileURLToPath(import.meta.url)), "..", "references");
const GUIA = join(REF, "guia.html");
const TIPOS = [
  ["principios", "Princípio"],
  ["leis", "Lei"],
  ["tecnicas", "Técnica"],
];
const TAG = '<script type="application/json" id="dados">';
const erros = [];

function frontmatter(texto, arquivo) {
  const m = texto.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) { erros.push(`${arquivo}: sem frontmatter`); return {}; }
  const fm = {};
  for (const linha of m[1].split("\n")) {
    const kv = linha.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (v.startsWith("[") && v.endsWith("]")) v = v.slice(1, -1).split(",").map((s) => s.trim()).filter(Boolean);
    else if (v === "true" || v === "false") v = v === "true";
    fm[kv[1]] = v;
  }
  return fm;
}

function secoes(texto) {
  const s = {};
  const partes = texto.split(/^## /m).slice(1);
  for (const p of partes) {
    const nl = p.indexOf("\n");
    s[p.slice(0, nl).trim()] = p.slice(nl + 1).replace(/<!--[\s\S]*?-->/g, "").trim();
  }
  return s;
}

const umaLinha = (t) => (t || "").split("\n").map((l) => l.trim()).filter(Boolean).join(" ");

function ordemDoIndice(pasta) {
  const indice = join(REF, pasta, "INDEX.md");
  if (!existsSync(indice)) return [];
  const links = [...readFileSync(indice, "utf8").matchAll(/\]\(([^)#]+\.md)\)/g)].map((m) => m[1]).filter((f) => !f.includes("/"));
  return [...new Set(links)];
}

function lerItem(pasta, cat, arquivo) {
  const caminho = join(pasta, arquivo);
  const texto = readFileSync(join(REF, caminho), "utf8");
  const fm = frontmatter(texto, caminho);
  const s = secoes(texto);
  const quandoBruto = s["Quando usar"] || "";
  const [quando, exemplo = ""] = quandoBruto.split(/\*\*Exemplo:\*\*/);
  const mock = (nome) => {
    const m = texto.match(new RegExp(`<!-- guia:${nome} ([\\s\\S]*?) -->`));
    return m ? m[1] : "";
  };
  const item = {
    id: fm.id,
    cat,
    en: fm.en,
    pt: fm.pt,
    definicao: umaLinha(s["Definição"]),
    quando: umaLinha(quando),
    exemplo: umaLinha(exemplo),
    anti: umaLinha(s["Anti-padrão"]),
    ctx: fm.ctx || [],
    fontes: fm.fontes || [],
    antes: mock("antes"),
    depois: mock("depois"),
    prompt: umaLinha((s["Prompt"] || "").replace(/^>\s?/gm, "")),
    destaque: fm.destaque === true,
  };
  for (const campo of ["id", "en", "pt", "definicao", "quando", "exemplo", "anti", "prompt", "antes", "depois"]) {
    if (!item[campo]) erros.push(`${caminho}: campo "${campo}" vazio`);
  }
  if (!item.fontes.length) erros.push(`${caminho}: sem fontes`);
  if (/TODO-/.test(texto)) erros.push(`${caminho}: ainda tem marcador TODO`);
  return item;
}

function lerItens() {
  const itens = [];
  for (const [pasta, cat] of TIPOS) {
    const arquivos = readdirSync(join(REF, pasta)).filter((f) => f.endsWith(".md") && f !== "INDEX.md");
    const ordem = ordemDoIndice(pasta);
    for (const f of arquivos) if (!ordem.includes(f)) erros.push(`${pasta}/${f}: fora do INDEX.md`);
    for (const f of ordem) if (!arquivos.includes(f)) erros.push(`${pasta}/INDEX.md: link para arquivo inexistente ${f}`);
    const lista = [...ordem.filter((f) => arquivos.includes(f)), ...arquivos.filter((f) => !ordem.includes(f)).sort()];
    for (const f of lista) itens.push(lerItem(pasta, cat, f));
  }
  const vistos = new Set();
  for (const it of itens) {
    if (vistos.has(it.id)) erros.push(`id repetido: ${it.id}`);
    vistos.add(it.id);
  }
  return itens;
}

function lerFontes() {
  const texto = readFileSync(join(REF, "livros.md"), "utf8");
  const celulas = (l) => l.split("|").slice(1, -1).map((c) => c.trim());
  const url = (c) => (c.match(/\]\(([^)]+)\)/) || [])[1] || c;
  const semMarca = (c) => c.replace(/^`|`$/g, "").replace(/^\*|\*$/g, "");
  const fontes = [];
  let modo = null;
  for (const l of texto.split("\n")) {
    if (l.startsWith("## Livros")) modo = "livro";
    else if (l.startsWith("## Guias")) modo = "guia";
    else if (l.startsWith("## ")) modo = null;
    if (!modo || !l.startsWith("| `")) continue;
    const c = celulas(l);
    if (modo === "livro") {
      const [id, autor, titulo, edicao, ensina, curto, link] = c;
      fontes.push({ id: semMarca(id), tipo: "livro", autor, titulo: semMarca(titulo), edicao, url: url(link), ensina, curto });
    } else {
      const [id, autor, titulo, ensina, curto, link] = c;
      fontes.push({ id: semMarca(id), tipo: "guia", autor, titulo, edicao: "guia online, atualizado continuamente", url: url(link), ensina, curto });
    }
  }
  return fontes;
}

const html = readFileSync(GUIA, "utf8");
const ini = html.indexOf(TAG + "{");
const fim = html.indexOf("</script>", ini);
if (ini < 0 || fim < 0) { console.error("guia.html: bloco de dados não encontrado"); process.exit(1); }
const dados = JSON.parse(html.slice(ini + TAG.length, fim));

dados.fontes = lerFontes();
dados.itens = lerItens();
const ids = new Set(dados.fontes.map((f) => f.id));
for (const it of dados.itens) for (const f of it.fontes) if (!ids.has(f)) erros.push(`${it.id}: fonte "${f}" não existe em livros.md`);

if (erros.length) {
  console.error(erros.map((e) => `erro: ${e}`).join("\n"));
  process.exit(1);
}

const novo = html.slice(0, ini + TAG.length) + JSON.stringify(dados, null, 1) + html.slice(fim);
const contagem = TIPOS.map(([, cat]) => `${dados.itens.filter((i) => i.cat === cat).length} ${cat.toLowerCase()}`).join(", ");
if (args.includes("--verificar")) {
  if (novo !== html) { console.error(`guia.html desatualizado; rode: node scripts/gerar-guia.mjs`); process.exit(1); }
  console.log(`guia.html em dia (${contagem}, ${dados.fontes.length} fontes).`);
} else {
  writeFileSync(GUIA, novo);
  console.log(`guia.html regravado: ${contagem}, ${dados.fontes.length} fontes.`);
}
