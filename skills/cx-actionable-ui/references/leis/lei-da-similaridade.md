---
id: l-similarity
pt: Lei da similaridade (Gestalt)
en: Law of Similarity (Gestalt)
ctx: [Operação, Configuração]
fontes: [yablonski, few]
destaque: false
---

# Lei da similaridade (Gestalt)

*Law of Similarity (Gestalt)* · Lei

## Definição

Elementos parecidos (cor, forma, tamanho) são lidos como relacionados. Aparência igual deve significar função igual.

## Quando usar

Botões, selos, links, cores de estado, ícones.

**Exemplo:** Todo selo de sucesso é verde e tem a mesma forma; todo link é sublinhado.

## Anti-padrão

Mesma cor para ação e para erro; link e texto indistintos.

## Antes → depois

```text
Antes
+--------------------------------------+
| (● Entregue)[verde]                  |
| (● Atrasado)[verde]                  |
| (● Concluído)[âmbar]                 |
+--------------------------------------+
Depois
+--------------------------------------+
| (● Entregue)[verde]                  |
| (● Atrasado)[vermelho]               |
| (● Concluído)[verde]                 |
+--------------------------------------+
```

## Microcopy

- Antes: "Atrasado (verde) · Concluído (âmbar)"
- Depois: "Atrasado (vermelho) · Concluído (verde)"

## Prompt

> Use o mesmo estilo para o mesmo significado e estilos diferentes para significados diferentes.

## Fonte

- Jon Yablonski, *Laws of UX: Using Psychology to Design Better Products & Services*. 2ª ed., 2024, O'Reilly (1ª ed. 2020).
- Stephen Few, *Information Dashboard Design: Displaying Data for At-a-Glance Monitoring*. 2ª ed., 2013, Analytics Press (1ª ed. 2006, O'Reilly).

## Ligações

- [Selo de status](../tecnicas/selo-de-status.md): cor e forma.
- [Sinalizadores](../tecnicas/sinalizadores.md): sinais.
- [Efeito Von Restorff](efeito-von-restorff.md): diferença.
- [Um termo por conceito](../tecnicas/um-termo-por-conceito.md): mesma ideia.

<!-- guia:antes <div class="ln"><span class="bd ok">Entregue</span> <span class="bd">Atrasado</span> <span class="bd wa">Concluído</span></div> -->
<!-- guia:depois <div class="ln"><span class="bd ok">Entregue</span> <span class="bd er">Atrasado</span> <span class="bd ok">Concluído</span></div> -->
