---
id: p-estado-acao
pt: Estado e ação antes de explicação
en: State and action before explanation
ctx: [Configuração, Operação, Erro ou risco]
fontes: [krug, polaris, refui]
destaque: false
---

# Estado e ação antes de explicação

*State and action before explanation* · Princípio

## Definição

Mostre o que está acontecendo (selo, número, ponto colorido) e o que fazer a seguir (botão). A explicação só aparece quando a pessoa pedir.

## Quando usar

Toda tela de decisão: painéis, listas, cabeçalhos de detalhe.

**Exemplo:** Cartão de integração com `Chave expirada` e o botão `Renovar chave`; o porquê vai num ⓘ.

## Anti-padrão

Um parágrafo conta o problema e o botão aparece só no final do texto.

## Antes → depois

```text
Antes
+--------------------------------------+
| A integração de e-mail está          |
| desligada porque a chave expirou.    |
| Abra as configurações e gere uma     |
| nova chave para voltar a enviar.     |
+--------------------------------------+
Depois
+--------------------------------------+
| E-mail (● Chave expirada)[vermelho]  |
| [■ Renovar chave]                  ⓘ |
+--------------------------------------+
```

1. ⓘ: por que a chave expira e como gerar outra.

## Microcopy

- Antes: "A integração está desligada porque a chave de acesso expirou. Gere uma nova."
- Depois: "Chave expirada · Renovar chave"

## Prompt

> Reescreva este bloco com estado em selo e uma ação primária; a explicação vai para um ⓘ.

## Fonte

- Steve Krug, *Don't Make Me Think, Revisited: A Common Sense Approach to Web (and Mobile) Usability*. 3ª ed., 2014, New Riders (1ª ed. 2000).
- Shopify, *Polaris, guia de conteúdo (Content)*. guia online, atualizado continuamente.
- Adam Wathan e Steve Schoger, *Refactoring UI*. 2018, publicação independente.

## Ligações

- [Selo de status](../tecnicas/selo-de-status.md): estado.
- [Uma ação primária](uma-acao-primaria.md): ação.
- [Verbos nos botões](../tecnicas/verbos-nos-botoes.md): o rótulo.
- [Mensagens de erro úteis](../tecnicas/mensagens-de-erro-uteis.md): próximo passo.

<!-- guia:antes <div class="p">A integração com o provedor de e-mail está desligada porque a chave de acesso expirou. Para voltar a enviar mensagens, abra as configurações e gere uma nova chave.</div> -->
<!-- guia:depois <div class="ln"><span class="bd er">Chave expirada</span> <span class="bt p">Renovar chave</span></div> -->
