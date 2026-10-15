---
id: l-miller
pt: Lei de Miller
en: Miller's Law
ctx: [Operação]
fontes: [yablonski, weinschenk]
destaque: false
---

# Lei de Miller

*Miller's Law* · Lei

## Definição

A memória de trabalho segura poucos itens ao mesmo tempo (cerca de 7, e menos sob pressão). O ponto prático é agrupar em blocos, não limitar a tela a 7.

## Quando usar

Painéis com muitas métricas, menus, formulários longos.

**Exemplo:** Doze métricas em 3 grupos com título curto: Entrega, Prazo, Contato.

## Anti-padrão

Doze métricas iguais numa fila só.

## Antes → depois

```text
Antes
+--------------------------------------+
| Métricas                             |
| A  B  C  D  E  F  G  H  I  J  K  L   |
+--------------------------------------+
Depois
+--------------------------------------+
| Entrega        A  B  C               |
| Prazo           D  E  F              |
| Contato         G  H  I              |
| Mais ▾          J  K  L              |
+--------------------------------------+
```

## Microcopy

- Antes: "Taxa A · B · C · D · E · F · G · H · I · J · K · L"
- Depois: "Entrega · Prazo · Contato"

## Prompt

> Agrupe em blocos de até 5-7 itens, cada um com título curto (chunking).

## Fonte

- Jon Yablonski, *Laws of UX: Using Psychology to Design Better Products & Services*. 2ª ed., 2024, O'Reilly (1ª ed. 2020).
- Susan M. Weinschenk, *100 Things Every Designer Needs to Know About People*. 2ª ed., 2020, New Riders (1ª ed. 2011).

## Ligações

- [Miller na prática](../tecnicas/miller-na-pratica.md): aplicar.
- [Lei de Hick](lei-de-hick.md): menos escolhas.
- [Lei da proximidade](lei-da-proximidade.md): blocos.
- [Agrupar com espaço](../tecnicas/agrupar-com-espaco.md): separação.

<!-- guia:antes <div class="ln">Taxa A · B · C · D · E · F · G · H · I · J · K · L</div> -->
<!-- guia:depois <div class="ln"><b>Entrega</b> A · B · C</div><div class="ln"><b>Prazo</b> D · E · F</div><div class="ln"><b>Contato</b> G · H · I</div> -->
