# CircleCI

Categoria: ci · Estado: completo

O CircleCI roda os gates e devolve um check por job ao PR (`ci/circleci: <job>`). O merge continua decidido pelo GitHub.

## Como atende o contrato

| Campo | Como fazer |
|---|---|
| `ci.status` | `scripts/ci-status.mjs <pr>` (os jobs aparecem como checks do PR) |
| `ci.logs` | MCP: logs de falha do build; ou CLI `circleci`; ou o link do check |
| `ci.rerun` | MCP: rerun do workflow a partir do job que falhou; ou o botão "Rerun from failed" |
| `ci.flaky` | MCP: busca de testes instáveis (exige resultados JUnit enviados com `store_test_results`) |
| `ci.validateConfig` | `circleci config validate` (local, sem gastar crédito) |
| `deploy.rollback` (quando há pipeline de rollback) | MCP: rodar o pipeline de rollback; ou o painel de deploys |

## CLI

- `circleci` com token do humano (`circleci setup` ou a variável de ambiente que ele define; o agente nunca digita o token).
- Antes de commitar mudança no `.circleci/config.yml`: `circleci config validate`.
- Versões novas trazem subcomandos para acompanhar pipelines e jobs: `circleci --help`.

## MCP

- Servidor oficial: [CircleCI-Public/mcp-server-circleci](https://github.com/CircleCI-Public/mcp-server-circleci).
- Ferramentas úteis: status do último pipeline, logs de falha, resultados de teste filtrados por falha, testes instáveis, rerun de workflow, validação de config, rollback. Os nomes mudam entre versões: liste as ferramentas antes de usar.
- Servidor remoto: exija token por requisição; não exponha sem autenticação.

## Armadilhas

- O nome do check é `ci/circleci: <nome do job>`; renomear o job quebra a proteção da branch.
- Ligue "Only build pull requests" e "Auto-cancel redundant workflows"; deixe forks desligados.
- Créditos por minuto dependem do tamanho da máquina: rode o E2E completo só no lote ou na branch principal.
- Cache de dependências restaurado pode impedir o `postinstall` de pacotes privados de baixar o conteúdo; prefira instalar sem cache ou conferir depois.
- `store_test_results` (JUnit) é o que alimenta a detecção de instáveis e os testes falhos no painel.
- Runner self-hosted: usuário próprio, limites de CPU e memória, nada de root ([segurança](../../seguranca.md)).

## Segurança

- Segredos em variáveis de projeto ou contextos, nunca no `config.yml`.
- Nunca habilite "passar segredos para builds de forks".
- Primeiro passo de cada job confere a origem do repositório.

## Aprendizados

| Data | Aprendizado |
|---|---|
| | |

## Fontes

- [Servidor MCP oficial](https://github.com/CircleCI-Public/mcp-server-circleci) · [skills oficiais](https://github.com/CircleCI-Public/skills)
