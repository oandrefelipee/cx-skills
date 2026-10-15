---
name: cx-actionable-ui
description: Torna uma tela de produto orientada a ação, com menos texto e mais clareza. Planeja a tela por blocos (catálogo com orçamento de palavras) e wireframe ASCII em 390 e 1280 antes de escrever texto ou código, escolhe a técnica certa entre 8 princípios, 14 leis de UX (Hick, Fitts, Miller, Jakob, Doherty, Gestalt…) e 30 técnicas, aplica regras anti-slop e confere a entrega contra o wireframe aprovado. Use sempre que o pedido for criar ou refazer uma tela, auditar, simplificar, enxugar, "tirar texto", "deixar mais direto/escaneável", melhorar microcopy, criar estado vazio, checklist de primeiro uso, cartões de KPI, selos de status, tooltips de ajuda, quando a tela "parece feita por IA", ou quando uma tela parecer um documento (parágrafos, fórmulas, explicações fixas) em vez de um painel. Use também para justificar uma decisão de UI com uma lei de UX ou um livro. Cobre dashboards, admin, configurações, listas e onboarding, em qualquer stack. Use junto com a skill `impeccable` (comandos distill, clarify, critique) quando ela estiver instalada.
---

# UI orientada a ação

Uma tela de produto serve para decidir e agir, não para ser lida. O objetivo: a pessoa entende o estado em 2 segundos e vê a próxima ação sem ler um parágrafo.

Esta skill é genérica. Cada projeto pluga as regras dele por um **adaptador**, que fica no próprio repositório (veja abaixo).

## Princípios (a regra de ouro de cada um)

1. **Estado e ação antes de explicação:** selo e botão primeiro; o porquê vai para ⓘ.
2. **Uma ação primária por tela ou bloco:** o resto é secundário ou vai para um menu.
3. **Mostrar, não contar:** preview, número ou estado no lugar de descrição.
4. **Divulgação progressiva em no máximo 2 níveis:** tela e popover, nunca um labirinto.
5. **Voz constante, tom variável:** a voz não muda; o tom segue o gatilho (`references/tone-matrix.md`).
6. **Cortar não é esconder o que importa:** se muda a decisão, fica visível; se só explica, vai para ⓘ; se repete, some.
7. **Não me faça pensar:** a tela se explica sozinha, sem decifrar.
8. **Dados primeiro, enfeite por último:** cada pixel serve ao dado.

Detalhe de cada um em `references/principios/INDEX.md`.

## Leitura progressiva

Leia só o necessário, nesta ordem:

1. **Este SKILL.md** (você está aqui).
2. **Um ponto de entrada:** `references/sintomas.md` se você parte de um problema ("texto demais", "não sei qual é a ação"), ou o `INDEX.md` do tipo se já sabe o que procura. Cada INDEX é um arquivo único: 2 ou 3 linhas por item, com o que é, onde usar e o link.
3. **O arquivo do item**, só quando precisar do detalhe: definição, quando usar, anti-padrão, antes e depois em ASCII, microcopy, prompt pronto, fonte e ligações para itens vizinhos.

Não abra os 52 itens de uma vez: o índice basta para escolher.

## Como trabalhar

| Pedido | Leia |
|---|---|
| Tela nova ou refeita (sempre primeiro) | `workflows/00-planejar-blocos.md`, `references/catalogo-de-blocos.md`, `references/wireframe-ascii.md` |
| "Revise/enxugue esta tela" (fluxo completo) | `workflows/01-auditar-tela.md` e siga em ordem até o 05 |
| Partir de um problema visto na tela | `references/sintomas.md` |
| Escolher uma técnica | `references/tecnicas/INDEX.md` |
| Justificar com uma lei de UX | `references/leis/INDEX.md` |
| Rever a postura antes de decidir | `references/principios/INDEX.md` |
| Só medir o excesso de texto | `workflows/02-listar-excesso-de-texto.md` e `scripts/contar-palavras.mjs` |
| Aplicar técnicas no código | `workflows/03-aplicar-tecnicas.md` e `references/anti-slop.md` |
| Reescrever textos | `workflows/04-reescrever-microcopy.md` e `references/tone-matrix.md` |
| Validar o resultado | `workflows/05-qa-visual.md`, `references/checklist.md`, `references/anti-slop.md` |
| Desenhar um fluxo, estado ou arquitetura | `references/diagramas.md` (ASCII por padrão, Mermaid raramente) |
| Acrescentar princípio, lei, técnica ou livro | `workflows/06-acrescentar-ao-guia.md` |
| Citar uma fonte | `references/livros.md` |
| Aprender ou mostrar ao dono, com antes e depois visuais | `references/guia.html` no navegador (busca e filtros) |

Regra que mais se perde: **o visual aprovado no wireframe faz parte da aprovação.** "Menos texto" corta texto, nunca remove gradiente, selo ou cor aprovados, e "polir" não acrescenta brilho, sombra nem ✨ (`references/anti-slop.md`).

## Adaptador do projeto

Antes de mexer numa tela, procure o adaptador, nesta ordem:

1. `docs/design/ui-acao/README.md` (convenção desta skill);
2. a seção de UI do `AGENTS.md` ou `CLAUDE.md`, que pode apontar para outro caminho.

O adaptador traz: o mapa **técnica → componente** do design system da casa, o glossário, as regras de microcopy, a QA visual e onde ficam os wireframes aprovados. Se existir, ele vence esta skill nos detalhes do projeto. Se não existir, siga só esta skill e use os componentes que o projeto já tem; nunca invente um design system novo.

Para criar um adaptador num projeto novo, copie `references/adaptador-modelo.md` para `docs/design/ui-acao/README.md` e preencha.

## Scripts

Node 18+ ou Bun, sem dependências. `--ajuda` mostra o uso completo.

| Script | Para quê | Exemplo |
|---|---|---|
| `scripts/contar-palavras.mjs` | Palavras visíveis por bloco contra o orçamento (HTML com `data-bloco`, JSON de `innerText` do E2E ou texto) | `node scripts/contar-palavras.mjs tela.html --orcamento orc.json --estrito` |
| `scripts/checar-capturas.mjs` | Capturas mais velhas que o último commit de UI ou faltando na matriz larguras × temas | `node scripts/checar-capturas.mjs <pasta> --ui src/app --estrito` |
| `scripts/wireframe-ascii.mjs` | Esqueleto ASCII em 390 e 1280 a partir de uma lista de blocos | `node scripts/wireframe-ascii.mjs tela.json` |
| `scripts/gerar-guia.mjs` | Regrava o guia visual a partir dos .md (`--verificar` só confere) | `node scripts/gerar-guia.mjs` |
| `scripts/checar-links.mjs` | Links relativos quebrados nos .md da skill | `node scripts/checar-links.mjs` |

## Com a impeccable

Se `~/.claude/skills/impeccable` (ou `.agents/skills/impeccable`) existir, use os comandos dela como motor de cada passo e esta skill como a régua do que cortar e do tom: `distill` no passo 03, `clarify` no 04, `critique` no 05. Se não existir, não bloqueie: os workflows desta skill bastam.

## Saídas esperadas

Devolva tabelas curtas, não prosa: bloco, veredito, técnica (com link para o item), antes e depois. O dono revisa por tabela e por print. Sempre que aprender algo novo e útil sobre UI orientada a ação, acrescente ao guia (`workflows/06-acrescentar-ao-guia.md`).
