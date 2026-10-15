---
id: t-20
pt: Convenção, Tesler e Doherty
en: Jakob, Tesler & Doherty
ctx: [Operação]
fontes: [yablonski, nng]
destaque: false
---

# Convenção, Tesler e Doherty

*Jakob, Tesler & Doherty* · Técnica

## Definição

Convenção familiar; a complexidade só muda de lugar; feedback em até 400 ms.

## Quando usar

Padrões de lista, filtro e feedback.

**Exemplo:** Lista + busca + filtro, como em qualquer admin; feedback em até 400 ms.

## Anti-padrão

Inventar um padrão novo para uma ação comum.

## Antes → depois

```text
Antes
+--------------------------------------+
| Pedidos                              |
| Deslize para a esquerda com dois     |
| dedos para filtrar.                  |
|                                      |
| ···                                  |
+--------------------------------------+
Depois
+--------------------------------------+
| Pedidos                              |
| [Buscar pedido_________]             |
| [ Filtros ] [ Ordenar ]              |
| <código>  <cliente>  (● Em trânsito) |
| ···                                  |
+--------------------------------------+
```

## Microcopy

- Antes: "Deslize para a esquerda com dois dedos para filtrar"
- Depois: "Buscar pedido · Filtros · Ordenar"

## Prompt

> Use o padrão convencional de lista, filtro e busca; dê feedback em até 400 ms.

## Fonte

- Jon Yablonski, *Laws of UX: Using Psychology to Design Better Products & Services*. 2ª ed., 2024, O'Reilly (1ª ed. 2020).
- Nielsen Norman Group, *Artigos e relatórios de UX (NN/g)*. guia online, atualizado continuamente.

## Ligações

- [Lei de Jakob](../leis/lei-de-jakob.md): padrão conhecido.
- [Lei de Tesler](../leis/lei-de-tesler.md): complexidade muda de lugar.
- [Limiar de Doherty](../leis/limiar-de-doherty.md): 400 ms.
- [Esqueletos de carregamento](esqueletos-de-carregamento.md): feedback na carga.

<!-- guia:antes <div class="ln">Filtro por gestos secretos</div> -->
<!-- guia:depois <div class="ln"><span class='fld'>Buscar…</span> <span class="bt">Filtros</span> <span class="bt">Ordenar</span></div> -->
