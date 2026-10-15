---
id: t-25
pt: Mensagens de erro úteis
en: Helpful error messages
ctx: [Erro ou risco]
fontes: [podmajersky, nng, polaris, wroblewski]
destaque: false
---

# Mensagens de erro úteis

*Helpful error messages* · Técnica

## Definição

O erro diz o que aconteceu, por quê (se ajudar) e o que fazer, com a ação à mão. Sem culpar a pessoa, sem códigos soltos.

## Quando usar

Falhas de formulário, de integração, de pagamento, de importação.

**Exemplo:** `Não foi possível publicar. Falta o endereço de entrega no passo 2.` + `Ir para o passo 2`.

## Anti-padrão

`Erro 500` ou `Algo deu errado` sem saída.

## Antes → depois

```text
Antes
+--------------------------------------+
| Erro 500: falha inesperada.          |
| Tente novamente mais tarde.          |
+--------------------------------------+
Depois
+--------------------------------------+
| Não foi possível publicar.           |
| Falta o endereço de entrega          |
| no passo 2.                          |
| [■ Ir para o passo 2]                |
+--------------------------------------+
```

## Microcopy

- Antes: "Erro 500: falha inesperada. Tente novamente mais tarde"
- Depois: "Não foi possível publicar. Falta o endereço de entrega no passo 2"

## Prompt

> Reescreva o erro: o que houve, o que fazer, e um botão que leva direto ao conserto.

## Fonte

- Torrey Podmajersky, *Strategic Writing for UX*. 2ª ed., 2025, O'Reilly (1ª ed. 2019).
- Nielsen Norman Group, *Artigos e relatórios de UX (NN/g)*. guia online, atualizado continuamente.
- Shopify, *Polaris, guia de conteúdo (Content)*. guia online, atualizado continuamente.
- Luke Wroblewski, *Web Form Design: Filling in the Blanks*. 2008, Rosenfeld Media.

## Ligações

- [Validação em linha](validacao-em-linha.md): erro no campo.
- [Linguagem simples](linguagem-simples.md): palavras comuns.
- [Informação à frente](informacao-a-frente.md): o que falhou primeiro.
- [Desfazer em vez de confirmar](desfazer-em-vez-de-confirmar.md): recuperar.

<!-- guia:antes <div class="ln er-t">Erro 500: falha inesperada. Tente novamente mais tarde.</div> -->
<!-- guia:depois <div class="ln er-t"><b>Não foi possível publicar.</b></div><div class="ln">Falta o endereço de entrega no passo 2.</div><div class="ln"><span class="bt p">Ir para o passo 2</span></div> -->
