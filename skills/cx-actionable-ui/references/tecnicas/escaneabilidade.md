---
id: t-02
pt: Escaneabilidade
en: Scannability (F/Z-pattern)
ctx: [Operação]
fontes: [nng, redish, krug]
destaque: false
---

# Escaneabilidade

*Scannability (F/Z-pattern)* · Técnica

## Definição

A pessoa varre a tela em F: o começo de cada linha recebe a atenção.

## Quando usar

Listas, cabeçalhos, cartões de resumo.

**Exemplo:** Título `Pedidos atrasados` em vez de `Aqui você encontra os pedidos que estão atrasados`.

## Anti-padrão

Parágrafo denso; título que começa por palavra vazia.

## Antes → depois

```text
Antes
+--------------------------------------+
| Aqui você pode encontrar a lista de  |
| todos os pedidos que estão com a     |
| entrega atrasada em relação ao       |
| prazo previsto.                      |
+--------------------------------------+
Depois
+--------------------------------------+
| Pedidos atrasados  (● 12)[âmbar]     |
| Prazo vencido · Maior atraso: 4 dias |
| [■ Ver atrasados]                    |
+--------------------------------------+
```

## Microcopy

- Antes: "Aqui você pode encontrar os pedidos que estão atrasados"
- Depois: "Pedidos atrasados · 12"

## Prompt

> Reescreva para escaneabilidade: título começa pela palavra informativa, bullets, sem parágrafo de mais de 2 linhas.

## Fonte

- Nielsen Norman Group, *Artigos e relatórios de UX (NN/g)*. guia online, atualizado continuamente.
- Janice (Ginny) Redish, *Letting Go of the Words: Writing Web Content that Works*. 2ª ed., 2012, Morgan Kaufmann (1ª ed. 2007).
- Steve Krug, *Don't Make Me Think, Revisited: A Common Sense Approach to Web (and Mobile) Usability*. 3ª ed., 2014, New Riders (1ª ed. 2000).

## Ligações

- [Hierarquia visual](hierarquia-visual.md): ordem de leitura.
- [Linguagem simples](linguagem-simples.md): palavra útil primeiro.
- [Lei de Jakob](../leis/lei-de-jakob.md): varredura em F.
- [Leitura de relance](leitura-de-relance.md): 1-2 segundos.

<!-- guia:antes <div class="p">Aqui você pode encontrar a lista de todos os pedidos que estão com a entrega atrasada em relação ao prazo previsto.</div> -->
<!-- guia:depois <div class="ln"><b>Pedidos atrasados</b> <span class="bd wa">12</span></div><div class="ln">Prazo vencido · Maior atraso: 4 dias</div> -->
