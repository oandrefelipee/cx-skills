# Fly

Categoria: hospedagem · Estado: esboço

| Campo | Como fazer |
|---|---|
| `deploy.run` | `fly deploy` (em geral disparado pelo CI) |
| `deploy.status` / `deploy.logs` | `fly status`, `fly logs` |
| `deploy.rollback` | `fly deploy --image <imagem anterior>` |
| health | `[[http_service.checks]]` no `fly.toml` |

Armadilhas: estratégia de deploy (`rolling`, `bluegreen`, `canary`) muda o tempo e o risco; migrações via `release_command` rodam antes da troca.

## Aprendizados

| Data | Aprendizado |
|---|---|
| | |
