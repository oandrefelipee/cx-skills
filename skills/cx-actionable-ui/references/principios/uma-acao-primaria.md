---
id: p-uma-acao
pt: Uma ação primária por tela ou bloco
en: One primary action
ctx: [Operação, Momento humano]
fontes: [refui, material, cooper]
destaque: false
---

# Uma ação primária por tela ou bloco

*One primary action* · Princípio

## Definição

Cada tela ou bloco tem um caminho principal, visualmente mais forte. As demais ações ficam secundárias ou num menu.

## Quando usar

Barras de ação, cabeçalhos, modais, formulários.

**Exemplo:** Modal de pagamento: `Pagar` preenchido; `Voltar` como texto; `Cancelar pedido` dentro do menu ⋯.

## Anti-padrão

Três botões preenchidos lado a lado, todos pedindo atenção.

## Antes → depois

```text
Antes
+--------------------------------------+
| [■ Pagar] [■ Salvar rascunho]        |
| [■ Cancelar pedido]                  |
+--------------------------------------+
Depois
+--------------------------------------+
| [■ Pagar]   [ Voltar ]   [⋯]         |
|             ⋯ → Cancelar pedido      |
+--------------------------------------+
```

## Microcopy

- Antes: "Pagar · Salvar rascunho · Cancelar pedido (todos em destaque)"
- Depois: "Pagar · Voltar · ⋯"

## Prompt

> Deixe uma ação primária neste bloco, 1-2 secundárias e o resto num menu.

## Fonte

- Adam Wathan e Steve Schoger, *Refactoring UI*. 2018, publicação independente.
- Google, *Material Design 3*. guia online, atualizado continuamente.
- Alan Cooper, Robert Reimann, David Cronin e Christopher Noessel, *About Face: The Essentials of Interaction Design*. 4ª ed., 2014, Wiley.

## Ligações

- [Hierarquia visual](../tecnicas/hierarquia-visual.md): peso.
- [Verbos nos botões](../tecnicas/verbos-nos-botoes.md): rótulo.
- [Ações na linha e em lote](../tecnicas/acoes-na-linha-e-em-lote.md): o resto no menu.
- [Lei de Hick](../leis/lei-de-hick.md): menos escolhas.

<!-- guia:antes <div class="ln"><span class="bt p">Pagar</span><span class="bt p">Salvar rascunho</span><span class="bt p">Cancelar pedido</span></div> -->
<!-- guia:depois <div class="ln"><span class="bt p">Pagar</span><span class="bt">Voltar</span><span class="bt">⋯</span></div> -->
