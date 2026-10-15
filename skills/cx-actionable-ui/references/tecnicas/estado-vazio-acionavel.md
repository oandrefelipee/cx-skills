---
id: t-11
pt: Estado vazio acionável
en: Actionable empty state
ctx: [Momento humano]
fontes: [nng, polaris]
destaque: true
---

# Estado vazio acionável

*Actionable empty state* · Técnica

## Definição

Diz o que a área mostrará, por que está vazia e dá a primeira ação.

## Quando usar

Toda lista ou seção que pode ficar vazia.

**Exemplo:** `Nenhuma integração ainda. Conecte a primeira para receber pedidos.` + botão.

## Anti-padrão

Tela em branco, "Nenhum dado", "—" sozinho.

## Antes → depois

```text
Antes
+--------------------------------------+
| Integrações                          |
| —                                    |
+--------------------------------------+
Depois
+--------------------------------------+
| Integrações                          |
| Nenhuma integração ainda             |
| Conecte a primeira para receber      |
| pedidos.                             |
| [■ Adicionar integração]             |
+--------------------------------------+
```

## Microcopy

- Antes: "Nenhum dado" · "—"
- Depois: "Nenhuma integração ainda. Conecte a primeira para receber pedidos."

## Prompt

> Neste vazio: 1 linha do que aparecerá, 1 botão de primeira ação, 1 link de ajuda opcional.

## Fonte

- Nielsen Norman Group, *Artigos e relatórios de UX (NN/g)*. guia online, atualizado continuamente.
- Shopify, *Polaris, guia de conteúdo (Content)*. guia online, atualizado continuamente.

## Ligações

- [Mostrar, não explicar](mostrar-nao-explicar.md): exemplo no vazio.
- [Uma ação primária](../principios/uma-acao-primaria.md): um botão só.
- [Verbos nos botões](verbos-nos-botoes.md): rótulo da ação.
- [Checklist de configuração](checklist-de-configuracao.md): primeiros passos.

<!-- guia:antes <div class="ln">—</div> -->
<!-- guia:depois <div class="ln"><b>Nenhuma integração ainda</b></div><div class="ln">Conecte a primeira para receber pedidos.</div><div class="ln"><span class="bt p">Adicionar integração</span></div> -->
