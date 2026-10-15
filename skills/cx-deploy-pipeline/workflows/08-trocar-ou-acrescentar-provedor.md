# 08 · Trocar ou acrescentar provedor

Fase: **depois**. Objetivo: mudar de CI ou de hospedagem, ou acrescentar um serviço (DNS, segredos, filas, observabilidade, registro), sem mudar o fluxo dos agentes.

## Acrescentar um provedor ao catálogo

1. Escolha a categoria em [`references/provedores/INDEX.md`](../references/provedores/INDEX.md).
2. Copie [`_modelo.md`](../references/provedores/_modelo.md) para `references/provedores/<categoria>/<nome>.md` e preencha: como o contrato é atendido, CLI, MCP, armadilhas, fontes. Comece "Aprendizados" vazio.
3. Ponha a linha no `INDEX.md` da categoria e rode `node scripts/checar-links.mjs`.

## Trocar o provedor de CI

1. Escreva a config do novo CI com os mesmos gates e nomes de job estáveis; valide com o validador dele.
2. No adaptador, prepare os novos `ci.*` sem trocar ainda `ci.requiredChecks`.
3. Rode os dois CIs em paralelo num PR de teste até o novo dar o mesmo resultado (verde e um vermelho provocado).
4. Peça ao humano para trocar os checks exigidos na proteção da branch; só então atualize `ci.requiredChecks` e rode `checar-config.mjs --gh`.
5. Desligue o antigo. Segredos do novo CI: o humano cadastra no painel.

## Trocar a hospedagem

1. Suba o staging no novo provedor com o mesmo SHA; `checar-health` e smoke verdes.
2. Atualize `deploy.*` do adaptador; ensaie um rollback no staging.
3. Produção: plano com janela, DNS e volta, e o "pode".

## Sempre

Tudo o que surpreender vai para "Aprendizados" da página do provedor, com data e uma linha.
