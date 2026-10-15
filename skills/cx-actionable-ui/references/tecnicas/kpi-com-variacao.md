---
id: t-14
pt: Cartão de KPI com variação
en: KPI card with delta
ctx: [Operação]
fontes: [few, tufte, polaris]
destaque: true
---

# Cartão de KPI com variação

*KPI card with delta* · Técnica

## Definição

Valor grande, rótulo curto, delta com sinal e período.

## Quando usar

Visão geral, créditos, pedidos, e-mails.

**Exemplo:** Pedidos: 128 · +12% vs 7 dias, com mini-tendência.

## Anti-padrão

Número sem comparação; descrição longa.

## Antes → depois

```text
Antes
+--------------------------------------+
| Total de Pedidos criados no período  |
| selecionado: 128                     |
+--------------------------------------+
Depois
+--------------------------------------+
| Pedidos                              |
| 128      ▲ +12% · 7 dias             |
| ···  mini-tendência  ···             |
+--------------------------------------+
```
1. ··· é a mini-tendência dos últimos 7 dias.

## Microcopy

- Antes: "Total de Pedidos criados no período selecionado: 128"
- Depois: "Pedidos · 128 · +12% vs 7 dias"

## Prompt

> Cada KPI: valor, rótulo de 1-3 palavras, delta com sinal e período, sem parágrafo.

## Fonte

- Stephen Few, *Information Dashboard Design: Displaying Data for At-a-Glance Monitoring*. 2ª ed., 2013, Analytics Press (1ª ed. 2006, O'Reilly).
- Edward R. Tufte, *The Visual Display of Quantitative Information*. 2ª ed., 2001, Graphics Press (1ª ed. 1983).
- Shopify, *Polaris, guia de conteúdo (Content)*. guia online, atualizado continuamente.

## Ligações

- [Leitura de relance](leitura-de-relance.md): número com contexto.
- [Razão dados–tinta](razao-dados-tinta.md): sem enfeite.
- [Números alinhados](numeros-alinhados.md): leitura de colunas.
- [Dados primeiro](../principios/dados-primeiro.md): dado antes de texto.

<!-- guia:antes <div class="ln">Total de Pedidos criados no período selecionado: 128</div> -->
<!-- guia:depois <div class="kpi"><span class="mu">Pedidos</span><b>128</b><span class="bd ok">+12% · 7 dias</span></div> -->
