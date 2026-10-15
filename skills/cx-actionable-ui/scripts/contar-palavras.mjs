#!/usr/bin/env node
// Conta as palavras visíveis por bloco e compara com o orçamento.
// Sem dependências: Node 18+ ou Bun.
//
// Uso:
//   node contar-palavras.mjs <arquivo.html|arquivo.json|arquivo.txt|-> [--orcamento orc.json] [--json] [--estrito]
//
// Entradas:
//   .html  Blocos marcados com data-bloco="<id>" (ids do catálogo). Texto fora de bloco conta como "(fora)".
//   .json  Saída de innerText do E2E: {"cabecalho": "texto", ...} ou [{"bloco": "kpi", "texto": "..."}].
//   .txt   A página inteira como um bloco só ("pagina").
//   -      Lê da entrada padrão; use --formato html|json|txt (padrão: txt).
//
// Orçamento (JSON): {"padrao": 14, "blocos": {"cabecalho": 7, "kpi": 5}}. Sem arquivo, usa o padrão abaixo.
// Saída: tabela ou JSON. Código de saída 0, ou 1 com --estrito quando algum bloco estoura.

import { readFileSync } from "node:fs";
import { extname } from "node:path";

const ORCAMENTO_PADRAO = {
  padrao: 14,
  blocos: {
    cabecalho: 7,
    "linha-acao": 6,
    kpi: 5,
    vazio: 12,
    checklist: 4,
    destaque: 14,
    formulario: 11,
    bloqueio: 12,
    sheet: 18,
    "registros-copiar": 3,
    "lista-filtros": 6,
    confirmacao: 17,
  },
};

const IGNORADOS = new Set(["script", "style", "template", "noscript", "svg", "head", "title"]);
const VAZIOS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
const ENTIDADES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function ajuda(codigo = 0) {
  const texto = readFileSync(new URL(import.meta.url)).toString().split("\n");
  console.log(texto.slice(1, texto.findIndex((l) => l.startsWith("import"))).map((l) => l.replace(/^\/\/ ?/, "")).join("\n"));
  process.exit(codigo);
}

function decodificar(texto) {
  return texto
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, nome) => ENTIDADES[nome.toLowerCase()] ?? m);
}

export function contar(texto) {
  return texto.split(/\s+/).filter((t) => /[\p{L}\p{N}]/u.test(t)).length;
}

function atributo(tag, nome) {
  const m = tag.match(new RegExp(`\\s${nome}(?:\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+)))?`, "i"));
  if (!m) return null;
  return m[2] ?? m[3] ?? m[4] ?? "";
}

function escondido(tag) {
  if (atributo(tag, "hidden") !== null) return true;
  if (atributo(tag, "aria-hidden") === "true") return true;
  const classe = atributo(tag, "class") ?? "";
  return /(^|\s)(sr-only|visually-hidden|hidden)(\s|$)/.test(classe);
}

// Percorre o HTML e devolve [{bloco, texto}] na ordem em que os blocos aparecem.
export function blocosDoHtml(html) {
  const limpo = html.replace(/<!--[\s\S]*?-->/g, "").replace(/<!doctype[^>]*>/i, "");
  const pilha = []; // {nome, bloco (índice ou null), oculto}
  const blocos = [{ bloco: "(fora)", texto: "" }];
  const contagem = {};
  const re = /<\/?([a-zA-Z][\w-]*)([^>]*)>|([^<]+)/g;
  let m;
  const atual = () => {
    for (let i = pilha.length - 1; i >= 0; i--) if (pilha[i].bloco !== null) return pilha[i].bloco;
    return 0;
  };
  const oculto = () => pilha.some((p) => p.oculto);
  while ((m = re.exec(limpo))) {
    const [bruto, nomeTag, resto, texto] = m;
    if (texto !== undefined) {
      if (!oculto()) blocos[atual()].texto += ` ${decodificar(texto)}`;
      continue;
    }
    const nome = nomeTag.toLowerCase();
    if (bruto.startsWith("</")) {
      const i = pilha.map((p) => p.nome).lastIndexOf(nome);
      if (i >= 0) pilha.length = i;
      continue;
    }
    if (VAZIOS.has(nome) || resto.trim().endsWith("/")) continue;
    const id = atributo(bruto, "data-bloco");
    let bloco = null;
    if (id) {
      contagem[id] = (contagem[id] ?? 0) + 1;
      blocos.push({ bloco: id, instancia: contagem[id], texto: "" });
      bloco = blocos.length - 1;
    }
    pilha.push({ nome, bloco, oculto: IGNORADOS.has(nome) || escondido(bruto) });
  }
  return blocos.filter((b, i) => i > 0 || contar(b.texto) > 0);
}

