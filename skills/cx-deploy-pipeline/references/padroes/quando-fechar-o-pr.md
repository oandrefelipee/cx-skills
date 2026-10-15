# Quando fechar o PR

PRs maiores, com critério: cada PR custa uma rodada de CI, uma revisão e um relatório, então vale acumular o trabalho da mesma história. Mas há hora de parar de acumular.

## Continue acumulando quando

- o próximo commit é da **mesma história ou onda** (mesmo objetivo para quem usa);
- é correção do caminho: lint, teste, revisão, ajuste visual do que já está no PR;
- o diff ainda cabe numa revisão de uma sentada;
- nada no PR precisa ir ao ar antes do resto.

## Feche (abra para revisão ou mescle) quando

| Sinal | Por quê |
|---|---|
| A história está **completa**: os critérios de aceite têm prova | É a unidade natural de revisão e de deploy |
| O diff passou do **limite de revisão** do projeto (referência: ~800 linhas de código revisável, sem contar gerados, lockfile e capturas) | Acima disso a revisão vira leitura por amostragem |
| Há **risco ou migração** que convém isolar | Um PR com migração deve ser fácil de reverter sozinho ([expand-contract](expand-contract.md)) |
| Há **urgência**: correção que precisa ir ao ar | Não segure um conserto atrás de uma história |
| O **CI precisa validar** antes de seguir (contrato novo, mudança de config do CI, dependência atualizada) | Construir em cima de algo não provado multiplica o retrabalho |
| Outra pessoa ou agente **depende** do que está pronto | PR empilhado ou merge parcial destrava o outro |
| A branch está **muito atrás da base** e os conflitos crescem | Quanto mais espera, mais caro o rebase |

## Anti-sinais (não são motivo para fechar)

- "Terminei um arquivo" ou "fiz um commit": commit não é PR.
- Querer ver o CI verde "para ter certeza" de uma mudança pequena que o L0 já cobre.
- Dividir por camada técnica (um PR de banco, um de API, um de tela) a mesma história, sem risco que justifique.
- Fechar no fim do dia ou da sessão: use commit e push de WIP; o PR espera.
- Mudança de documentação ou relatório do próprio PR: entra no mesmo PR.

## Sinais de que fechou tarde demais

- duas histórias sem relação no mesmo diff;
- revisão que pede "divide isso";
- um revert que levaria junto trabalho bom.

Nesses casos, separe por história (branch nova a partir da base, `git cherry-pick` dos commits da outra) antes de pedir revisão.
