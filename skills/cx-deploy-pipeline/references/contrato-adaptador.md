# Contrato do adaptador

O que todo projeto expõe para a skill funcionar com qualquer provedor. Cada campo é um comando do projeto (de preferência um script do `package.json`) ou `null` quando o provedor não oferece. Campo ausente = perguntar ao humano. Valide com `node scripts/checar-config.mjs`.

Placeholders nos comandos: `<pr>`, `<check>`, `<env>`, `<sha>`, `<versao>`.

## CI

| Campo | Entrada | Saída esperada | Obrigatório |
|---|---|---|---|
| `ci.provider` | - | nome do provedor (ver `references/provedores/ci/`) | sim |
| `ci.requiredChecks` | - | contextos exigidos na proteção da branch, com o nome exato | sim |
| `ci.status` | `<pr>` | tabela check × estado × link; saída 0 verde, 1 falha, 8 pendente (o projeto chama `scripts/ci-status.mjs`) | sim |
| `ci.logs` | `<pr> <check>` | trecho do erro, até ~200 linhas, passado por `redigir.mjs` | sim |
| `ci.rerun` | `<pr> --failed` | id da nova execução | não |
| `ci.flaky` | - | testes instáveis conhecidos (comando, `mcp: <ferramenta>` ou `null`) | não |
| `ci.validateConfig` | - | ok ou erros da config do CI | não |
| `ci.cli`, `ci.mcp` | - | nomes da CLI e do servidor MCP, quando instalados | não |

## Merge

| Campo | Valores | Obrigatório |
|---|---|---|
| `merge.estrategia` | `trem`, `merge-queue` ou `direto` | sim |
| `merge.comandoTrem` | como montar e validar o lote (só com `trem`) | com `trem` |
| `merge.metodo` | `squash`, `merge` ou `rebase` | não |

## Deploy

| Campo | Entrada | Saída esperada | Obrigatório |
|---|---|---|---|
| `deploy.provider` | - | nome (ver `references/provedores/hospedagem/`) | sim |
| `deploy.environments[]` | - | `name`, `trigger` (`auto-main`, `tag v*`, `manual`), `needsPode`, `healthUrls[]`, `smoke` | sim |
| `deploy.run` | `<env> [<sha>]` | id do deploy | só se o gatilho não for automático |
| `deploy.status` | `<env>` | SHA no ar, estado, hora | sim |
| `deploy.logs` | `<env> [serviço]` | logs recentes, redigidos | sim |
| `deploy.rollback` | `<env> [<versao>]` | versão anterior no ar | sim |
| `deploy.migrations` | - | `expand-contract` (padrão), `forward-only` ou `down-permitido` | sim |

Ambiente cujo nome contém "prod" precisa de `needsPode: true`; o `checar-config` recusa o contrário.

## Recursos, segredos e relatórios

| Campo | Significado | Obrigatório |
|---|---|---|
| `recursos.pisoDiscoGb` | abaixo disso o agente para ([09](../workflows/09-disco-e-recursos.md)) | sim |
| `recursos.proibidoNoLaptop[]` | comandos que só rodam no CI | sim |
| `segredos.onde` | onde o humano cadastra os segredos; **nunca** o valor | sim |
| `relatorios.dir` | pasta dos relatórios HTML (padrão `docs/relatorios/pr`) | não |
| `antesDepois.caminhosUi[]` | globs que contam como interface ([10](../workflows/10-antes-e-depois.md)) | não |
| `antesDepois.matriz[]` | larguras e temas capturados (ex.: `1440 claro`, `390 escuro`) | não |
| `antesDepois.capturar` | comando do projeto que salva as capturas (`<tela>`, `<lado>` = `antes` ou `depois`) | não |
| `antesDepois.desenhos` | onde ficam os desenhos aprovados (wireframes, protótipos) | não |

## Exemplo

O exemplo completo (CircleCI + Dokploy, projeto fictício) está em [`../assets/adaptador-exemplo.json`](../assets/adaptador-exemplo.json).

```text
ci        circleci · exige "ci/circleci: gates" e "ci/circleci: e2e-afetado"
merge     trem (lote de 3 a 4 PRs) · squash
deploy    dokploy · staging automático na main · production por tag, com "pode"
banco     expand-contract
recursos  piso 5 GB · E2E, smoke e docker só no CI
```
