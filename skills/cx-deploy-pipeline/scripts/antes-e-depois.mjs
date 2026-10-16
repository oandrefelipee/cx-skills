#!/usr/bin/env node
/**
 * Antes e depois no corpo do PR e no relatório HTML.
 *
 * Obra derivada de `skill/scripts/format.mjs` do before-and-after
 * (https://github.com/vercel-labs/before-and-after, commit 8306d34),
 * Copyright (c) 2026 James Clements, sob a licença em
 * ../vendor/before-and-after/LICENSE. O original sem mudanças está em
 * ../vendor/before-and-after/scripts/format.mjs.
 *
 * Mudanças desta versão: rótulos em pt-BR (Antes, Depois, Prévia), marcador
 * próprio (<!-- antes-e-depois:start/end -->), que também substitui um bloco
 * antigo do before-and-after, e a saída --relatorio, que gera o campo
 * `antesDepois[]` do relatorio-pr.mjs a partir dos mesmos pares.
 *
 * O script não captura telas: só formata mídia que já existe. Sem dependências.
 */

import { existsSync, readFileSync } from "node:fs";
import { extname, relative, resolve } from "node:path";
import { parseArgs } from "node:util";

export const MARCADOR_INICIO = "<!-- antes-e-depois:start -->";
export const MARCADOR_FIM = "<!-- antes-e-depois:end -->";
// Bloco publicado antes pela skill original: é trocado pelo nosso, nunca duplicado.
const MARCADORES_ORIGINAIS = ["<!-- before-and-after:start -->", "<!-- before-and-after:end -->"];

const IMAGENS = new Set([".gif", ".jpeg", ".jpg", ".png", ".webp"]);
const VIDEOS = new Set([".mp4", ".mov", ".webm"]);

export function tipoDeMidia(arquivo) {
  const ext = extname(arquivo).toLowerCase();
  if (IMAGENS.has(ext)) return "imagem";
  if (VIDEOS.has(ext)) return "video";
  throw new Error(`Mídia não suportada: "${arquivo}"`);
}

export function refLocal(arquivo, cwd = process.cwd()) {
  const caminho = relative(cwd, resolve(cwd, arquivo));
  if (caminho === ".." || caminho.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`)) {
    throw new Error(`A mídia precisa estar dentro da pasta de trabalho: "${arquivo}"`);
  }
  const ref = caminho.startsWith(".") ? caminho : `./${caminho}`;
  if (/\s/.test(ref)) throw new Error(`Caminho de mídia não pode ter espaço: "${ref}"`);
  return ref;
}

export function montarPares({ antes = [], depois = [], rotulos = [] }) {
  if (depois.length === 0) throw new Error("Passe ao menos um --depois");
  if (antes.length !== 0 && antes.length !== depois.length) {
    throw new Error("Passe nenhum --antes ou um --antes para cada --depois");
  }
  if (rotulos.length > depois.length) throw new Error("Passe no máximo um --rotulo por --depois");
  return depois.map((d, i) => ({ antes: antes.length ? antes[i] : null, depois: d, rotulo: rotulos[i] ?? null }));
}

const sufixo = (rotulo) => (rotulo ? ` (${rotulo})` : "");
const img = (arquivo, alt, cwd) => `![${alt}](${refLocal(arquivo, cwd)})`;

function urlDeAnexo(valor) {
  let url;
  try {
    url = new URL(valor);
  } catch {
    throw new Error(`URL de anexo do GitHub inválida: "${valor}"`);
  }
  if (url.protocol !== "https:" || url.hostname !== "github.com" || !url.pathname.startsWith("/user-attachments/assets/")) {
    throw new Error(`Esperado https://github.com/user-attachments/assets/...: "${valor}"`);
  }
  return url.href;
}

function parDeImagens(par, cwd, linhas) {
  const s = sufixo(par.rotulo);
  if (par.antes) {
    linhas.push(`| Antes${s} | Depois${s} |`, "|:---:|:---:|", `| ${img(par.antes, "Antes", cwd)} | ${img(par.depois, "Depois", cwd)} |`, "");
  } else {
    linhas.push(`| Prévia${s} |`, "|:---:|", `| ${img(par.depois, "Prévia", cwd)} |`, "");
  }
}

// Vídeo local fica em linha própria para o `gh --attach` trocar a referência pela URL final.
function parDeVideos(par, cwd, linhas) {
  const s = sufixo(par.rotulo);
  if (par.antes) linhas.push(`**Antes${s}**`, "", img(par.antes, "Antes", cwd), "");
  const nome = par.antes ? "Depois" : "Prévia";
  linhas.push(`**${nome}${s}**`, "", img(par.depois, nome, cwd), "");
}

function tabelaDeVideos(par, linhas) {
  const s = sufixo(par.rotulo);
  const antes = par.antes ? urlDeAnexo(par.antes) : null;
  const depois = urlDeAnexo(par.depois);
  linhas.push("<table>", "  <tr>");
  if (antes) linhas.push(`    <th>Antes${s}</th>`);
  linhas.push(`    <th>${antes ? "Depois" : "Prévia"}${s}</th>`, "  </tr>", "  <tr>");
  if (antes) linhas.push(`    <td><video src="${antes}" width="100%" controls></video></td>`);
  linhas.push(`    <td><video src="${depois}" width="100%" controls></video></td>`, "  </tr>", "</table>", "");
}

function abrir(credito) {
  const linhas = [MARCADOR_INICIO];
  if (credito) linhas.push(`> Antes e depois por ${credito}`, "");
  return linhas;
}
const fechar = (linhas) => `${[...linhas, MARCADOR_FIM].join("\n").trim()}\n`;

