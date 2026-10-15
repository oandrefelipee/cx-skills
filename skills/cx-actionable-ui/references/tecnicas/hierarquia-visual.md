---
id: t-23
pt: Hierarquia visual
en: Visual hierarchy
ctx: [Operação]
fontes: [refui, tidwell]
destaque: false
---

# Hierarquia visual

*Visual hierarchy* · Técnica

## Definição

Use tamanho, peso, cor e posição para dizer o que é primário, secundário e terciário. A atenção segue o contraste.

## Quando usar

Cabeçalhos de entidade, linhas de lista, cartões, formulários.

**Exemplo:** Pedido em negrito e maior, cliente e data em cinza, status em selo.

## Anti-padrão

Todas as linhas com o mesmo peso e cor.

## Antes → depois

```text
Antes
+--------------------------------------+
| Pedido 1042                          |
| Ana Souza                            |
| 12 jan                               |
| Entregue                             |
+--------------------------------------+
Depois
+--------------------------------------+
| Pedido 1042          (● Entregue)    |
| Ana Souza · 12 jan                   |
+--------------------------------------+
```
1. A primeira linha em negrito e maior; a segunda em cinza.

## Microcopy

- Antes: "Pedido 1042 / Ana Souza / 12 jan / Entregue"
- Depois: "Pedido 1042 · (Entregue) · Ana Souza, 12 jan"

## Prompt

> Estabeleça hierarquia: 1 elemento primário, apoio em cinza, estado em selo.

## Fonte

- Adam Wathan e Steve Schoger, *Refactoring UI*. 2018, publicação independente.
- Jenifer Tidwell, Charles Brewer e Aynne Valencia, *Designing Interfaces: Patterns for Effective Interaction Design*. 3ª ed., 2020, O'Reilly.

## Ligações

- [Efeito Von Restorff](../leis/efeito-von-restorff.md): o que se destaca.
- [Selo de status](selo-de-status.md): estado em selo.
- [Uma ação primária](../principios/uma-acao-primaria.md): foco.
- [Agrupar com espaço](agrupar-com-espaco.md): estrutura.

<!-- guia:antes <div class="ln">Pedido 1042</div><div class="ln">Ana Souza</div><div class="ln">12 jan</div><div class="ln">Entregue</div> -->
<!-- guia:depois <div class="ln"><b>Pedido 1042</b> <span class="bd ok">Entregue</span></div><div class="ln mu">Ana Souza · 12 jan</div> -->
