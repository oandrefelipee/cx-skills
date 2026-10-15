#!/usr/bin/env node
// Gera o esqueleto de um wireframe ASCII (390 e 1280) a partir de uma lista de blocos em JSON.
// Sem dependências: Node 18+ ou Bun. O resultado é ponto de partida: ajuste à mão depois.
//
// Uso:
//   node wireframe-ascii.mjs <tela.json|-> [--largura 390|1280|ambas]
//
// Formato do JSON (tipos = ids do catálogo de blocos):
//   {"tela": "Fontes", "blocos": [
//     {"tipo": "cabecalho", "titulo": "Fontes", "acao": "Nova fonte", "visoes": ["Ativas", "Pausadas"]},
//     {"tipo": "kpi", "itens": [{"rotulo": "Ativas", "valor": "12", "delta": "+2"}]},
//     {"tipo": "linha-acao", "itens": [{"nome": "<nome>", "estado": "Ativa", "meta": "há 2 min", "acao": "Testar"}]},
//     {"tipo": "vazio", "texto": "As fontes aparecem aqui.", "acao": "Conectar fonte"},
//     {"tipo": "checklist", "itens": [{"titulo": "Nome", "estado": "feito"}, {"titulo": "Conectar", "estado": "atual", "acao": "Testar"}]},
//     {"tipo": "destaque", "titulo": "...", "texto": "...", "acao": "..."},
//     {"tipo": "formulario", "campos": ["Nome", "URL"], "acao": "Salvar"},
//     {"tipo": "bloqueio", "estado": "Sem conexão", "texto": "Reconecte para enviar.", "acao": "Reconectar"},
//     {"tipo": "registros-copiar", "itens": [{"rotulo": "CNAME", "valor": "<valor>"}]},
//     {"tipo": "lista-filtros", "filtros": ["Estado", "Período"]},
//     {"tipo": "sheet", "titulo": "<item>", "estado": "Pronta", "acao": "Publicar"},
//     {"tipo": "confirmacao", "titulo": "Excluir domínio?", "texto": "Os links deixam de abrir.", "acao": "Excluir domínio"}
//   ]}

import { readFileSync } from "node:fs";

const COLUNAS = { 390: 40, 1280: 96 };

function ajuda(codigo = 0) {
  const linhas = readFileSync(new URL(import.meta.url)).toString().split("\n");
  console.log(linhas.slice(1, linhas.findIndex((l) => l.startsWith("import"))).map((l) => l.replace(/^\/\/ ?/, "")).join("\n"));
  process.exit(codigo);
}

const tam = (s) => [...s].length;
function ajustar(texto, largura) {
  const t = [...texto];
  if (t.length > largura) return `${t.slice(0, largura - 1).join("")}…`;
  return texto + " ".repeat(largura - t.length);
}
function lados(esq, dir, largura) {
  const espaco = largura - tam(esq) - tam(dir);
  return espaco >= 1 ? esq + " ".repeat(espaco) + dir : null;
}
const primario = (a) => (a ? `[■ ${a}]` : "");
const secundario = (a) => (a ? `[ ${a} ]` : "");
const selo = (e) => (e ? `(● ${e})` : "");
const MARCA = { feito: "✓", atual: "◐", pendente: "○" };

