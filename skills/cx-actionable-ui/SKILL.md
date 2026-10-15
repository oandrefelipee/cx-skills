---
name: cx-actionable-ui
description: Torna uma tela de produto orientada a ação, com menos texto e mais clareza. Use sempre que o pedido for auditar, simplificar, enxugar, "tirar texto", "deixar mais direto/escaneável", melhorar microcopy, criar estado vazio, checklist de primeiro uso, cartões de KPI, selos de status, tooltips de ajuda, ou quando uma tela parecer um documento (parágrafos, fórmulas, explicações fixas) em vez de um painel. Cobre dashboards, admin, configurações, listas e onboarding, em qualquer stack. Use junto com a skill `impeccable` (comandos distill, clarify, critique) quando ela estiver instalada.
---

# UI orientada a ação

Uma tela de produto serve para decidir e agir, não para ser lida. Cada bloco de texto fixo tira atenção da ação. O objetivo é: a pessoa entende o estado em 2 segundos e vê a próxima ação sem ler um parágrafo.

Esta skill é genérica, sem nada de projeto. Cada projeto pluga as regras dele por um **adaptador**, que fica no próprio repositório (não é outra skill).

## Adaptador do projeto

Antes de mexer numa tela, procure o adaptador, nesta ordem:

1. `docs/design/ui-acao/README.md` (convenção desta skill);
2. a seção de UI do `AGENTS.md` ou `CLAUDE.md`, que pode apontar para outro caminho.

O adaptador traz: o mapa **técnica → componente** do design system da casa, o glossário, as regras de microcopy, a QA visual e onde ficam os wireframes aprovados. Se existir, ele vence esta skill nos detalhes do projeto. Se não existir, siga só esta skill e use os componentes que o projeto já tem; nunca invente um design system novo.

Para criar um adaptador num projeto novo, copie `references/adaptador-modelo.md` para `docs/design/ui-acao/README.md` e preencha.

## Princípios

1. **Estado e ação antes de explicação.** Mostre o estado (selo, número, ponto colorido) e o botão. A explicação só aparece sob demanda.
2. **Uma ação primária por tela ou bloco.** O resto é secundário ou vai para um menu.
3. **Divulgação progressiva, no máximo 2 níveis.** Fórmulas, "por quê" e detalhes técnicos vão para tooltip, popover ou área recolhível com gatilho claro (ícone ⓘ ou "Ver detalhes").
4. **A voz é constante, o tom varia por contexto.** Veja `references/tone-matrix.md`.
5. **Cortar não é esconder o que importa.** Se a informação muda a decisão, ela fica visível; se só explica, ela vai para ajuda contextual; se repete o título ou o vizinho, ela some.

## Como trabalhar

Escolha pelo pedido e leia só o arquivo necessário:

| Pedido | Leia |
|---|---|
| "Revise/enxugue esta tela" (fluxo completo) | `workflows/01-auditar-tela.md` e siga em ordem até o 05 |
| Só medir o excesso de texto | `workflows/02-listar-excesso-de-texto.md` |
| Escolher a técnica para um problema | `references/techniques.md` |
| Aplicar técnicas no código | `workflows/03-aplicar-tecnicas.md` |
| Reescrever textos | `workflows/04-reescrever-microcopy.md` e `references/tone-matrix.md` |
| Validar o resultado | `workflows/05-qa-visual.md` e `references/checklist.md` |
| Aprender, mostrar ou consultar com antes e depois | Abra `references/guia.html` no navegador (guia visual, com busca e filtros) |
| Acrescentar uma técnica, lei, princípio ou livro ao guia | `workflows/06-acrescentar-ao-guia.md` |
| Citar uma fonte (livro ou guia online) | `references/livros.md` |

## Guia visual vivo

`references/guia.html` é o guia ilustrado: 8 princípios, 14 leis de UX e 30 técnicas, cada um com definição, quando usar, exemplo, anti-padrão, mini mock de antes e depois, prompt de uma linha e etiqueta de fonte, mais a matriz de tom e a bibliografia (`references/livros.md`). Os dados vivem num bloco JSON no próprio HTML: para acrescentar um item, copie um objeto e preencha (veja `workflows/06-acrescentar-ao-guia.md`). Mostre o guia ao dono quando ele quiser aprender; cite a fonte de cada recomendação. Sempre que aprender algo novo e útil sobre UI orientada a ação, acrescente ao guia.

## Com a impeccable

Se `~/.claude/skills/impeccable` (ou `.agents/skills/impeccable`) existir, use os comandos dela como motor de cada passo e esta skill como a régua do que cortar e do tom:

- `distill` no passo 3 (remover complexidade, divulgação progressiva);
- `clarify` no passo 4 (reescrita de texto de interface);
- `critique` no passo 5 (revisão priorizada).

Se não existir, não bloqueie: siga os workflows desta skill, que já trazem o conteúdo necessário. Opcionalmente sugira instalar com `npx skills add pbakaus/impeccable` e leia o SKILL.md antes de instalar.

## Saídas esperadas

Sempre devolva tabelas curtas, não prosa: bloco, veredito, técnica, antes e depois. O dono revisa por tabela e por print.
