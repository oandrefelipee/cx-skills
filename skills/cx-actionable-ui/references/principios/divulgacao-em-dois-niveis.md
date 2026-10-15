---
id: p-2-niveis
pt: Divulgação progressiva em no máximo 2 níveis
en: Progressive disclosure, at most two levels
ctx: [Configuração, Operação]
fontes: [nng, tidwell, polaris]
destaque: false
---

# Divulgação progressiva em no máximo 2 níveis

*Progressive disclosure, at most two levels* · Princípio

## Definição

O essencial fica à vista; o detalhe abre sob demanda, no máximo duas camadas (por exemplo, tela e popover). A partir de três, a pessoa se perde.

## Quando usar

Fórmulas, regras, detalhes técnicos, configurações avançadas.

**Exemplo:** Rótulo `Taxa de entrega ⓘ`; a fórmula aparece no tooltip, sem outro clique.

## Anti-padrão

Menu recolhível dentro de menu recolhível dentro de modal.

## Antes → depois

```text
Antes
+--------------------------------------+
| Taxa de entrega: 94%                 |
| Calculada como entregues no prazo    |
| ÷ total finalizado no período,       |
| sem cancelamentos, filtrando…        |
+--------------------------------------+
Depois
+--------------------------------------+
| Taxa de entrega ⓘ             94%    |
+--------------------------------------+
```

1. ⓘ: Entregues no prazo ÷ finalizados.

## Microcopy

- Antes: "Calculada como pedidos entregues no prazo dividido pelo total finalizado…"
- Depois: "Taxa de entrega ⓘ  94%"

## Prompt

> Limite a divulgação a 2 níveis: valor à vista, regra no ⓘ.

## Fonte

- Nielsen Norman Group, *Artigos e relatórios de UX (NN/g)*. guia online, atualizado continuamente.
- Jenifer Tidwell, Charles Brewer e Aynne Valencia, *Designing Interfaces: Patterns for Effective Interaction Design*. 3ª ed., 2020, O'Reilly.
- Shopify, *Polaris, guia de conteúdo (Content)*. guia online, atualizado continuamente.

## Ligações

- [Divulgação progressiva](../tecnicas/divulgacao-progressiva.md): a técnica.
- [Ajuda contextual](../tecnicas/ajuda-contextual.md): o segundo nível.
- [Cortar não é esconder](cortar-nao-e-esconder.md): o que fica.
- [Lei de Hick](../leis/lei-de-hick.md): menos à vista.

<!-- guia:antes <div class="ln">Taxa de entrega: 94 %</div><div class="p">Calculada como pedidos entregues no prazo dividido pelo total de pedidos finalizados no período selecionado, excluindo cancelamentos…</div> -->
<!-- guia:depois <div class="ln">Taxa de entrega <span class="i">ⓘ</span>: <b>94 %</b></div><div class="ln"><span class="tip">Entregues no prazo ÷ finalizados</span></div> -->
