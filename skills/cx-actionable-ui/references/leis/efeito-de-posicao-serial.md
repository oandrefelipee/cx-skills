---
id: l-serial
pt: Efeito de posição serial
en: Serial Position Effect
ctx: [Operação]
fontes: [yablonski, weinschenk]
destaque: false
---

# Efeito de posição serial

*Serial Position Effect* · Lei

## Definição

Lembramos melhor o primeiro (primazia) e o último (recência) de uma lista. O meio se perde.

## Quando usar

Navegação, listas de ações, barra de abas, cardápios.

**Exemplo:** Ação mais usada no início da navegação; `Conta` (ou a ação final) no fim. O meio guarda o secundário.

## Anti-padrão

Esconder o item mais importante no meio de uma lista longa.

## Antes → depois

```text
Antes
+--------------------------------------+
| [Logs][Tema][Pedidos][API][Ajuda]    |
+--------------------------------------+
Depois
+--------------------------------------+
| [Pedidos][Logs][API][Tema][Conta]    |
+--------------------------------------+
```

## Microcopy

- Antes: "Logs · Tema · Pedidos · API · Ajuda"
- Depois: "Pedidos · Logs · API · Tema · Conta"

## Prompt

> Coloque os itens mais importantes no começo e no fim; o secundário no meio.

## Fonte

- Jon Yablonski, *Laws of UX: Using Psychology to Design Better Products & Services*. 2ª ed., 2024, O'Reilly (1ª ed. 2020).
- Susan M. Weinschenk, *100 Things Every Designer Needs to Know About People*. 2ª ed., 2020, New Riders (1ª ed. 2011).

## Ligações

- [Lei de Hick](lei-de-hick.md): menos itens.
- [Efeito Von Restorff](efeito-von-restorff.md): destaque.
- [Hierarquia visual](../tecnicas/hierarquia-visual.md): ordem.
- [Uma ação primária](../principios/uma-acao-primaria.md): começo forte.

<!-- guia:antes <div class="ln"><span class="bt">Logs</span><span class="bt">Tema</span><span class="bt">Pedidos</span><span class="bt">API</span><span class="bt">Ajuda</span></div> -->
<!-- guia:depois <div class="ln"><span class="bt p">Pedidos</span><span class="bt">Logs</span><span class="bt">API</span><span class="bt">Tema</span><span class="bt">Conta</span></div> -->