export function formatarMarkdown(pares, { credito, cwd = process.cwd() } = {}) {
  const linhas = abrir(credito);
  for (const par of pares) {
    const tA = par.antes ? tipoDeMidia(par.antes) : null;
    const tD = tipoDeMidia(par.depois);
    if (tA && tA !== tD) throw new Error(`Antes e depois precisam do mesmo tipo de mídia: "${par.antes}" e "${par.depois}"`);
    if (tD === "imagem") parDeImagens(par, cwd, linhas);
    else parDeVideos(par, cwd, linhas);
  }
  return fechar(linhas);
}

export function formatarTabelasDeVideo(pares, { credito } = {}) {
  const linhas = abrir(credito);
  for (const par of pares) tabelaDeVideos(par, linhas);
  return fechar(linhas);
}

export function listaDeAnexos(pares, { cwd = process.cwd() } = {}) {
  return [...new Set(pares.flatMap((p) => [p.antes, p.depois]).filter(Boolean).map((f) => refLocal(f, cwd)))];
}

/** Pares no formato do campo `antesDepois[]` do relatorio-pr.mjs (caminhos relativos a `base`). */
export function paraRelatorio(pares, { titulo, cwd = process.cwd(), base = cwd } = {}) {
  const lado = (f) => (f ? { imagem: relative(base, resolve(cwd, f)) } : null);
  return pares.map((p) => {
    if (tipoDeMidia(p.depois) !== "imagem") throw new Error(`O relatório HTML embute só imagens: "${p.depois}"`);
    return { titulo: [titulo, p.rotulo].filter(Boolean).join(" · ") || "Prévia", antes: lado(p.antes), depois: lado(p.depois) };
  });
}

function acharBloco(corpo, [inicio, fim]) {
  const a = corpo.indexOf(inicio);
  const b = corpo.indexOf(fim);
  if (a === -1 && b === -1) return null;
  if (a === -1 || b === -1 || b < a) throw new Error(`O corpo do PR tem um bloco ${inicio} incompleto`);
  if (corpo.indexOf(inicio, a + inicio.length) !== -1 || corpo.indexOf(fim, b + fim.length) !== -1) {
    throw new Error(`O corpo do PR tem mais de um bloco ${inicio}`);
  }
  return [a, b + fim.length];
}

/** Troca só o bloco marcado (nosso ou o do original); o resto do corpo fica byte a byte. */
export function trocarBloco(corpo, bloco) {
  const nosso = acharBloco(corpo, [MARCADOR_INICIO, MARCADOR_FIM]);
  const original = acharBloco(corpo, MARCADORES_ORIGINAIS);
  if (nosso && original) throw new Error("O corpo do PR tem os dois blocos (antes-e-depois e before-and-after): junte à mão");
  const faixa = nosso ?? original;
  if (!faixa) {
    const prefixo = corpo.trimEnd();
    return prefixo ? `${prefixo}\n\n${bloco}` : bloco;
  }
  const prefixo = corpo.slice(0, faixa[0]).trimEnd();
  const resto = corpo.slice(faixa[1]).trim();
  return `${[prefixo, bloco.trim(), resto].filter(Boolean).join("\n\n")}\n`;
}

function validarArquivos(pares, cwd) {
  for (const f of pares.flatMap((p) => [p.antes, p.depois]).filter(Boolean)) {
    if (!existsSync(resolve(cwd, f))) throw new Error(`Mídia não existe: "${f}"`);
    tipoDeMidia(f);
    refLocal(f, cwd);
  }
}

function principal(argv) {
  const { values: v } = parseArgs({
    args: argv,
    options: {
      antes: { type: "string", multiple: true },
      depois: { type: "string", multiple: true },
      rotulo: { type: "string", multiple: true },
      credito: { type: "string" },
      "lista-de-anexos": { type: "boolean" },
      "corpo": { type: "string" },
      "antes-video-url": { type: "string", multiple: true },
      "depois-video-url": { type: "string", multiple: true },
      relatorio: { type: "boolean" },
      titulo: { type: "string" },
      base: { type: "string" },
    },
  });

  const local = (v.depois?.length ?? 0) > 0 || (v.antes?.length ?? 0) > 0;
  const videoFinal = (v["depois-video-url"]?.length ?? 0) > 0 || (v["antes-video-url"]?.length ?? 0) > 0;
  if (local === videoFinal) throw new Error("Passe mídia local (--depois) ou URLs finais de vídeo (--depois-video-url), não os dois");

  const pares = videoFinal
    ? montarPares({ antes: v["antes-video-url"], depois: v["depois-video-url"], rotulos: v.rotulo })
    : montarPares({ antes: v.antes, depois: v.depois, rotulos: v.rotulo });
  if (!videoFinal) validarArquivos(pares, process.cwd());

  if (v.relatorio) {
    if (videoFinal) throw new Error("--relatorio precisa de imagens locais");
    process.stdout.write(`${JSON.stringify(paraRelatorio(pares, { titulo: v.titulo, base: v.base ? resolve(v.base) : process.cwd() }), null, 2)}\n`);
    return;
  }
  if (v["lista-de-anexos"]) {
    if (videoFinal) throw new Error("--lista-de-anexos precisa de mídia local");
    process.stdout.write(`${listaDeAnexos(pares).join("\n")}\n`);
    return;
  }

  const bloco = videoFinal ? formatarTabelasDeVideo(pares, { credito: v.credito }) : formatarMarkdown(pares, { credito: v.credito });
  process.stdout.write(v.corpo ? trocarBloco(readFileSync(v.corpo, "utf8"), bloco) : bloco);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").at(-1))) {
  try {
    principal(process.argv.slice(2));
  } catch (erro) {
    console.error(String(erro?.message ?? erro));
    process.exit(1);
  }
}
