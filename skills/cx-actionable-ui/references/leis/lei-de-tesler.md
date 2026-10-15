---
id: l-tesler
pt: Lei de Tesler (conservação da complexidade)
en: Tesler's Law (Conservation of Complexity)
ctx: [Operação, Configuração]
fontes: [yablonski, cooper]
destaque: false
---

# Lei de Tesler (conservação da complexidade)

*Tesler's Law (Conservation of Complexity)* · Lei

## Definição

Todo sistema tem uma complexidade irredutível: ou o produto a absorve ou a pessoa. Em geral, é melhor o produto absorver.

## Quando usar

Formulários, importações, configuração, qualquer entrada de dados.

**Exemplo:** O formulário detecta a bandeira do cartão pelo número, em vez de pedir que a pessoa a escolha.

## Anti-padrão

Pedir à pessoa dados que o sistema consegue deduzir.

## Antes → depois

```text
Antes
+--------------------------------------+
| Bandeira [▾ escolha]                 |
| Número  [4111 1111____]              |
+--------------------------------------+
Depois
+--------------------------------------+
| Número  [4111 1111____]  (● Visa)    |
+--------------------------------------+
```

## Microcopy

- Antes: "Bandeira do cartão: escolha uma opção"
- Depois: "Visa (detectada pelo número)"

## Prompt

> Mova a complexidade para o sistema: deduza, pré-preencha, detecte, em vez de perguntar.

## Fonte

- Jon Yablonski, *Laws of UX: Using Psychology to Design Better Products & Services*. 2ª ed., 2024, O'Reilly (1ª ed. 2020).
- Alan Cooper, Robert Reimann, David Cronin e Christopher Noessel, *About Face: The Essentials of Interaction Design*. 4ª ed., 2014, Wiley.

## Ligações

- [Padrões inteligentes](../tecnicas/padroes-inteligentes.md): deduzir.
- [Lei de Postel](lei-de-postel.md): aceitar variação.
- [Lei do esforço mínimo](lei-do-esforco-minimo.md): menos passos.
- [Validação em linha](../tecnicas/validacao-em-linha.md): confirmar.

<!-- guia:antes <div class="ln">Bandeira: <span class="fld">escolha…</span> Número: <span class="fld">4111…</span></div> -->
<!-- guia:depois <div class="ln">Número: <span class="fld">4111…</span> <span class="bd">Visa</span></div> -->
