---
id: l-jakob
pt: Lei de Jakob
en: Jakob's Law
ctx: [Operação]
fontes: [yablonski, nng, norman]
destaque: false
---

# Lei de Jakob

*Jakob's Law* · Lei

## Definição

As pessoas passam a maior parte do tempo em outros produtos e esperam que o seu funcione do mesmo jeito. Convenção reduz o custo de aprender.

## Quando usar

Navegação, listas, filtros, carrinho, busca, login.

**Exemplo:** Lista com busca no topo, filtros e ordenação, como em qualquer admin.

## Anti-padrão

Reinventar o padrão de uma ação comum (filtro por gesto secreto).

## Antes → depois

```text
Antes
+--------------------------------------+
| Pedidos                              |
| Deslize com dois dedos para          |
| filtrar a lista.                     |
+--------------------------------------+
Depois
+--------------------------------------+
| Pedidos                              |
| [Buscar_____] [Filtros] [Ordenar]    |
+--------------------------------------+
```

## Microcopy

- Antes: "Deslize com dois dedos para filtrar"
- Depois: "Buscar · Filtros · Ordenar"

## Prompt

> Use o padrão convencional de lista, busca e filtro; só inove onde houver ganho claro.

## Fonte

- Jon Yablonski, *Laws of UX: Using Psychology to Design Better Products & Services*. 2ª ed., 2024, O'Reilly (1ª ed. 2020).
- Nielsen Norman Group, *Artigos e relatórios de UX (NN/g)*. guia online, atualizado continuamente.
- Don Norman, *The Design of Everyday Things (Revised and Expanded Edition)*. 2013, Basic Books (1ª ed. 1988, como The Psychology of Everyday Things).

## Ligações

- [Convenção, Tesler e Doherty](../tecnicas/convencao-tesler-doherty.md): aplicar.
- [Padrões inteligentes](../tecnicas/padroes-inteligentes.md): o esperado.
- [Não me faça pensar](../principios/nao-me-faca-pensar.md): autoevidente.
- [Reconhecimento em vez de memorização](../tecnicas/reconhecimento-em-vez-de-memorizacao.md): já conhecido.

<!-- guia:antes <div class="ln">Filtro por gestos secretos</div> -->
<!-- guia:depois <div class="ln"><span class="fld">Buscar…</span> <span class="bt">Filtros</span> <span class="bt">Ordenar</span></div> -->
