# cx-skills

Skills de agente para Claude Code, Codex, Cursor e outros agentes compatíveis com [skills.sh](https://skills.sh).

| Skill | O que faz |
|---|---|
| [`cx-actionable-ui`](skills/cx-actionable-ui/SKILL.md) | Torna telas de produto orientadas a ação: menos texto, uma ação primária, estado em selo, ajuda em ⓘ. Planeja por blocos e wireframe ASCII antes de escrever, com orçamento de palavras e regras anti-slop. Princípios, 14 leis de UX, 30 técnicas, matriz de tom, bibliografia, guia visual e scripts. |

## Instalar

```bash
npx skills add oandrefelipee/cx-skills
```

Só uma skill:

```bash
npx skills add oandrefelipee/cx-skills --skill cx-actionable-ui
```

## O que vem na `cx-actionable-ui`

A skill usa divulgação progressiva: o agente lê o `SKILL.md`, depois um índice ou o mapa de sintomas, e só então o arquivo do item de que precisa.

```
skills/cx-actionable-ui/
  SKILL.md                    princípios em 1 linha, tabela "Como trabalhar", adaptador
  workflows/                  00 planejar blocos · 01 auditar · 02 medir texto · 03 aplicar
                              técnicas · 04 microcopy · 05 QA visual · 06 ampliar o guia
  references/
    sintomas.md               "texto demais", "não sei qual é a ação"… → itens a abrir
    principios/INDEX.md       8 princípios, um .md cada
    leis/INDEX.md             14 leis de UX, um .md cada
    tecnicas/INDEX.md         30 técnicas, um .md cada
    diagramas.md              quando usar ASCII e quando usar Mermaid
    catalogo-de-blocos.md     blocos com orçamento de palavras
    wireframe-ascii.md        convenção de wireframe em 390 e 1280
    anti-slop.md · tone-matrix.md · checklist.md · livros.md · adaptador-modelo.md
    guia.html                 guia visual, gerado a partir dos .md
  scripts/                    contar-palavras · checar-capturas · wireframe-ascii
                              gerar-guia · checar-links (Node ou Bun, sem dependências)
```

Cada item (princípio, lei ou técnica) traz: definição, quando usar, anti-padrão, antes e depois em wireframe ASCII, microcopy antes e depois, prompt de uma linha, fonte e ligações para itens vizinhos.

## Como contribuir

1. Crie ou edite o `.md` do item em `references/principios/`, `leis/` ou `tecnicas/`, seguindo o formato de um item existente, e ponha o link no `INDEX.md` da pasta. Fontes novas vão em `references/livros.md`.
2. Regere o guia e confira os links:

   ```bash
   node skills/cx-actionable-ui/scripts/gerar-guia.mjs
   node skills/cx-actionable-ui/scripts/checar-links.mjs
   ```

3. Mantenha o conteúdo genérico: exemplos fictícios (loja, pedidos, assinaturas, integrações), resumos com palavras próprias e fontes conferidas na editora ou no autor.

O passo a passo completo está em [`workflows/06-acrescentar-ao-guia.md`](skills/cx-actionable-ui/workflows/06-acrescentar-ao-guia.md).

## Adaptador por projeto

As skills são genéricas. Cada projeto pluga as regras próprias (componentes, glossário, QA) num adaptador dentro do repositório dele, em `docs/design/ui-acao/README.md`. Modelo: [`skills/cx-actionable-ui/references/adaptador-modelo.md`](skills/cx-actionable-ui/references/adaptador-modelo.md).
