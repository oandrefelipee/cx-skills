---
id: p-cortar
pt: Cortar não é esconder o que importa
en: Cutting is not hiding
ctx: [Operação, Erro ou risco]
fontes: [nng, norman, krug]
destaque: false
---

# Cortar não é esconder o que importa

*Cutting is not hiding* · Princípio

## Definição

Se a informação muda a decisão, ela fica visível. Se só explica, vai para a ajuda contextual. Se repete o título ou o vizinho, some.

## Quando usar

Ao enxugar qualquer tela; antes de mandar algo para o ⓘ.

**Exemplo:** O prazo de entrega muda a decisão e fica na linha; a fórmula do prazo vai para o ⓘ.

## Anti-padrão

Esconder o custo, o prazo ou o aviso de risco num tooltip porque 'poluía' a tela.

## Antes → depois

```text
Antes
+--------------------------------------+
| Plano Pro ⓘ            [■ Assinar]   |
| (preço e fidelidade só no ⓘ)         |
+--------------------------------------+
Depois
+--------------------------------------+
| Plano Pro · R$ 49/mês · 12 meses ⓘ   |
| [■ Assinar]                          |
+--------------------------------------+
```

1. ⓘ: como o valor mensal é calculado.

## Microcopy

- Antes: "Plano Pro (veja o ⓘ para o preço)"
- Depois: "Plano Pro · R$ 49/mês · 12 meses"

## Prompt

> Para cada texto cortado: muda a decisão (fica), só explica (ⓘ) ou repete (some)?

## Fonte

- Nielsen Norman Group, *Artigos e relatórios de UX (NN/g)*. guia online, atualizado continuamente.
- Don Norman, *The Design of Everyday Things (Revised and Expanded Edition)*. 2013, Basic Books (1ª ed. 1988, como The Psychology of Everyday Things).
- Steve Krug, *Don't Make Me Think, Revisited: A Common Sense Approach to Web (and Mobile) Usability*. 3ª ed., 2014, New Riders (1ª ed. 2000).

## Ligações

- [Divulgação em dois níveis](divulgacao-em-dois-niveis.md): o que vai ao ⓘ.
- [Ajuda contextual](../tecnicas/ajuda-contextual.md): onde guardar.
- [Informação à frente](../tecnicas/informacao-a-frente.md): decide, fica.
- [Estado e ação antes de explicação](estado-e-acao-antes-de-explicacao.md): prioridade.

<!-- guia:antes <div class="ln">Plano Pro <span class="i">ⓘ</span> <span class="bt p">Assinar</span></div><div class="ln mu">(a cobrança de R$ 49/mês e a fidelidade de 12 meses estão no ⓘ)</div> -->
<!-- guia:depois <div class="ln">Plano Pro · <b>R$ 49/mês</b> · 12 meses <span class="i">ⓘ</span> <span class="bt p">Assinar</span></div> -->
