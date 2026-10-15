# Camadas de validação (L0 a L3)

Cada camada roda o que dá retorno naquele momento; nenhuma repete a anterior sem motivo.

| Camada | Onde | Quando | O que roda | Alvo |
|---|---|---|---|---|
| L0 | laptop do agente | durante a tarefa | tipos filtrados, lint, unitários do módulo, E2E do arquivo tocado | 1 a 3 min |
| L1 | CI, por PR | a cada push | gates rápidos do que o diff afeta + caminho crítico (`@smoke`) | 5 a 10 min |
| L2 | CI, lote | trem de merge ou merge queue | tudo menos capturas visuais e testes caros de GPU | 20 a 35 min por lote |
| L3 | CI, agendado | à noite | tudo, inclusive capturas e testes caros | fora do caminho |

## Como escolher o que roda no L1

- Um **mapa de impacto** liga pastas a testes; o diff escolhe os testes. Mudança de config global (lockfile, config do runner de testes, workflow do CI) roda tudo.
- Só documentação: lint e links.
- Caminho sem regra no mapa: roda o caminho crítico e gera aviso para alguém acrescentar a regra.
- Uma regressão escapou do L1? Acrescente a regra que a teria pego.

## O que não fazer

- Rodar L2 ou L3 no laptop "para garantir" ([regra](../regras/nada-pesado-no-laptop.md)).
- Retries altos no L1 para esconder instabilidade: no máximo 1, e o flaky aparece no resumo.
