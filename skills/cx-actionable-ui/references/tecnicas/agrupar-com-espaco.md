---
id: t-29
pt: Agrupar com espaço
en: Grouping with space
ctx: [Configuração, Operação]
fontes: [refui, yablonski, weinschenk]
destaque: false
---

# Agrupar com espaço

*Grouping with space* · Técnica

## Definição

Use espaço em branco, mais do que linhas e caixas, para separar grupos. O olho entende a estrutura sem enfeite.

## Quando usar

Formulários longos, páginas de configuração, cartões.

**Exemplo:** Dois grupos (`Contato` e `Endereço`) separados por um intervalo maior, sem divisórias.

## Anti-padrão

Uma linha divisória e uma caixa para cada campo.

## Antes → depois

```text
Antes
+--------------------------------------+
| Nome                                 |
| Sobrenome                            |
| Rua                                  |
| Cidade                               |
+--------------------------------------+
Depois
+--------------------------------------+
| Contato                              |
| Nome                                 |
| Sobrenome                            |
|                                      |
| Endereço                             |
| Rua                                  |
| Cidade                               |
+--------------------------------------+
```

## Microcopy

- Antes: "Nome / Sobrenome / Rua / Cidade (sem títulos de grupo)"
- Depois: "Contato (Nome, Sobrenome) · Endereço (Rua, Cidade)"

## Prompt

> Agrupe os campos com espaço e títulos curtos; tire divisórias e caixas que não ajudam.

## Fonte

- Adam Wathan e Steve Schoger, *Refactoring UI*. 2018, publicação independente.
- Jon Yablonski, *Laws of UX: Using Psychology to Design Better Products & Services*. 2ª ed., 2024, O'Reilly (1ª ed. 2020).
- Susan M. Weinschenk, *100 Things Every Designer Needs to Know About People*. 2ª ed., 2020, New Riders (1ª ed. 2011).

## Ligações

- [Lei da proximidade](../leis/lei-da-proximidade.md): agrupar.
- [Lei de Miller](../leis/lei-de-miller.md): blocos.
- [Miller na prática](miller-na-pratica.md): aplicar.
- [Hierarquia visual](hierarquia-visual.md): estrutura.

<!-- guia:antes <div class="ln">Nome</div><div class="ln">Sobrenome</div><div class="ln">Rua</div><div class="ln">Cidade</div> -->
<!-- guia:depois <div class="ln mu m">Contato</div><div class="ln">Nome</div><div class="ln">Sobrenome</div><div class="ln mu m" style="margin-top:14px">Endereço</div><div class="ln">Rua</div><div class="ln">Cidade</div> -->
