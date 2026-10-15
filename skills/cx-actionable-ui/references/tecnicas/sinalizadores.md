---
id: t-27
pt: Sinalizadores (signifiers)
en: Signifiers
ctx: [Operação, Configuração]
fontes: [norman, hig]
destaque: false
---

# Sinalizadores (signifiers)

*Signifiers* · Técnica

## Definição

Faça o elemento mostrar como pode ser usado: um botão parece botão, um link parece link, um campo parece campo. O sinal vem da forma, não de instrução.

## Quando usar

Botões, links, áreas clicáveis, controles personalizados.

**Exemplo:** Botão com contorno e rótulo `+ Adicionar domínio`, em vez de texto solto.

## Anti-padrão

Texto que é clicável mas parece rótulo.

## Antes → depois

```text
Antes
+--------------------------------------+
| Adicionar domínio                    |
+--------------------------------------+
Depois
+--------------------------------------+
| [ + Adicionar domínio ]              |
+--------------------------------------+
```

## Microcopy

- Antes: "Adicionar domínio (texto cinza, sem forma de botão)"
- Depois: "+ Adicionar domínio (botão com contorno)"

## Prompt

> Garanta que tudo o que é clicável pareça clicável, e o que não é, não pareça.

## Fonte

- Don Norman, *The Design of Everyday Things (Revised and Expanded Edition)*. 2013, Basic Books (1ª ed. 1988, como The Psychology of Everyday Things).
- Apple, *Human Interface Guidelines*. guia online, atualizado continuamente.

## Ligações

- [Lei de Fitts](../leis/lei-de-fitts.md): alvo claro.
- [Lei de Jakob](../leis/lei-de-jakob.md): forma conhecida.
- [Não me faça pensar](../principios/nao-me-faca-pensar.md): óbvio.
- [Fitts na prática](fitts-na-pratica.md): alvo grande.

<!-- guia:antes <div class="ln mu">Adicionar domínio</div> -->
<!-- guia:depois <div class="ln"><span class="bt">+ Adicionar domínio</span></div> -->
