---
id: t-22
pt: Desfazer em vez de confirmar
en: Undo instead of confirm
ctx: [Operação, Erro ou risco]
fontes: [norman, cooper, nng]
destaque: false
---

# Desfazer em vez de confirmar

*Undo instead of confirm* · Técnica

## Definição

Para ações reversíveis, execute e ofereça `Desfazer`, em vez de interromper com `Tem certeza?`. Reserve a confirmação para o que é irreversível.

## Quando usar

Arquivar, mover, excluir com lixeira, editar em lote.

**Exemplo:** Aviso `Domínio arquivado` com o botão `Desfazer` por alguns segundos.

## Anti-padrão

`Tem certeza?` antes de toda ação, treinando a pessoa a clicar sem ler.

## Antes → depois

```text
Antes
+--------------------------------------+
| Arquivar domínio?                    |
| Tem certeza?                         |
| [ Cancelar ] [■ Arquivar]            |
+--------------------------------------+
Depois
+--------------------------------------+
| Domínio arquivado  [ Desfazer ]      |
|                                      |
| (some em alguns segundos)            |
+--------------------------------------+
```

## Microcopy

- Antes: "Arquivar domínio? Tem certeza?"
- Depois: "Domínio arquivado · Desfazer"

## Prompt

> Troque o modal de confirmação por um 'Desfazer' nas ações reversíveis; confirme só o irreversível.

## Fonte

- Don Norman, *The Design of Everyday Things (Revised and Expanded Edition)*. 2013, Basic Books (1ª ed. 1988, como The Psychology of Everyday Things).
- Alan Cooper, Robert Reimann, David Cronin e Christopher Noessel, *About Face: The Essentials of Interaction Design*. 4ª ed., 2014, Wiley.
- Nielsen Norman Group, *Artigos e relatórios de UX (NN/g)*. guia online, atualizado continuamente.

## Ligações

- [Verbos nos botões](verbos-nos-botoes.md): nomear a ação.
- [Mensagens de erro úteis](mensagens-de-erro-uteis.md): saída clara.
- [Não me faça pensar](../principios/nao-me-faca-pensar.md): menos atrito.
- [Ações na linha e em lote](acoes-na-linha-e-em-lote.md): onde se aplica.

<!-- guia:antes <div class="ln"><b>Arquivar domínio?</b> Tem certeza?</div><div class="ln"><span class="bt">Cancelar</span><span class="bt p">Arquivar</span></div> -->
<!-- guia:depois <div class="ln"><span class="tip">Domínio arquivado · <b>Desfazer</b></span></div> -->
