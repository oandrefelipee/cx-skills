# Adaptador de UI orientada a ação: <nome do projeto>

Modelo para `docs/design/ui-acao/README.md`. A skill `cx-actionable-ui` lê este arquivo antes de mexer numa tela. Preencha só o que é do projeto; o genérico já está na skill.

## Escopo

- Vale para: <apps/telas>
- Não vale para: <superfícies fora, ex.: site público>

## Técnica → componente

| Técnica | Componente da casa | Import |
|---|---|---|
| Ajuda contextual (ⓘ) | <InfoHint> | <pacote> |
| Selo de status | <StatusBadge> | <pacote> |
| Linha com ação | <ActionRow> | <pacote> |
| KPI com variação | <KpiRow> | <pacote> |
| Vazio com ação | <EmptyAction> | <pacote> |

## Catálogo de blocos do projeto

Os blocos de `references/catalogo-de-blocos.md` mapeados para os componentes da casa. O orçamento aqui vence o da skill.

| Bloco (id) | Componente da casa | Orçamento (palavras) |
|---|---|---|
| `cabecalho` | <PageHeader> | 4 + 3 |
| `linha-acao` | <ActionRow> | 6 |
| `kpi` | <KpiRow> | 3 no rótulo |
| `vazio` | <EmptyAction> | 12 |

## Regras do projeto

- Imports permitidos e proibidos: <...>
- Wireframes aprovados ficam em: <pasta>. Como abrir: <comando>. Toda captura é comparada com a variação aprovada.
- Capturas ficam em: <pasta>, no padrão `<tela>-<largura>-<tema>.png`; confira com `scripts/checar-capturas.mjs`.
- Lint ou checagem automática de microcopy: <comando>

## Glossário

| Termo | Use | Evite |
|---|---|---|

## QA visual

- Matriz de capturas: <tamanhos e temas>
- Comandos: <...>
