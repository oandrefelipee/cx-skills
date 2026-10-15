# cx-skills

Skills de agente do CentralX para Claude Code, Codex, Cursor e outros agentes compatíveis com [skills.sh](https://skills.sh).

| Skill | O que faz |
|---|---|
| [`cx-actionable-ui`](skills/cx-actionable-ui/SKILL.md) | Torna telas de produto orientadas a ação: menos texto, uma ação primária, estado em selo, ajuda em ⓘ. Princípios, 14 leis de UX, 30 técnicas, matriz de tom, bibliografia e um guia visual com antes e depois. |

## Instalar

```bash
npx skills add oandrefelipee/cx-skills
```

Só uma skill:

```bash
npx skills add oandrefelipee/cx-skills --skill cx-actionable-ui
```

## Adaptador por projeto

As skills são genéricas. Cada projeto pluga as regras próprias (componentes, glossário, QA) num adaptador dentro do repositório dele, em `docs/design/ui-acao/README.md`. Modelo: [`skills/cx-actionable-ui/references/adaptador-modelo.md`](skills/cx-actionable-ui/references/adaptador-modelo.md).
