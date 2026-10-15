---
id: t-24
pt: Linguagem simples
en: Plain language
ctx: [Operação, Erro ou risco, Momento humano]
fontes: [redish, metts, polaris]
destaque: false
---

# Linguagem simples

*Plain language* · Técnica

## Definição

Palavras comuns, frases curtas, voz ativa, sem jargão interno. Escreva como se explicasse a alguém que só quer terminar a tarefa.

## Quando usar

Todo texto de interface, especialmente erros e avisos.

**Exemplo:** `Não foi possível salvar. Tente de novo.` no lugar de uma frase burocrática.

## Anti-padrão

`Em decorrência da indisponibilidade…`, voz passiva e termos internos.

## Antes → depois

```text
Antes
+--------------------------------------+
| Em decorrência da indisponibilidade  |
| momentânea do serviço, não foi       |
| possível efetuar a operação          |
| solicitada.                          |
+--------------------------------------+
Depois
+--------------------------------------+
| Não foi possível salvar.             |
| Tente de novo.                       |
| [■ Tentar de novo]                   |
+--------------------------------------+
```

## Microcopy

- Antes: "Em decorrência da indisponibilidade momentânea do serviço, não foi possível efetuar a operação solicitada"
- Depois: "Não foi possível salvar. Tente de novo."

## Prompt

> Reescreva em linguagem simples: voz ativa, palavras comuns, até 12 palavras por frase.

## Fonte

- Janice (Ginny) Redish, *Letting Go of the Words: Writing Web Content that Works*. 2ª ed., 2012, Morgan Kaufmann (1ª ed. 2007).
- Michael J. Metts e Andy Welfle, *Writing Is Designing: Words and the User Experience*. 2020, Rosenfeld Media.
- Shopify, *Polaris, guia de conteúdo (Content)*. guia online, atualizado continuamente.

## Ligações

- [Um termo por conceito](um-termo-por-conceito.md): mesma palavra.
- [Mensagens de erro úteis](mensagens-de-erro-uteis.md): erro claro.
- [Voz constante, tom variável](../principios/voz-constante-tom-variavel.md): voz.
- [Não me faça pensar](../principios/nao-me-faca-pensar.md): menos esforço.

<!-- guia:antes <div class="ln">Em decorrência da indisponibilidade momentânea do serviço, não foi possível efetuar a operação solicitada.</div> -->
<!-- guia:depois <div class="ln"><b>Não foi possível salvar.</b> Tente de novo.</div> -->
