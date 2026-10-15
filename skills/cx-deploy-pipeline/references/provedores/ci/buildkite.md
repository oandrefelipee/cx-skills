# Buildkite

Categoria: ci · Estado: esboço

## Como atende o contrato

| Campo | Como fazer |
|---|---|
| `ci.status` | `scripts/ci-status.mjs <pr>` (o Buildkite publica checks no GitHub) |
| `ci.logs` | CLI `bk` ou o link do check |
| `ci.rerun` | "Retry" do job no painel ou pela CLI |

## Armadilhas

- Os agentes rodam na sua infraestrutura: mesmas regras de runner self-hosted ([segurança](../../seguranca.md)).

## Aprendizados

| Data | Aprendizado |
|---|---|
| | |
