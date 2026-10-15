# 00. Planejar blocos antes de escrever

Obrigatório em tela nova ou refeita, antes dos passos 01 a 05 e antes de qualquer código. Quem escreve texto primeiro acaba com um documento; quem monta blocos primeiro acaba com um painel. O texto entra por último, dentro de um orçamento.

Se a tela já tem wireframe aprovado, ele é o ponto de partida: este passo só detalha os blocos e o orçamento, nunca troca o visual aprovado (veja `../references/anti-slop.md`, "Fidelidade ao wireframe").

## Passos

1. **Intenção.** Escreva duas linhas: a decisão que a pessoa toma nesta tela e a ação principal (verbo + objeto). Se houver duas ações principais, são duas telas ou uma é secundária.
2. **Blocos.** Escolha os blocos em `../references/catalogo-de-blocos.md`, de cima para baixo, na ordem da decisão: estado primeiro, ação logo depois, detalhe por último. Bloco fora do catálogo exige motivo escrito.
3. **Componente da casa.** Para cada bloco, ache o componente no adaptador do projeto (`docs/design/ui-acao/README.md`). Sem adaptador, use o que o projeto já tem; nunca invente componente.
4. **Layout responsivo.** Desenhe o wireframe ASCII em 390 e em 1280 colunas lógicas, pela convenção de `../references/wireframe-ascii.md`. No 390, a ação primária continua visível sem rolar; o que é lado a lado no desktop vira pilha.
5. **Texto por último.** Só agora escreva os textos, cada bloco dentro do orçamento de palavras do catálogo (ou do adaptador, que vence). Se não couber, o bloco está errado, não o orçamento.
6. **Porquê em ⓘ.** Toda explicação (regra, fórmula, motivo) vira tooltip ou popover com ⓘ ([ajuda contextual](../references/tecnicas/ajuda-contextual.md)). Na tela fica só o que muda a decisão.

Em dúvida sobre um bloco, consulte `../references/tecnicas/INDEX.md` (a técnica) e `../references/leis/INDEX.md` (a lei que a justifica). Abra o arquivo do item só se precisar do antes e depois.

Atalho: `scripts/wireframe-ascii.mjs` gera o esqueleto a partir de uma lista de blocos em JSON; ajuste à mão depois.

## Saída

Entregue nesta ordem, que reflete a regra "texto por último": nos wireframes, os textos são marcadores curtos (`[Ação]`, `Título`, `(● Estado)`); a microcopy final só aparece na tabela, depois do layout.

1. A intenção em duas linhas.
2. Um wireframe ASCII de cada largura (390 e 1280), com marcadores no lugar do texto final.
3. A tabela, com a microcopy final e o orçamento de cada bloco:

| # | Bloco (catálogo) | Componente da casa | Orçamento (palavras) | Texto proposto | ⓘ |
|---|---|---|---|---|---|
| 1 | Cabeçalho com ação | `<PageHeader>` | 4 + 3 | "Fontes" · [Nova fonte] | não |
| 2 | Lista com estado e ação | `<ActionRow>` | 6 por linha | ... | sim, prazo |

Mostre o wireframe e a tabela ao dono e espere a aprovação antes do código. A aprovação vale para o visual inteiro (cores, gradientes, selos, hierarquia), não só para os textos.