function blocosDoJson(dados) {
  if (Array.isArray(dados)) return dados.map((d) => ({ bloco: d.bloco, texto: String(d.texto ?? "") }));
  return Object.entries(dados).map(([bloco, texto]) => ({ bloco, texto: String(texto) }));
}

function tipo(bloco) {
  return bloco.split(/[:#]/)[0];
}

export function avaliar(blocos, orcamento = ORCAMENTO_PADRAO) {
  const vistos = {};
  return blocos.map((b) => {
    vistos[b.bloco] = (vistos[b.bloco] ?? 0) + 1;
    const limite = orcamento.blocos?.[b.bloco] ?? orcamento.blocos?.[tipo(b.bloco)] ?? orcamento.padrao ?? 14;
    const palavras = contar(b.texto);
    const total = blocos.filter((x) => x.bloco === b.bloco).length;
    const rotulo = total > 1 ? `${b.bloco}#${vistos[b.bloco]}` : b.bloco;
    return { bloco: rotulo, palavras, limite, estourou: palavras > limite, texto: b.texto.replace(/\s+/g, " ").trim() };
  });
}

function main(argv) {
  const args = [...argv];
  if (args.length === 0 || args.includes("-h") || args.includes("--ajuda")) ajuda(args.length === 0 ? 1 : 0);
  const opcao = (nome) => {
    const i = args.indexOf(nome);
    if (i < 0) return null;
    const valor = args[i + 1];
    args.splice(i, 2);
    return valor;
  };
  const flag = (nome) => {
    const i = args.indexOf(nome);
    if (i >= 0) args.splice(i, 1);
    return i >= 0;
  };
  const arquivoOrcamento = opcao("--orcamento");
  const formatoForcado = opcao("--formato");
  const comoJson = flag("--json");
  const estrito = flag("--estrito");
  const entrada = args[0];

  const conteudo = entrada === "-" ? readFileSync(0, "utf8") : readFileSync(entrada, "utf8");
  const formato = formatoForcado ?? (entrada === "-" ? "txt" : extname(entrada).slice(1).toLowerCase());
  const orcamento = arquivoOrcamento ? JSON.parse(readFileSync(arquivoOrcamento, "utf8")) : ORCAMENTO_PADRAO;

  let blocos;
  if (formato === "html" || formato === "htm") blocos = blocosDoHtml(conteudo);
  else if (formato === "json") blocos = blocosDoJson(JSON.parse(conteudo));
  else blocos = [{ bloco: "pagina", texto: conteudo }];

  const resultado = avaliar(blocos, orcamento);
  const estouros = resultado.filter((r) => r.estourou);

  if (comoJson) {
    console.log(JSON.stringify({ blocos: resultado, estouros: estouros.length }, null, 2));
  } else {
    const largura = Math.max(5, ...resultado.map((r) => r.bloco.length));
    console.log(`${"Bloco".padEnd(largura)}  Palavras  Limite  Veredito`);
    for (const r of resultado) {
      console.log(`${r.bloco.padEnd(largura)}  ${String(r.palavras).padStart(8)}  ${String(r.limite).padStart(6)}  ${r.estourou ? "ESTOUROU" : "ok"}`);
    }
    console.log(`\n${resultado.length} bloco(s), ${estouros.length} acima do orçamento.`);
    for (const r of estouros) console.log(`- ${r.bloco}: "${r.texto.slice(0, 120)}${r.texto.length > 120 ? "…" : ""}"`);
  }
  process.exit(estrito && estouros.length > 0 ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("contar-palavras.mjs")) {
  main(process.argv.slice(2));
}
