---
id: l-aesthetic
pt: Efeito estético–usabilidade
en: Aesthetic–Usability Effect
ctx: [Momento humano, Operação]
fontes: [yablonski, norman, refui]
destaque: false
---

# Efeito estético–usabilidade

*Aesthetic–Usability Effect* · Lei

## Definição

Interfaces bonitas são percebidas como mais fáceis de usar e as pessoas toleram melhor pequenas falhas. Atenção: pode esconder problemas reais em testes.

## Quando usar

Qualquer tela, sobretudo as primeiras impressões.

**Exemplo:** Espaçamento, alinhamento e tipografia consistentes antes de adicionar enfeite.

## Anti-padrão

Usar beleza para mascarar um fluxo confuso.

## Antes → depois

```text
Antes
+--------------------------------------+
| Nome                                 |
| Ana Souza                            |
| E-mail ana@loja.com                  |
| Telefone      (11) 99999-0000        |
+--------------------------------------+
Depois
+--------------------------------------+
| Nome                                 |
| Ana Souza                            |
|                                      |
| E-mail                               |
| ana@loja.com                         |
+--------------------------------------+
```

## Microcopy

- Antes: "nome:Ana Souza   email:ana@loja.com"
- Depois: "Nome · Ana Souza"

## Prompt

> Cuide do básico visual (alinhamento, espaçamento, tipografia) antes de qualquer enfeite.

## Fonte

- Jon Yablonski, *Laws of UX: Using Psychology to Design Better Products & Services*. 2ª ed., 2024, O'Reilly (1ª ed. 2020).
- Don Norman, *The Design of Everyday Things (Revised and Expanded Edition)*. 2013, Basic Books (1ª ed. 1988, como The Psychology of Everyday Things).
- Adam Wathan e Steve Schoger, *Refactoring UI*. 2018, publicação independente.

## Ligações

- [Hierarquia visual](../tecnicas/hierarquia-visual.md): ordem.
- [Agrupar com espaço](../tecnicas/agrupar-com-espaco.md): ritmo.
- [Lei da proximidade](lei-da-proximidade.md): grupos.
- [Dados primeiro](../principios/dados-primeiro.md): sem enfeite.

<!-- guia:antes <div class="ln">Nome<br>E-mail<br>Telefone</div><div class="mu m">sem alinhamento nem espaçamento</div> -->
<!-- guia:depois <div class="ln"><b>Nome</b></div><div class="ln mu">Ana Souza</div><div class="ln" style="margin-top:8px"><b>E-mail</b></div><div class="ln mu">ana@loja.com</div> -->
