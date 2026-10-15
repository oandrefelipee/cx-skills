---
id: t-26
pt: Razão dados–tinta
en: Data-ink ratio
ctx: [Operação]
fontes: [tufte, few]
destaque: false
---

# Razão dados–tinta

*Data-ink ratio* · Técnica

## Definição

Maximize a parte da tinta que representa dados e apague o resto: grade pesada, bordas, sombras, decorações.

## Quando usar

Gráficos, tabelas e painéis.

**Exemplo:** Tabela só com linhas horizontais leves; gráfico sem grade, valores no fim da barra.

## Anti-padrão

Gráfico 3D com borda grossa e legenda distante.

## Antes → depois

```text
Antes
+--------------------------------------+
| +----------------------------+       |
| | Série 1 [██████████      ] |       |
| +----------------------------+       |
| ■ Série 1                            |
+--------------------------------------+
Depois
+--------------------------------------+
| Abril  [██████████       ]  70       |
+--------------------------------------+
```

## Microcopy

- Antes: "Série 1 (legenda distante, borda e grade pesadas)"
- Depois: "Abril 70 (valor no fim da barra, sem borda)"

## Prompt

> Aplique a razão dados-tinta: remova grade, bordas e legenda solta; rotule direto no gráfico.

## Fonte

- Edward R. Tufte, *The Visual Display of Quantitative Information*. 2ª ed., 2001, Graphics Press (1ª ed. 1983).
- Stephen Few, *Information Dashboard Design: Displaying Data for At-a-Glance Monitoring*. 2ª ed., 2013, Analytics Press (1ª ed. 2006, O'Reilly).

## Ligações

- [Dados primeiro](../principios/dados-primeiro.md): mesmo espírito.
- [Leitura de relance](leitura-de-relance.md): ler rápido.
- [Números alinhados](numeros-alinhados.md): tabelas limpas.
- [KPI com variação](kpi-com-variacao.md): dado em destaque.

<!-- guia:antes <div style="border:2px solid var(--text);padding:6px"><div class="bar" style="height:12px;border:2px solid var(--text)"><i style="width:70%"></i></div><div class="mu m">■ Série 1</div></div> -->
<!-- guia:depois <div class="ln">Abril <b>70</b></div><div class="bar"><i style="width:70%"></i></div> -->
