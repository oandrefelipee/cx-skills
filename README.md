# cx-skills

Skills de agente do CentralX para Claude Code, Codex, Cursor e outros agentes compatíveis com [skills.sh](https://skills.sh).

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

| Parte | Conteúdo |
|---|---|
| `workflows/` | 00 planejar blocos (obrigatório em tela nova), 01 auditar, 02 medir texto, 03 aplicar técnicas, 04 microcopy, 05 QA visual, 06 ampliar o guia |
| `references/` | Catálogo de blocos com orçamento de palavras, convenção de wireframe ASCII, anti-slop, técnicas, tom, checklist, livros e o guia visual (`guia.html`) |
| `scripts/` | `contar-palavras.mjs` (orçamento por bloco), `checar-capturas.mjs` (capturas velhas ou faltando), `wireframe-ascii.mjs` (esqueleto 390 e 1280). Node ou Bun, sem dependências |

## Adaptador por projeto

As skills são genéricas. Cada projeto pluga as regras próprias (componentes, glossário, QA) num adaptador dentro do repositório dele, em `docs/design/ui-acao/README.md`. Modelo: [`skills/cx-actionable-ui/references/adaptador-modelo.md`](skills/cx-actionable-ui/references/adaptador-modelo.md).
