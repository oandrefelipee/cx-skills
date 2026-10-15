---
id: p-show
pt: Mostrar, não contar
en: Show, don't tell
ctx: [Momento humano, Configuração]
fontes: [krug, nng, polaris]
destaque: false
---

# Mostrar, não contar

*Show, don't tell* · Princípio

## Definição

Prove com a própria interface (preview, número, estado) em vez de descrever em texto. Se um exemplo vivo resolve, o parágrafo sobra.

## Quando usar

Onboarding, páginas de configuração, estados vazios.

**Exemplo:** Ao configurar a marca, a pessoa vê a página já com as cores escolhidas, e não três linhas sobre como ela ficará.

## Anti-padrão

Instruções longas descrevendo algo que um preview mostraria em um segundo.

## Antes → depois

```text
Antes
+--------------------------------------+
| Marca                                |
| Cor [#2F6FEB____]                    |
| Ao salvar, a página mostra o logo e  |
| a cor acima do título do pedido.     |
+--------------------------------------+
Depois
+--------------------------------------+
| Marca                                |
| Cor [#2F6FEB____]                    |
| +------------------+                 |
| | ▒▒▒ <logo>       |                 |
| | Pedido <código>  |                 |
| +------------------+                 |
+--------------------------------------+
```

1. ▒▒▒: prévia ao vivo com a cor escolhida.

## Microcopy

- Antes: "Depois de salvar, a página mostra o logo e a cor acima do título"
- Depois: "Prévia ao vivo ao lado do campo de cor"

## Prompt

> Troque esta explicação por um preview ao vivo; no máximo 1 linha de apoio.

## Fonte

- Steve Krug, *Don't Make Me Think, Revisited: A Common Sense Approach to Web (and Mobile) Usability*. 3ª ed., 2014, New Riders (1ª ed. 2000).
- Nielsen Norman Group, *Artigos e relatórios de UX (NN/g)*. guia online, atualizado continuamente.
- Shopify, *Polaris, guia de conteúdo (Content)*. guia online, atualizado continuamente.

## Ligações

- [Mostrar, não explicar](../tecnicas/mostrar-nao-explicar.md): a técnica.
- [Estado vazio acionável](../tecnicas/estado-vazio-acionavel.md): ação no lugar do texto.
- [Checklist de configuração](../tecnicas/checklist-de-configuracao.md): progresso visível.
- [Estado e ação antes de explicação](estado-e-acao-antes-de-explicacao.md): mesma ideia.

<!-- guia:antes <div class="p">Depois de salvar, a página mostrará ao cliente o logotipo, as cores escolhidas e a previsão de entrega logo abaixo do título.</div> -->
<!-- guia:depois <div class="prev"><div class="pv-h"></div><div class="pv-l"></div><div class="pv-l s"></div></div> -->
