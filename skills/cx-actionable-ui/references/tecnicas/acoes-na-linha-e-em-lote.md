---
id: t-10
pt: Ações na linha e em lote
en: Inline & bulk actions
ctx: [Operação]
fontes: [tidwell, cooper]
destaque: true
---

# Ações na linha e em lote

*Inline & bulk actions* · Técnica

## Definição

Ação onde está o dado; seleção múltipla abre barra de ações.

## Quando usar

Listas de pedidos, integrações e domínios.

**Exemplo:** Linha de pedido com `Reenviar`; ao marcar 3, a barra `3 selecionados · Arquivar`.

## Anti-padrão

Ir a outra página para uma ação simples.

## Antes → depois

```text
Antes
+--------------------------------------+
| Pedido #1042   (● Atrasado)[âmbar]   |
| Abrir detalhe → menu → Reenviar      |
+--------------------------------------+
Depois
+--------------------------------------+
| [x] #1042  (● Atrasado)  [ Reenviar ]|
| [x] #1043  (● Atrasado)  [ Reenviar ]|
| [x] #1044  (● Pausado)   [ Reenviar ]|
| 3 selecionados  [■ Arquivar]         |
+--------------------------------------+
```

## Microcopy

- Antes: "Abrir o pedido, abrir o menu e escolher Reenviar"
- Depois: "Reenviar · 3 selecionados · Arquivar"

## Prompt

> Mova ações frequentes para a linha e adicione barra de ações em lote ao selecionar.

## Fonte

- Jenifer Tidwell, Charles Brewer e Aynne Valencia, *Designing Interfaces: Patterns for Effective Interaction Design*. 3ª ed., 2020, O'Reilly.
- Alan Cooper, Robert Reimann, David Cronin e Christopher Noessel, *About Face: The Essentials of Interaction Design*. 4ª ed., 2014, Wiley.

## Ligações

- [Lei de Fitts](../leis/lei-de-fitts.md): ação perto do dado.
- [Lei de Tesler](../leis/lei-de-tesler.md): menos passos.
- [Desfazer em vez de confirmar](desfazer-em-vez-de-confirmar.md): lote sem medo.
- [Selo de status](selo-de-status.md): estado na linha.

<!-- guia:antes <div class="ln">Pedido #1042 → abrir detalhe → menu → Reenviar</div> -->
<!-- guia:depois <div class="ln">Pedido #1042 <span class="bd wa">Atrasado</span> <span class="bt">Reenviar</span></div><div class="ln"><span class="mu">3 selecionados · </span><span class="bt">Arquivar</span></div> -->
