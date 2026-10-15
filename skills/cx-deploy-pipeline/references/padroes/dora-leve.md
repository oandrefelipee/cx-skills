# DORA leve

Quatro números por período (por mês, por exemplo), tirados do GitHub e do registro de deploys. Sem painel, sem meta por pessoa: servem para ver a tendência.

| Número | Como medir sem ferramenta |
|---|---|
| Frequência de deploy | deploys em produção no período (tags ou registro do provedor) |
| Tempo até produção | mediana do primeiro commit do PR até o deploy em produção que o contém |
| Taxa de falha | deploys que pediram rollback ou correção urgente ÷ deploys |
| Recuperação | mediana do início da falha até o serviço saudável de novo |

## Onde aparecem

No relatório do PR (`dora` do JSON; [formato](../relatorio-pr.md)), com o período. O agente atualiza ao fechar o [06](../../workflows/06-verificar-pos-deploy.md) ou o [07](../../workflows/07-rollback.md).

## Cuidados

- Rollback conta como falha mesmo que tenha sido rápido.
- Número ausente é "—", nunca estimado.
- PRs maiores e lotes não pioram a frequência se o deploy continua frequente.

Fonte: [dora.dev](https://dora.dev/guides/dora-metrics/).
