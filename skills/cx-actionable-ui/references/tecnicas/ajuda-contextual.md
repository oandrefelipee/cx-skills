---
id: t-16
pt: Ajuda contextual
en: Contextual help
ctx: [Operação, Configuração]
fontes: [nng, polaris]
destaque: true
---

# Ajuda contextual

*Contextual help* · Técnica

## Definição

Explicação curta ligada ao rótulo, em tooltip ou popover (ⓘ).

## Quando usar

Fórmulas, termos do domínio, campos técnicos.

**Exemplo:** Taxa de sucesso com ⓘ `Concluídos sem falha ÷ Total concluído`.

## Anti-padrão

Parágrafo de ajuda sob cada campo.

## Antes → depois

```text
Antes
+--------------------------------------+
| Taxa de sucesso: 72,5 %              |
| Calculada como o número de pedidos   |
| concluídos sem nenhuma falha dividido|
| pelo total de pedidos concluídos no  |
| período selecionado.                 |
+--------------------------------------+
Depois
+--------------------------------------+
| Taxa de sucesso ⓘ: 72,5 %            |
+--------------------------------------+
```
1. ⓘ: Concluídos sem falha ÷ Total concluído.

## Microcopy

- Antes: "Calculada como o número de pedidos concluídos sem nenhuma falha dividido pelo total de pedidos concluídos no período"
- Depois: "Concluídos sem falha ÷ Total concluído"

## Prompt

> Mova explicações para tooltip/popover de 1-2 linhas ligado ao rótulo.

## Fonte

- Nielsen Norman Group, *Artigos e relatórios de UX (NN/g)*. guia online, atualizado continuamente.
- Shopify, *Polaris, guia de conteúdo (Content)*. guia online, atualizado continuamente.

## Ligações

- [Divulgação em dois níveis](../principios/divulgacao-em-dois-niveis.md): ajuda sob demanda.
- [Pista de informação](pista-de-informacao.md): dica no ponto.
- [Estado e ação antes de explicação](../principios/estado-e-acao-antes-de-explicacao.md): ordem.
- [Mostrar, não explicar](mostrar-nao-explicar.md): alternativa.

<!-- guia:antes <div class="ln">Taxa de sucesso: 72,5 %</div><div class="ln"><div class="p">Calculada como o número de pedidos concluídos sem nenhuma falha dividido pelo total de pedidos concluídos no período…</div></div> -->
<!-- guia:depois <div class="ln">Taxa de sucesso <span class="i" title="ajuda">ⓘ</span>: <b>72,5 %</b></div><div class="ln"><span class="tip">Concluídos sem falha ÷ Total concluído</span></div> -->
