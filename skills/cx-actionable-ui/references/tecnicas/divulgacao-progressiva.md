---
id: t-01
pt: Divulgação progressiva
en: Progressive disclosure
ctx: [Configuração, Operação]
fontes: [nng, tidwell]
destaque: true
---

# Divulgação progressiva

*Progressive disclosure* · Técnica

## Definição

Mostra só o essencial primeiro e deixa o resto sob demanda, em no máximo 2 níveis.

## Quando usar

Configuração, formulários longos, detalhe de um registro.

**Exemplo:** Cartão de domínio mostra `Verificado` e um botão `Ver registros`; os registros DNS ficam atrás.

## Anti-padrão

Três níveis de menus recolhíveis; gatilho vago como "Mais".

## Antes → depois

```text
Antes
+--------------------------------------+
| Domínio loja.exemplo.com             |
| A     192.0.2.1   TTL 300            |
| CNAME www → loja.exemplo.com         |
| TXT   v=spf1 include:… ~all          |
| Prova: token HMAC, prazo 90 dias     |
+--------------------------------------+
Depois
+--------------------------------------+
| Domínio loja.exemplo.com             |
| (● Verificado)[verde]                |
| [ Ver registros ]                    |
+--------------------------------------+
```
1. [ Ver registros ] abre os registros DNS (nível 2).

## Microcopy

- Antes: "A 192.0.2.1 · CNAME www · TXT v=spf1 · token HMAC · prazo 90 dias"
- Depois: "Verificado · Ver registros"

## Prompt

> Aplique divulgação progressiva: só o que se usa em 80% das vezes fica visível, máx. 2 níveis, gatilho claro.

## Fonte

- Nielsen Norman Group, *Artigos e relatórios de UX (NN/g)*. guia online, atualizado continuamente.
- Jenifer Tidwell, Charles Brewer e Aynne Valencia, *Designing Interfaces: Patterns for Effective Interaction Design*. 3ª ed., 2020, O'Reilly.

## Ligações

- [Ajuda contextual](ajuda-contextual.md): dica sob demanda.
- [Divulgação em dois níveis](../principios/divulgacao-em-dois-niveis.md): limite de níveis.
- [Lei de Hick](../leis/lei-de-hick.md): menos à vista.
- [Informação à frente](informacao-a-frente.md): o que vai abrir.

<!-- guia:antes <div class="ln">Nome do domínio</div><div class="ln">Registro A: 192.0.2.1 · TTL 300 · proxy desligado</div><div class="ln">Registro CNAME: www → loja.exemplo.com</div><div class="ln">Registro TXT: v=spf1 include:… ~all</div><div class="ln">Verificação: token HMAC e prazo de 90 dias…</div> -->
<!-- guia:depois <div class="ln">Nome do domínio <span class="bd ok">Verificado</span></div><div class="ln"><span class="bt">Ver registros</span></div> -->
