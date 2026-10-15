---
id: l-proximity
pt: Lei da proximidade (Gestalt)
en: Law of Proximity (Gestalt)
ctx: [Operação, Configuração]
fontes: [yablonski, few, refui]
destaque: false
---

# Lei da proximidade (Gestalt)

*Law of Proximity (Gestalt)* · Lei

## Definição

Itens próximos são percebidos como um grupo. Espaço entre grupos separa; espaço dentro do grupo une.

## Quando usar

Formulários, cartões, painéis, listas de configurações.

**Exemplo:** Campos de endereço juntos, com mais espaço antes do bloco de pagamento.

## Anti-padrão

Espaçamento igual entre tudo, sem sinal de grupo.

## Antes → depois

```text
Antes
+--------------------------------------+
| Nome    [__________]                 |
| Rua     [__________]                 |
| Cartão  [__________]                 |
| CVV     [____]                       |
+--------------------------------------+
Depois
+--------------------------------------+
| Entrega                              |
| Nome    [__________]                 |
| Rua     [__________]                 |
|                                      |
| Pagamento                            |
| Cartão  [__________]                 |
| CVV     [____]                       |
+--------------------------------------+
```

## Microcopy

- Antes: "Nome · Rua · Cartão · CVV (sem grupos)"
- Depois: "Entrega · Pagamento"

## Prompt

> Agrupe por proximidade: espaço curto dentro do grupo, espaço largo entre grupos.

## Fonte

- Jon Yablonski, *Laws of UX: Using Psychology to Design Better Products & Services*. 2ª ed., 2024, O'Reilly (1ª ed. 2020).
- Stephen Few, *Information Dashboard Design: Displaying Data for At-a-Glance Monitoring*. 2ª ed., 2013, Analytics Press (1ª ed. 2006, O'Reilly).
- Adam Wathan e Steve Schoger, *Refactoring UI*. 2018, publicação independente.

## Ligações

- [Agrupar com espaço](../tecnicas/agrupar-com-espaco.md): aplicar.
- [Lei de Miller](lei-de-miller.md): blocos.
- [Lei da similaridade](lei-da-similaridade.md): par gestalt.
- [Hierarquia visual](../tecnicas/hierarquia-visual.md): estrutura.

<!-- guia:antes <div class="ln">Nome</div><div class="ln">Rua</div><div class="ln">Cartão</div><div class="ln">CVV</div> -->
<!-- guia:depois <div class="ln">Nome</div><div class="ln" style="margin-top:14px">Rua</div><div class="ln" style="margin-top:14px">Cartão</div><div class="ln">CVV</div> -->
