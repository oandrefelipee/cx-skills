---
id: p-nao-pensar
pt: Não me faça pensar
en: Don't make me think
ctx: [Operação, Momento humano]
fontes: [krug, norman]
destaque: false
---

# Não me faça pensar

*Don't make me think* · Princípio

## Definição

A tela deve ser autoevidente: a pessoa entende o que é, onde está e o que fazer sem parar para decifrar. Cada ponto de dúvida é um custo.

## Quando usar

Navegação, rótulos, ações, qualquer ponto de decisão.

**Exemplo:** Saldo zerado ao lado do botão `Comprar créditos`: não há o que interpretar.

## Anti-padrão

Rótulos criativos, ícones sem texto, termos internos que a pessoa nunca viu.

## Antes → depois

```text
Antes
+--------------------------------------+
| Saldo: 0  {ícone: engrenagem}        |
| (clique no ícone para ver as         |
| opções de recarga)                   |
+--------------------------------------+
Depois
+--------------------------------------+
| Saldo: 0 créditos                    |
| [■ Comprar créditos]                 |
+--------------------------------------+
```

## Microcopy

- Antes: "Saldo: 0 (clique no ícone para ver as opções de recarga)"
- Depois: "Saldo: 0 créditos · Comprar créditos"

## Prompt

> Passe no teste do 'não me faça pensar': cada rótulo e ação se explica sozinho.

## Fonte

- Steve Krug, *Don't Make Me Think, Revisited: A Common Sense Approach to Web (and Mobile) Usability*. 3ª ed., 2014, New Riders (1ª ed. 2000).
- Don Norman, *The Design of Everyday Things (Revised and Expanded Edition)*. 2013, Basic Books (1ª ed. 1988, como The Psychology of Everyday Things).

## Ligações

- [Linguagem simples](../tecnicas/linguagem-simples.md): palavras claras.
- [Verbos nos botões](../tecnicas/verbos-nos-botoes.md): rótulo direto.
- [Um termo por conceito](../tecnicas/um-termo-por-conceito.md): sem sinônimos.
- [Lei de Jakob](../leis/lei-de-jakob.md): convenção.

<!-- guia:antes <div class="ln">Saldo: 0 <span class="tiny">⚙</span> <span class="mu">(clique no ícone para ver as opções de recarga)</span></div> -->
<!-- guia:depois <div class="ln">Saldo: 0 créditos <span class="bt p">Comprar créditos</span></div> -->
