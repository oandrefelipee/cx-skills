---
id: t-19
pt: Esqueletos de carregamento
en: Skeleton screens
ctx: [Operação]
fontes: [nng, material]
destaque: false
---

# Esqueletos de carregamento

*Skeleton screens* · Técnica

## Definição

Placeholder com a forma do conteúdo, só em carga de página.

## Quando usar

Listas e cartões que carregam.

**Exemplo:** Três linhas cinza no lugar da tabela enquanto ela carrega.

## Anti-padrão

Spinner de tela inteira; skeleton para upload.

## Antes → depois

```text
Antes
+--------------------------------------+
| Pedidos                              |
|                                      |
|                                      |
| ◌ Carregando…                        |
|                                      |
|                                      |
+--------------------------------------+
Depois
+--------------------------------------+
| Pedidos                              |
| ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒         |
| ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒         |
| ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒               |
+--------------------------------------+
```
1. ▒▒▒: linhas cinza com a forma da tabela; some quando os dados chegam.

## Microcopy

- Antes: "Carregando…"
- Depois: "(três linhas cinza no lugar da lista, sem texto)"

## Prompt

> Use skeleton com a estrutura real para carga de página; barra de progresso para tarefa longa.

## Fonte

- Nielsen Norman Group, *Artigos e relatórios de UX (NN/g)*. guia online, atualizado continuamente.
- Google, *Material Design 3*. guia online, atualizado continuamente.

## Ligações

- [Limiar de Doherty](../leis/limiar-de-doherty.md): espera percebida.
- [Convenção, Tesler e Doherty](convencao-tesler-doherty.md): feedback rápido.
- [Estado vazio acionável](estado-vazio-acionavel.md): outro estado de lista.
- [Leitura de relance](leitura-de-relance.md): forma conhecida.

<!-- guia:antes <div class="ln"><span class="spin">◌ Carregando…</span></div> -->
<!-- guia:depois <div class="sk"></div><div class="sk"></div><div class="sk s"></div> -->
