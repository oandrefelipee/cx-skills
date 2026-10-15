---
id: t-28
pt: Números alinhados e formatados
en: Numbers that align
ctx: [Operação]
fontes: [few, tufte, refui]
destaque: false
---

# Números alinhados e formatados

*Numbers that align* · Técnica

## Definição

Alinhe números à direita, com casas fixas e separadores do idioma, e fonte de algarismos tabulares. Comparar fica imediato.

## Quando usar

Tabelas financeiras, KPIs, extratos.

**Exemplo:** `R$ 1.234,50` / `R$ 98,46` / `R$ 7,00`, alinhados pela vírgula.

## Anti-padrão

Números alinhados à esquerda, com casas diferentes.

## Antes → depois

```text
Antes
+--------------------------------------+
| R$ 1234.5                            |
| R$ 98,456                            |
| R$ 7                                 |
+--------------------------------------+
Depois
+--------------------------------------+
|    R$ 1.234,50                       |
|       R$ 98,46                       |
|        R$ 7,00                       |
+--------------------------------------+
```

## Microcopy

- Antes: "R$ 1234.5 / R$ 98,456 / R$ 7"
- Depois: "R$ 1.234,50 / R$ 98,46 / R$ 7,00"

## Prompt

> Alinhe números à direita, com casas fixas, separadores pt-BR e algarismos tabulares.

## Fonte

- Stephen Few, *Information Dashboard Design: Displaying Data for At-a-Glance Monitoring*. 2ª ed., 2013, Analytics Press (1ª ed. 2006, O'Reilly).
- Edward R. Tufte, *The Visual Display of Quantitative Information*. 2ª ed., 2001, Graphics Press (1ª ed. 1983).
- Adam Wathan e Steve Schoger, *Refactoring UI*. 2018, publicação independente.

## Ligações

- [KPI com variação](kpi-com-variacao.md): números de destaque.
- [Razão dados–tinta](razao-dados-tinta.md): tabela limpa.
- [Escaneabilidade](escaneabilidade.md): comparar rápido.
- [Ações na linha e em lote](acoes-na-linha-e-em-lote.md): listas.

<!-- guia:antes <div class="ln">R$ 1234.5</div><div class="ln">R$ 98,456</div><div class="ln">R$ 7</div> -->
<!-- guia:depois <div style="max-width:110px;text-align:right;font-variant-numeric:tabular-nums"><div class="ln">R$ 1.234,50</div><div class="ln">R$ 98,46</div><div class="ln">R$ 7,00</div></div> -->
