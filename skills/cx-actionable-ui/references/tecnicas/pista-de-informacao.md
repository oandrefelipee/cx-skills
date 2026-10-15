---
id: t-04
pt: Pista de informação
en: Information scent
ctx: [Operação, Configuração]
fontes: [nng, redish]
destaque: false
---

# Pista de informação

*Information scent* · Técnica

## Definição

O rótulo promete o que a pessoa vai encontrar atrás do clique.

## Quando usar

Navegação, links, cartões de ação.

**Exemplo:** `Ver registros DNS` no lugar de `Detalhes`.

## Anti-padrão

"Saiba mais", "Detalhes", "Clique aqui".

## Antes → depois

```text
Antes
+--------------------------------------+
| Pedidos atrasados: 12                |
| [ Saiba mais ] [ Detalhes ]          |
| DNS: 3 registros pendentes           |
| [ Clique aqui ]                      |
+--------------------------------------+
Depois
+--------------------------------------+
| Pedidos atrasados: 12                |
| [ Ver pedidos atrasados ]            |
| DNS: 3 registros pendentes           |
| [ Ver registros DNS ]                |
+--------------------------------------+
```

## Microcopy

- Antes: "Saiba mais" · "Detalhes" · "Clique aqui"
- Depois: "Ver pedidos atrasados" · "Ver registros DNS"

## Prompt

> Revise rótulos de navegação e links: cada um diz o que a pessoa encontra ali.

## Fonte

- Nielsen Norman Group, *Artigos e relatórios de UX (NN/g)*. guia online, atualizado continuamente.
- Janice (Ginny) Redish, *Letting Go of the Words: Writing Web Content that Works*. 2ª ed., 2012, Morgan Kaufmann (1ª ed. 2007).

## Ligações

- [Verbos nos botões](verbos-nos-botoes.md): rótulo com verbo.
- [Linguagem simples](linguagem-simples.md): palavras do usuário.
- [Lei de Jakob](../leis/lei-de-jakob.md): rótulo previsível.
- [Um termo por conceito](um-termo-por-conceito.md): mesmo nome sempre.

<!-- guia:antes <div class="ln"><span class="bt">Saiba mais</span> <span class="bt">Detalhes</span></div> -->
<!-- guia:depois <div class="ln"><span class="bt">Ver registros DNS</span> <span class="bt">Ver Pedidos atrasados</span></div> -->