// Cada função devolve linhas de conteúdo (sem bordas) para uma largura interna w.
const BLOCOS = {
  cabecalho(b, w) {
    const linhas = [lados(b.titulo ?? "<título>", `${primario(b.acao)} [⋯]`.trim(), w) ?? b.titulo];
    if (b.visoes?.length) linhas.push(b.visoes.map((v) => `[${v}]`).join(" "));
    return linhas;
  },
  kpi(b, w) {
    const itens = b.itens ?? [{ rotulo: "<rótulo>", valor: "<valor>", delta: "+0%" }];
    const celula = (i) => [`${i.rotulo} ⓘ`, `${i.valor}   ${String(i.delta ?? "").startsWith("-") ? "▼" : "▲"} ${i.delta ?? ""}`];
    if (w < 60) return itens.map((i) => celula(i).join("   "));
    const larg = Math.min(24, Math.floor((w - 2 * (itens.length - 1)) / itens.length));
    const topo = itens.map(() => `+${"-".repeat(larg - 2)}+`).join("  ");
    const l1 = itens.map((i) => `|${ajustar(` ${celula(i)[0]}`, larg - 2)}|`).join("  ");
    const l2 = itens.map((i) => `|${ajustar(` ${celula(i)[1]}`, larg - 2)}|`).join("  ");
    return [topo, l1, l2, topo];
  },
  "linha-acao"(b, w) {
    const itens = b.itens ?? [{ nome: "<nome>", estado: "<estado>", acao: "Ver" }];
    const linhas = itens.flatMap((i) =>
      w < 60
        ? [lados(i.nome, selo(i.estado), w), lados(i.meta ?? "", `${secundario(i.acao)} [⋯]`, w)]
        : [lados(`${i.nome}   ${selo(i.estado)}   ${i.meta ?? ""}`, `${secundario(i.acao)} [⋯]`, w)],
    );
    return [...linhas.filter(Boolean), "···"];
  },
  vazio(b, w) {
    const centro = (s) => " ".repeat(Math.max(0, Math.floor((w - tam(s)) / 2))) + s;
    return ["", centro(`{ícone: ${b.icone ?? "<objeto>"}}`), centro(b.texto ?? "<o que aparece aqui>"), centro(primario(b.acao ?? "<ação>")), ""];
  },
  checklist(b, w) {
    return (b.itens ?? []).map((p, n) => {
      const esq = `${MARCA[p.estado] ?? "○"} ${n + 1} ${p.titulo}`;
      return p.estado === "atual" && p.acao ? (lados(esq, primario(p.acao), w) ?? esq) : esq;
    });
  },
  destaque(b, w) {
    return [lados(`▒ ${b.titulo ?? "<título>"}`, "[x]", w), `▒ ${b.texto ?? "<benefício em 1 frase>"}`, `▒ ${primario(b.acao ?? "<ação>")}`];
  },
  formulario(b, w) {
    const campos = b.campos ?? ["<rótulo>"];
    const rot = Math.max(...campos.map(tam)) + 1;
    return [...campos.map((c) => `${ajustar(c, rot)}[${"_".repeat(Math.max(8, Math.min(30, w - rot - 3)))}]`), `${primario(b.acao ?? "Salvar")}  [ Cancelar ]`];
  },
  bloqueio(b, w) {
    const linha = `${selo(b.estado ?? "Bloqueado")}  ${b.texto ?? "<motivo>"}`;
    const cabe = lados(linha, primario(b.acao ?? "<destravar>"), w);
    return cabe ? [cabe] : [selo(b.estado ?? "Bloqueado"), b.texto ?? "<motivo>", primario(b.acao ?? "<destravar>")];
  },
  sheet(b, w) {
    return [lados(b.titulo ?? "<item>", selo(b.estado), w) ?? b.titulo, lados("Detalhes", "ⓘ", w), "···", lados(primario(b.acao ?? "<ação>"), "[ Fechar ]", w)];
  },
  "registros-copiar"(b, w) {
    return (b.itens ?? [{ rotulo: "<rótulo>", valor: "<valor>" }]).flatMap(
      (i) => lados(`${i.rotulo}  ${i.valor}`, "{copiar}", w) ?? [lados(i.rotulo, "{copiar}", w), `  ${i.valor}`],
    );
  },
  "lista-filtros"(b) {
    return [[`[Buscar______]`, ...(b.filtros ?? []).map((f) => `[▾ ${f}]`)].join(" ")];
  },
  confirmacao(b) {
    return [b.titulo ?? "<Excluir objeto?>", b.texto ?? "<consequência>", `${primario(b.acao ?? "<Excluir objeto>")} [ Cancelar ]`];
  },
};

export function desenhar(tela, largura) {
  const total = COLUNAS[largura];
  const w = total - 4;
  const saida = [`${largura}: ${tela.tela ?? ""}`, `+${"=".repeat(total - 2)}+`];
  tela.blocos.forEach((b, i) => {
    const gerar = BLOCOS[b.tipo];
    const linhas = gerar ? gerar(b, w) : [`<bloco fora do catálogo: ${b.tipo}>`];
    if (i > 0) saida.push(`+${"-".repeat(total - 2)}+`);
    for (const l of linhas) saida.push(`| ${ajustar(l ?? "", w)} |`);
  });
  saida.push(`+${"-".repeat(total - 2)}+`);
  return saida.join("\n");
}

function main(argv) {
  if (argv.length === 0 || argv.includes("-h") || argv.includes("--ajuda")) ajuda(argv.length === 0 ? 1 : 0);
  const i = argv.indexOf("--largura");
  const escolha = i >= 0 ? argv[i + 1] : "ambas";
  const entrada = argv.find((a, n) => !a.startsWith("--") && argv[n - 1] !== "--largura");
  const tela = JSON.parse(readFileSync(entrada === "-" ? 0 : entrada, "utf8"));
  const larguras = escolha === "ambas" ? [390, 1280] : [Number(escolha)];
  console.log(larguras.map((l) => desenhar(tela, l)).join("\n\n"));
}

if (process.argv[1]?.endsWith("wireframe-ascii.mjs")) main(process.argv.slice(2));
