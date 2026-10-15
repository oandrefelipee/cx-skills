---
id: p-voz-tom
pt: Voz constante, tom variável
en: Constant voice, variable tone
ctx: [Configuração, Operação, Momento humano, Erro ou risco]
fontes: [polaris, podmajersky, metts]
destaque: false
---

# Voz constante, tom variável

*Constant voice, variable tone* · Princípio

## Definição

A voz do produto é sempre a mesma (clara, curta, em segunda pessoa). O tom muda conforme o que a pessoa está fazendo e sentindo; veja a matriz de tom.

## Quando usar

Todo texto de interface, de chave de API a e-mail de boas-vindas.

**Exemplo:** Chave inválida: tom seco (`Chave inválida. Gere outra.`). Primeiro pedido: tom amigável (`Tudo pronto. Envie o primeiro pedido.`).

## Anti-padrão

Piada ou exclamação em mensagem de erro; frieza em tela de boas-vindas.

## Antes → depois

```text
Antes
+--------------------------------------+
| Ops!! Sua chave de API deu           |
| problema, tente de novo :(           |
| [ OK ]                               |
+--------------------------------------+
Depois
+--------------------------------------+
| Chave de API inválida.               |
| [■ Gerar nova chave]                 |
+--------------------------------------+
```

## Microcopy

- Antes: "Ops!! Sua chave de API deu problema, tente de novo"
- Depois: "Chave de API inválida. Gere outra."

## Prompt

> Ajuste o tom ao contexto: técnico seco em configuração, amigável em onboarding, calmo em erro.

## Fonte

- Shopify, *Polaris, guia de conteúdo (Content)*. guia online, atualizado continuamente.
- Torrey Podmajersky, *Strategic Writing for UX*. 2ª ed., 2025, O'Reilly (1ª ed. 2019).
- Michael J. Metts e Andy Welfle, *Writing Is Designing: Words and the User Experience*. 2020, Rosenfeld Media.

## Ligações

- [Linguagem simples](../tecnicas/linguagem-simples.md): voz.
- [Mensagens de erro úteis](../tecnicas/mensagens-de-erro-uteis.md): tom seco.
- [Um termo por conceito](../tecnicas/um-termo-por-conceito.md): consistência.
- [Regra do pico e do fim](../leis/regra-do-pico-e-do-fim.md): tom amigável.

<!-- guia:antes <div class="ln">Ops!! Sua chave de API deu problema 😅</div> -->
<!-- guia:depois <div class="ln"><b>Chave de API inválida.</b> <span class="bt">Gerar nova chave</span></div> -->
