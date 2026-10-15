---
id: p-dados-primeiro
pt: Dados primeiro, enfeite por último
en: Data first, ornament last
ctx: [Operação]
fontes: [tufte, few]
destaque: false
---

# Dados primeiro, enfeite por último

*Data first, ornament last* · Princípio

## Definição

Em tabelas, gráficos e painéis, cada pixel deve servir ao dado. Bordas, grades, sombras e legendas que não informam só competem com os números.

## Quando usar

Painéis, relatórios, tabelas e gráficos.

**Exemplo:** Barras sem borda, rotuladas no próprio fim (`Ana 62`), sem legenda separada.

## Anti-padrão

Gráfico 3D, grade pesada, legenda distante e cores sem significado.

## Antes → depois

```text
Antes
+--------------------------------------+
| Vendas da equipe          [3D]       |
| Ana  [██████████████    ]            |
| Bia  [█████████         ]            |
| Legenda: █ vendas (R$ mil)           |
+--------------------------------------+
Depois
+--------------------------------------+
| Vendas da equipe (R$ mil)            |
| Ana ██████████████ 62                |
| Bia █████████ 40                     |
+--------------------------------------+
```

## Microcopy

- Antes: "Legenda: barra azul = vendas, em milhares de reais"
- Depois: "Ana 62 · Bia 40"

## Prompt

> Remova o que não carrega dado: bordas, grade, legenda solta. Rotule direto nas barras.

## Fonte

- Edward R. Tufte, *The Visual Display of Quantitative Information*. 2ª ed., 2001, Graphics Press (1ª ed. 1983).
- Stephen Few, *Information Dashboard Design: Displaying Data for At-a-Glance Monitoring*. 2ª ed., 2013, Analytics Press (1ª ed. 2006, O'Reilly).

## Ligações

- [Razão dados–tinta](../tecnicas/razao-dados-tinta.md): menos enfeite.
- [Números alinhados e formatados](../tecnicas/numeros-alinhados.md): leitura.
- [Leitura de relance](../tecnicas/leitura-de-relance.md): rótulo direto.
- [Cartão de KPI com variação](../tecnicas/kpi-com-variacao.md): dado em foco.

<!-- guia:antes <div style="border:2px solid var(--text);padding:6px;border-radius:2px"><div class="bar" style="height:12px;border:2px solid var(--text)"><i style="width:62%"></i></div><div class="bar" style="height:12px;border:2px solid var(--text)"><i style="width:40%"></i></div><div class="mu m">■ Série 1 &nbsp; ■ Série 2</div></div> -->
<!-- guia:depois <div class="ln">Ana <b>62</b></div><div class="bar"><i style="width:62%"></i></div><div class="ln">Bia <b>40</b></div><div class="bar"><i style="width:40%"></i></div> -->
