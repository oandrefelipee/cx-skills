---
id: t-13
pt: Selo de status
en: Status badge
ctx: [Operação, Erro ou risco]
fontes: [polaris, material]
destaque: true
---

# Selo de status

*Status badge* · Técnica

## Definição

1-2 palavras, no passado ou estado, com tom fixo por status.

## Quando usar

Tabelas, cabeçalhos de entidade.

**Exemplo:** `Conectado`, `Pausado`, `Entregue`, `Sem créditos`.

## Anti-padrão

Selo com frase; cores diferentes para o mesmo status.

## Antes → depois

```text
Antes
+--------------------------------------+
| Esta entrega foi concluída com       |
| sucesso (verde)                      |
| Esta entrega foi finalizada (azul)   |
+--------------------------------------+
Depois
+--------------------------------------+
| (● Entregue)[verde]                  |
| (● Pausado)[âmbar]                   |
| (● Sem créditos)[vermelho]           |
+--------------------------------------+
```

## Microcopy

- Antes: "Esta entrega foi concluída com sucesso"
- Depois: "Entregue · Pausado · Sem créditos"

## Prompt

> Padronize os selos: 1-2 palavras (Entregue, Pausado), tom fixo por status.

## Fonte

- Shopify, *Polaris, guia de conteúdo (Content)*. guia online, atualizado continuamente.
- Google, *Material Design 3*. guia online, atualizado continuamente.

## Ligações

- [Leitura de relance](leitura-de-relance.md): estado rápido.
- [Um termo por conceito](um-termo-por-conceito.md): mesmo nome, mesmo tom.
- [Lei da similaridade](../leis/lei-da-similaridade.md): aparência igual, sentido igual.
- [Sinalizadores](sinalizadores.md): cor e ícone.

<!-- guia:antes <div class="ln">Esta entrega foi concluída com sucesso</div> -->
<!-- guia:depois <div class="ln"><span class="bd ok">Entregue</span> <span class="bd wa">Pausado</span> <span class="bd er">Sem créditos</span></div> -->
