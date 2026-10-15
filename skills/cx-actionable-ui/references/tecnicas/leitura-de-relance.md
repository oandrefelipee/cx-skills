---
id: t-03
pt: Leitura de relance
en: Glanceability
ctx: [Operação, Configuração]
fontes: [few, nng]
destaque: true
---

# Leitura de relance

*Glanceability* · Técnica

## Definição

Entender o estado em 1-2 segundos, sem ler.

## Quando usar

KPIs, status de integração, cabeçalho de entidade.

**Exemplo:** Domínio com selos `DNS ✓` e `HTTPS ✕` lado a lado.

## Anti-padrão

Estado dito só em prosa; número sem contexto.

## Antes → depois

```text
Antes
+--------------------------------------+
| Domínio loja.exemplo.com             |
| DNS OK · HTTPS falhou · verificado   |
| há 2 min                             |
+--------------------------------------+
Depois
+--------------------------------------+
| Domínio loja.exemplo.com             |
| (● DNS ✓)[verde] (● HTTPS ✕)[verm.]  |
| verificado há 2 min                  |
| [■ Verificar de novo]                |
+--------------------------------------+
```

## Microcopy

- Antes: "DNS OK · HTTPS falhou · verificado há 2 min"
- Depois: "DNS ✓ · HTTPS ✕ · Verificar de novo"

## Prompt

> Faça esta seção passar no teste de 2 segundos: estado e número principal sem ler texto.

## Fonte

- Stephen Few, *Information Dashboard Design: Displaying Data for At-a-Glance Monitoring*. 2ª ed., 2013, Analytics Press (1ª ed. 2006, O'Reilly).
- Nielsen Norman Group, *Artigos e relatórios de UX (NN/g)*. guia online, atualizado continuamente.

## Ligações

- [Selo de status](selo-de-status.md): estado em uma palavra.
- [Cartão de KPI com variação](kpi-com-variacao.md): número com contexto.
- [Estado e ação antes de explicação](../principios/estado-e-acao-antes-de-explicacao.md): estado primeiro.
- [Dados primeiro](../principios/dados-primeiro.md): dado antes de enfeite.

<!-- guia:antes <div class="ln">DNS OK · HTTPS falhou · verificado há 2 min</div> -->
<!-- guia:depois <div class="ln"><span class="bd ok">DNS ✓</span> <span class="bd er">HTTPS ✕</span> <span class="bt">Verificar de novo</span></div><div class="ln"><span class="mu">verificado há 2 min</span></div> -->
