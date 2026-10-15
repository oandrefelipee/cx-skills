---
id: t-06
pt: Lei de Fitts
en: Fitts's Law
ctx: [Operação]
fontes: [yablonski, hig, material]
destaque: false
---

# Lei de Fitts

*Fitts's Law* · Técnica

## Definição

Alvos maiores e mais próximos são mais rápidos de acertar.

## Quando usar

Ação frequente, principalmente no celular.

**Exemplo:** Botão `Comprar créditos` com 44 px de altura ao lado do saldo.

## Anti-padrão

Ação frequente em ícone minúsculo, longe do dado.

## Antes → depois

```text
Antes
+--------------------------------------+
| Saldo: 0 créditos  +                 |
+--------------------------------------+
Depois
+--------------------------------------+
| Saldo: 0 créditos                    |
| [■ Comprar créditos]                 |
+--------------------------------------+
```
1. O botão tem 44 px de altura e fica junto do saldo.

## Microcopy

- Antes: "+" (ícone de 16 px, sem rótulo)
- Depois: "Comprar créditos"

## Prompt

> Aumente e aproxime a ação mais usada; alvo mínimo de 44 px no mobile.

## Fonte

- Jon Yablonski, *Laws of UX: Using Psychology to Design Better Products & Services*. 2ª ed., 2024, O'Reilly (1ª ed. 2020).
- Apple, *Human Interface Guidelines*. guia online, atualizado continuamente.
- Google, *Material Design 3*. guia online, atualizado continuamente.

## Ligações

- [Lei de Fitts](../leis/lei-de-fitts.md): a lei por trás.
- [Uma ação primária](../principios/uma-acao-primaria.md): destaque da ação.
- [Ações na linha e em lote](acoes-na-linha-e-em-lote.md): ação junto do dado.
- [Verbos nos botões](verbos-nos-botoes.md): rótulo claro.

<!-- guia:antes <div class="ln">Saldo: 0 créditos <span class='tiny'>+</span></div> -->
<!-- guia:depois <div class="ln">Saldo: 0 créditos <span class="bt p big">Comprar créditos</span></div> -->
