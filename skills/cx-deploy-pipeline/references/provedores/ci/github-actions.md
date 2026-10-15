# GitHub Actions

Categoria: ci · Estado: completo

## Como atende o contrato

| Campo | Como fazer |
|---|---|
| `ci.status` | `scripts/ci-status.mjs <pr>` (lê `gh pr checks`) |
| `ci.logs` | `gh run view <run-id> --log-failed`; o run-id está no link do check |
| `ci.rerun` | `gh run rerun <run-id> --failed` |
| `ci.flaky` | sem detecção nativa: histórico dos runs ou relatório JUnit do projeto |
| `ci.validateConfig` | `actionlint`, se instalado; senão o próprio GitHub acusa no push |
| `deploy.run` (quando o deploy é um workflow) | `gh workflow run <arquivo> -f ambiente=<env> --ref <sha>` |
| `deploy.rollback` | rodar o mesmo workflow de deploy no SHA anterior |

## CLI e MCP

- CLI: `gh` (o humano faz `gh auth login`; o agente confere com `gh auth status`).
- MCP: o servidor MCP oficial do GitHub expõe runs, jobs e logs; use se estiver instalado.

## Armadilhas

- Check exigido com merge queue precisa do gatilho `merge_group`, além de `pull_request`; senão a fila nunca fica verde.
- O nome exigido é o do job (como aparece no check), não o do arquivo.
- Um check só aparece na lista de exigíveis depois de rodar pelo menos uma vez recentemente.
- `concurrency` com `cancel-in-progress` no PR economiza minutos; na branch principal, não cancele.
- Cota de minutos e cobrança param o CI sem erro no código: o check fica pendente ou some.
- Cache de dependências pode pular o `postinstall` de pacotes privados; confira que o pacote realmente baixou.

## Segurança

- `permissions:` mínimas no topo do workflow (`contents: read`), ampliadas por job.
- Ações de terceiros fixadas por SHA, não por tag.
- `pull_request_target` com checkout do código do PR executa código de fora com segredos: evite.
- PR de fork não recebe segredos; não contorne.

## Aprendizados

| Data | Aprendizado |
|---|---|
| | |

## Fontes

- [Merge queue](https://docs.github.com/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue) · [checks exigidos](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks) · [`gh pr checks`](https://cli.github.com/manual/gh_pr_checks)
