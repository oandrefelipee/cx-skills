---
id: t-21
pt: Validação em linha
en: Inline validation
ctx: [Erro ou risco, Configuração]
fontes: [wroblewski, nng]
destaque: false
---

# Validação em linha

*Inline validation* · Técnica

## Definição

Valida o campo enquanto (ou assim que) a pessoa o preenche, com a mensagem ao lado do campo, e não só no envio.

## Quando usar

Formulários com formato (e-mail, CPF, domínio, senha).

**Exemplo:** Ao sair do campo de e-mail, aparece `Falta o domínio. Exemplo: ana@loja.com` ao lado.

## Anti-padrão

Mostrar um banner `Há erros no formulário` só depois do clique em Salvar.

## Antes → depois

```text
Antes
+--------------------------------------+
| E-mail [ana@@gmail______________]    |
| [■ Salvar]                           |
| Há erros no formulário.              |
+--------------------------------------+
Depois
+--------------------------------------+
| E-mail [ana@@gmail______________]    |
| Falta o domínio. Ex.: ana@loja.com   |
| [■ Salvar]                           |
+--------------------------------------+
```

## Microcopy

- Antes: "Há erros no formulário."
- Depois: "Falta o domínio. Exemplo: ana@loja.com"

## Prompt

> Valide cada campo ao sair dele; a mensagem fica ao lado, diz o que está errado e dá um exemplo.

## Fonte

- Luke Wroblewski, *Web Form Design: Filling in the Blanks*. 2008, Rosenfeld Media.
- Nielsen Norman Group, *Artigos e relatórios de UX (NN/g)*. guia online, atualizado continuamente.

## Ligações

- [Mensagens de erro úteis](mensagens-de-erro-uteis.md): texto do erro.
- [Padrões inteligentes](padroes-inteligentes.md): menos erro.
- [Lei de Postel](../leis/lei-de-postel.md): aceitar variações.
- [Limiar de Doherty](../leis/limiar-de-doherty.md): resposta imediata.

<!-- guia:antes <div class="ln">E-mail: <span class="fld">ana@@gmail</span></div><div class="ln"><span class="bt p">Salvar</span></div><div class="ln er-t">Há erros no formulário.</div> -->
<!-- guia:depois <div class="ln">E-mail: <span class="fld" style="border-color:var(--er)">ana@@gmail</span></div><div class="ln er-t">Falta o domínio. Exemplo: ana@loja.com</div> -->
