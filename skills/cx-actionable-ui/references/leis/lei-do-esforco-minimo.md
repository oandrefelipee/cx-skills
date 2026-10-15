---
id: l-zipf
pt: Lei do esforço mínimo (Zipf)
en: Principle of Least Effort (Zipf)
ctx: [Operação, Momento humano]
fontes: [krug, weinschenk]
destaque: false
---

# Lei do esforço mínimo (Zipf)

*Principle of Least Effort (Zipf)* · Lei

## Definição

Pessoas tendem ao caminho de menor esforço para atingir o objetivo (George Zipf, 1949). Se a rota fácil não for a certa, usarão a errada.

## Quando usar

Fluxos principais, valores padrão, atalhos, caminhos de recuperação.

**Exemplo:** A ação mais comum é a pré-selecionada; o caminho raro exige um clique a mais.

## Anti-padrão

Tornar o caminho recomendado o mais trabalhoso.

## Antes → depois

```text
Antes
+--------------------------------------+
| Renovar plano   3 passos, 2 forms    |
| Cancelar plano  [ 1 clique ]         |
+--------------------------------------+
Depois
+--------------------------------------+
| [■ Renovar plano]                    |
| Outras opções ▾                      |
+--------------------------------------+
```

## Microcopy

- Antes: "Renovar plano (3 passos) · Cancelar plano (1 clique)"
- Depois: "Renovar plano · Outras opções"

## Prompt

> Deixe o caminho recomendado como o mais curto; aplique o menor número de passos.

## Fonte

- Steve Krug, *Don't Make Me Think, Revisited: A Common Sense Approach to Web (and Mobile) Usability*. 3ª ed., 2014, New Riders (1ª ed. 2000).
- Susan M. Weinschenk, *100 Things Every Designer Needs to Know About People*. 2ª ed., 2020, New Riders (1ª ed. 2011).

## Ligações

- [Padrões inteligentes](../tecnicas/padroes-inteligentes.md): padrão certo.
- [Lei de Tesler](lei-de-tesler.md): quem absorve.
- [Uma ação primária](../principios/uma-acao-primaria.md): caminho claro.
- [Desfazer em vez de confirmar](../tecnicas/desfazer-em-vez-de-confirmar.md): sem atrito.

<!-- guia:antes <div class="ln">Renovar plano (3 passos, 2 formulários)</div><div class="ln">Cancelar plano <span class="bt">1 clique</span></div> -->
<!-- guia:depois <div class="ln">Renovar plano <span class="bt p">1 clique</span></div><div class="ln mu">Outras opções</div> -->
