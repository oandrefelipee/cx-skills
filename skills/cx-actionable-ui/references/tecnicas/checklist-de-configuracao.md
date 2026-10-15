---
id: t-12
pt: Checklist de configuração
en: Setup checklist
ctx: [Momento humano]
fontes: [polaris, nng]
destaque: true
---

# Checklist de configuração

*Setup checklist* · Técnica

## Definição

Até 5 passos auto-marcados, com progresso, dispensáveis.

## Quando usar

Primeira configuração da conta.

**Exemplo:** `2 de 4 prontos` com botão em cada passo pendente.

## Anti-padrão

Tutorial longo e bloqueante com marcação manual.

## Antes → depois

```text
Antes
+--------------------------------------+
| Passo 1: crie sua conta. Passo 2:    |
| configure a loja. Passo 3: conecte   |
| o pagamento. Passo 4: publique a     |
| página. Passo 5: envie um teste…     |
+--------------------------------------+
Depois
+--------------------------------------+
| Configuração       2 de 4 prontos    |
| ✓ Loja                               |
| ✓ Pagamento                          |
| ○ Página            [■ Publicar]     |
| ○ Teste              [ Enviar ]      |
+--------------------------------------+
```
1. Passos se marcam sozinhos; o checklist é dispensável.

## Microcopy

- Antes: "Passo 1: crie sua conta. Passo 2: configure a loja…"
- Depois: "2 de 4 prontos · Publicar"

## Prompt

> Monte um checklist de até 5 passos, auto-concluídos, com progresso e botão por passo.

## Fonte

- Shopify, *Polaris, guia de conteúdo (Content)*. guia online, atualizado continuamente.
- Nielsen Norman Group, *Artigos e relatórios de UX (NN/g)*. guia online, atualizado continuamente.

## Ligações

- [Estado vazio acionável](estado-vazio-acionavel.md): primeira ação.
- [Lei de Tesler](../leis/lei-de-tesler.md): sistema faz o resto.
- [Padrões inteligentes](padroes-inteligentes.md): passos pré-preenchidos.
- [Uma ação primária](../principios/uma-acao-primaria.md): um botão por passo.

<!-- guia:antes <div class="p">Passo 1: crie sua conta. Passo 2: configure a loja. Passo 3: conecte o pagamento. Passo 4: publique a página. Passo 5: envie um teste. Passo 6…</div> -->
<!-- guia:depois <div class="ln"><span class="bd ok">✓</span> Loja <span class="bd ok">✓</span> Pagamento</div><div class="ln">○ Página <span class="bt">Publicar</span></div><div class="ln"><div class="bar"><i style="width:50%"></i></div><span class="mu">2 de 4 prontos</span></div> -->
