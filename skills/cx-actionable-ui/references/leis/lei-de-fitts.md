---
id: l-fitts
pt: Lei de Fitts
en: Fitts's Law
ctx: [Operação]
fontes: [yablonski, hig, material]
destaque: false
---

# Lei de Fitts

*Fitts's Law* · Lei

## Definição

O tempo para acertar um alvo depende da distância e do tamanho dele. Alvos maiores e mais próximos são mais fáceis.

## Quando usar

Ação frequente, mobile, barras de ação fixas.

**Exemplo:** Botão `Comprar créditos` com 44 px de altura ao lado do saldo. A Apple recomenda alvos de ao menos 44 pt; o Material, 48 dp.

## Anti-padrão

Ação frequente num ícone minúsculo, no canto oposto ao dado.

## Antes → depois

```text
Antes
+--------------------------------------+
| Saldo: 0 créditos              [+]   |
+--------------------------------------+
Depois
+--------------------------------------+
| Saldo: 0 créditos                    |
| [■ Comprar créditos]                 |
+--------------------------------------+
```

## Microcopy

- Antes: "+"
- Depois: "Comprar créditos"

## Prompt

> Aumente e aproxime a ação mais usada; alvo de toque mínimo de 44 px.

## Fonte

- Jon Yablonski, *Laws of UX: Using Psychology to Design Better Products & Services*. 2ª ed., 2024, O'Reilly (1ª ed. 2020).
- Apple, *Human Interface Guidelines*. guia online, atualizado continuamente.
- Google, *Material Design 3*. guia online, atualizado continuamente.

## Ligações

- [Fitts na prática](../tecnicas/fitts-na-pratica.md): aplicar.
- [Uma ação primária](../principios/uma-acao-primaria.md): alvo principal.
- [Ações na linha e em lote](../tecnicas/acoes-na-linha-e-em-lote.md): perto do dado.
- [Lei do esforço mínimo](lei-do-esforco-minimo.md): menos custo.

<!-- guia:antes <div class="ln">Saldo: 0 créditos <span class="tiny">+</span></div> -->
<!-- guia:depois <div class="ln">Saldo: 0 créditos <span class="bt p big">Comprar créditos</span></div> -->
