---
id: l-doherty
pt: Limiar de Doherty
en: Doherty Threshold
ctx: [Operação]
fontes: [yablonski, nng]
destaque: false
---

# Limiar de Doherty

*Doherty Threshold* · Lei

## Definição

A produtividade dispara quando computador e pessoa respondem um ao outro em menos de ~400 ms. Acima disso, mostre que algo está acontecendo.

## Quando usar

Salvar, filtrar, buscar, trocar de aba, ações otimistas.

**Exemplo:** Ao salvar, o selo muda na hora para `Salvando…` e depois `Salvo`; nada de tela travada.

## Anti-padrão

Sem retorno por 2 s ou um spinner que bloqueia a tela inteira.

## Antes → depois

```text
Antes
+--------------------------------------+
| [■ Salvar]                           |
| (2 s sem resposta nenhuma)           |
+--------------------------------------+
Depois
+--------------------------------------+
| [■ Salvar]  (● Salvando…)            |
| [■ Salvar]  (● Salvo)                |
+--------------------------------------+
```

## Microcopy

- Antes: "(sem resposta por 2 segundos)"
- Depois: "Salvando… · Salvo"

## Prompt

> Dê feedback em até 400 ms: estado imediato, esqueleto ou ação otimista.

## Fonte

- Jon Yablonski, *Laws of UX: Using Psychology to Design Better Products & Services*. 2ª ed., 2024, O'Reilly (1ª ed. 2020).
- Nielsen Norman Group, *Artigos e relatórios de UX (NN/g)*. guia online, atualizado continuamente.

## Ligações

- [Esqueletos de carregamento](../tecnicas/esqueletos-de-carregamento.md): espera.
- [Convenção, Tesler e Doherty](../tecnicas/convencao-tesler-doherty.md): aplicar.
- [Selo de status](../tecnicas/selo-de-status.md): retorno.
- [Desfazer em vez de confirmar](../tecnicas/desfazer-em-vez-de-confirmar.md): ação otimista.

<!-- guia:antes <div class="ln"><span class="bt p">Salvar</span> <span class="mu">… (2 s sem resposta)</span></div> -->
<!-- guia:depois <div class="ln"><span class="bt p">Salvar</span> <span class="bd wa">Salvando…</span> → <span class="bd ok">Salvo</span></div> -->
