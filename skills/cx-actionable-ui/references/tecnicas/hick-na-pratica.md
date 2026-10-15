---
id: t-05
pt: Lei de Hick
en: Hick's Law
ctx: [Operação]
fontes: [yablonski, nng]
destaque: true
---

# Lei de Hick

*Hick's Law* · Técnica

## Definição

Quanto mais escolhas, mais tempo para decidir.

## Quando usar

Barras de ação, menus, cabeçalhos.

**Exemplo:** 1 ação primária, 1 secundária e o resto no menu ⋯.

## Anti-padrão

Seis botões de peso igual lado a lado.

## Antes → depois

```text
Antes
+--------------------------------------+
| Pedidos                              |
| [Exportar][Filtrar][Importar]        |
| [Arquivar][Duplicar][Excluir]        |
+--------------------------------------+
Depois
+--------------------------------------+
| Pedidos                              |
| [■ Exportar] [ Filtrar ] [⋯]         |
+--------------------------------------+
```
1. [⋯] abre Importar, Arquivar, Duplicar e Excluir.

## Microcopy

- Antes: "Exportar · Filtrar · Importar · Arquivar · Duplicar · Excluir"
- Depois: "Exportar · Filtrar · Mais ações (⋯)"

## Prompt

> Reduza as escolhas: 1 primária, 1-2 secundárias, o resto em menu.

## Fonte

- Jon Yablonski, *Laws of UX: Using Psychology to Design Better Products & Services*. 2ª ed., 2024, O'Reilly (1ª ed. 2020).
- Nielsen Norman Group, *Artigos e relatórios de UX (NN/g)*. guia online, atualizado continuamente.

## Ligações

- [Lei de Hick](../leis/lei-de-hick.md): a lei por trás.
- [Uma ação primária](../principios/uma-acao-primaria.md): foco.
- [Lei de Miller](../leis/lei-de-miller.md): agrupar o resto.
- [Divulgação progressiva](divulgacao-progressiva.md): menu ⋯.

<!-- guia:antes <div class="ln"><span class="bt">Exportar</span><span class="bt">Filtrar</span><span class="bt">Importar</span><span class="bt">Arquivar</span><span class="bt">Duplicar</span><span class="bt">Excluir</span></div> -->
<!-- guia:depois <div class="ln"><span class="bt p">Exportar</span><span class="bt">Filtrar</span><span class="bt">⋯</span></div> -->
