---
id: l-postel
pt: Lei de Postel (robustez)
en: Postel's Law (Robustness Principle)
ctx: [Erro ou risco, Operação]
fontes: [yablonski, wroblewski]
destaque: false
---

# Lei de Postel (robustez)

*Postel's Law (Robustness Principle)* · Lei

## Definição

Seja conservador no que envia e liberal no que aceita. Na interface: tolere formatos variados e normalize por trás.

## Quando usar

Campos de telefone, CPF, datas, busca, importação.

**Exemplo:** Aceitar CPF com ou sem pontos e normalizar ao salvar.

## Anti-padrão

Rejeitar um telefone porque tem espaço ou parênteses.

## Antes → depois

```text
Antes
+--------------------------------------+
| CPF [123.456.789-00____]             |
| Use somente números.                 |
+--------------------------------------+
Depois
+--------------------------------------+
| CPF [123.456.789-00____]   ✓         |
+--------------------------------------+
```

## Microcopy

- Antes: "Use somente números."
- Depois: "CPF válido"

## Prompt

> Aceite formatos variados de entrada e normalize no sistema.

## Fonte

- Jon Yablonski, *Laws of UX: Using Psychology to Design Better Products & Services*. 2ª ed., 2024, O'Reilly (1ª ed. 2020).
- Luke Wroblewski, *Web Form Design: Filling in the Blanks*. 2008, Rosenfeld Media.

## Ligações

- [Validação em linha](../tecnicas/validacao-em-linha.md): retorno.
- [Mensagens de erro úteis](../tecnicas/mensagens-de-erro-uteis.md): quando falha.
- [Padrões inteligentes](../tecnicas/padroes-inteligentes.md): normalizar.
- [Lei de Tesler](lei-de-tesler.md): o sistema absorve.

<!-- guia:antes <div class="ln">CPF: <span class="fld">123.456.789-00</span></div><div class="ln er-t">Use somente números.</div> -->
<!-- guia:depois <div class="ln">CPF: <span class="fld">123.456.789-00</span> <span class="bd ok">✓</span></div> -->
