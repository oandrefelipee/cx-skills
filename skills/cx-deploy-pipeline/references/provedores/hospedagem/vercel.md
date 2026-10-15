# Vercel

Categoria: hospedagem · Estado: esboço

| Campo | Como fazer |
|---|---|
| `deploy.run` | automático por push; prévia por PR, produção na branch principal |
| `deploy.status` | check do deploy no PR; `vercel inspect <url>` |
| `deploy.rollback` | `vercel rollback` ou promover um deploy anterior |
| health | a prévia do PR é o smoke; produção com verificação própria |

Armadilhas: a prévia publica um check no PR; não a confunda com o CI. Variáveis por ambiente (Production, Preview, Development).

## Aprendizados

| Data | Aprendizado |
|---|---|
| | |
