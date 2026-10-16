// node --test scripts/antes-e-depois.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { formatarMarkdown, formatarTabelasDeVideo, montarPares, paraRelatorio, trocarBloco, MARCADOR_INICIO, MARCADOR_FIM } from "./antes-e-depois.mjs";

const cwd = "/repo";

test("par de imagens vira tabela Antes | Depois com rótulo", () => {
  const md = formatarMarkdown(montarPares({ antes: ["c/a.png"], depois: ["c/d.png"], rotulos: ["Celular 390"] }), { cwd });
  assert.match(md, /\| Antes \(Celular 390\) \| Depois \(Celular 390\) \|/);
  assert.match(md, /!\[Antes\]\(\.\/c\/a\.png\)/);
  assert.ok(md.startsWith(MARCADOR_INICIO) && md.trimEnd().endsWith(MARCADOR_FIM));
});

test("só depois vira Prévia", () => {
  assert.match(formatarMarkdown(montarPares({ depois: ["c/nova.png"] }), { cwd }), /\| Prévia \|/);
});

test("crédito entra no topo", () => {
  assert.match(formatarMarkdown(montarPares({ depois: ["c/n.png"] }), { cwd, credito: "agente" }), /> Antes e depois por agente/);
});

test("recusa tipos misturados, caminho fora e espaço", () => {
  assert.throws(() => formatarMarkdown(montarPares({ antes: ["a.png"], depois: ["d.mp4"] }), { cwd }), /mesmo tipo/);
  assert.throws(() => formatarMarkdown(montarPares({ depois: ["../fora.png"] }), { cwd }), /dentro da pasta/);
  assert.throws(() => formatarMarkdown(montarPares({ depois: ["c/com espaco.png"] }), { cwd }), /espaço/);
  assert.throws(() => montarPares({ antes: ["a.png"], depois: ["d.png", "e.png"] }), /um --antes para cada/);
});

test("vídeo final só aceita anexo do GitHub", () => {
  const ok = formatarTabelasDeVideo(montarPares({ antes: ["https://github.com/user-attachments/assets/A"], depois: ["https://github.com/user-attachments/assets/B"] }));
  assert.match(ok, /<th>Antes<\/th>/);
  assert.throws(() => formatarTabelasDeVideo(montarPares({ depois: ["https://exemplo.com/v.mp4"] })), /user-attachments/);
});

test("troca só o bloco marcado e preserva o resto", () => {
  const bloco = `${MARCADOR_INICIO}\nNOVO\n${MARCADOR_FIM}\n`;
  const corpo = `## Por quê\nX\n\n${MARCADOR_INICIO}\nVELHO\n${MARCADOR_FIM}\n\n## Riscos\nY\n`;
  assert.equal(trocarBloco(corpo, bloco), `## Por quê\nX\n\n${MARCADOR_INICIO}\nNOVO\n${MARCADOR_FIM}\n\n## Riscos\nY\n`);
});

test("substitui o bloco antigo do before-and-after original", () => {
  const bloco = `${MARCADOR_INICIO}\nNOVO\n${MARCADOR_FIM}\n`;
  const out = trocarBloco("Topo\n\n<!-- before-and-after:start -->\nX\n<!-- before-and-after:end -->\n", bloco);
  assert.ok(!out.includes("before-and-after") && out.includes("NOVO"));
});

test("recusa bloco incompleto ou duplicado", () => {
  assert.throws(() => trocarBloco(`a ${MARCADOR_INICIO} b`, "x"), /incompleto/);
  assert.throws(() => trocarBloco(`${MARCADOR_INICIO}${MARCADOR_FIM}${MARCADOR_INICIO}${MARCADOR_FIM}`, "x"), /mais de um/);
});

test("--relatorio gera antesDepois[] com caminhos relativos ao JSON", () => {
  const r = paraRelatorio(montarPares({ antes: ["cap/a.png"], depois: ["cap/d.png"], rotulos: ["Desktop"] }), { titulo: "Métricas", cwd, base: "/repo/docs/relatorios" });
  assert.deepEqual(r, [{ titulo: "Métricas · Desktop", antes: { imagem: "../../cap/a.png" }, depois: { imagem: "../../cap/d.png" } }]);
});
