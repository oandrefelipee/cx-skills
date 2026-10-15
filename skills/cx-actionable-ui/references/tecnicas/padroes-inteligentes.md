---
id: t-15
pt: Padrões inteligentes
en: Smart defaults
ctx: [Configuração, Momento humano]
fontes: [wroblewski, tidwell, cooper]
destaque: true
---

# Padrões inteligentes

*Smart defaults* · Técnica

## Definição

Pré-preencher o valor mais provável.

## Quando usar

Formulários, fontes, modelos.

**Exemplo:** Fuso `horário de Brasília` já selecionado, com `Alterar`.

## Anti-padrão

Campo obrigatório vazio com resposta óbvia.

## Antes → depois

```text
Antes
+--------------------------------------+
| Fuso horário                         |
| [▾ escolha…________________]         |
| Idioma                               |
| [▾ escolha…________________]         |
+--------------------------------------+
Depois
+--------------------------------------+
| Fuso horário                         |
| Horário de Brasília  [ Alterar ]     |
| Idioma                               |
| Português (Brasil)   [ Alterar ]     |
+--------------------------------------+
```

## Microcopy

- Antes: "Fuso horário: escolha…"
- Depois: "Horário de Brasília · Alterar"

## Prompt

> Pré-preencha com o padrão mais provável e deixe 'Alterar' discreto.

## Fonte

- Luke Wroblewski, *Web Form Design: Filling in the Blanks*. 2008, Rosenfeld Media.
- Jenifer Tidwell, Charles Brewer e Aynne Valencia, *Designing Interfaces: Patterns for Effective Interaction Design*. 3ª ed., 2020, O'Reilly.
- Alan Cooper, Robert Reimann, David Cronin e Christopher Noessel, *About Face: The Essentials of Interaction Design*. 4ª ed., 2014, Wiley.

## Ligações

- [Lei de Tesler](../leis/lei-de-tesler.md): sistema assume o trabalho.
- [Lei de Postel](../leis/lei-de-postel.md): aceitar variações.
- [Reconhecimento em vez de memorização](reconhecimento-em-vez-de-memorizacao.md): valor visível.
- [Validação em linha](validacao-em-linha.md): corrigir na hora.

<!-- guia:antes <div class="ln">Fuso: <span class='fld'>escolha…</span></div> -->
<!-- guia:depois <div class="ln">Fuso: horário de Brasília <span class="bt">Alterar</span></div> -->
