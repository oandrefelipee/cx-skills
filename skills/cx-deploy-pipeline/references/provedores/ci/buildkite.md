# Buildkite

Categoria: ci · Estado: em uso (PrivateLab; agente self-hosted multiprojeto na VPS)

## Como atende o contrato

| Campo | Como fazer |
|---|---|
| `ci.status` | `scripts/ci-status.mjs <pr>` (o Buildkite publica checks no GitHub) |
| `ci.logs` | CLI `bk` (`bk build view`, `bk job log`) ou o link do check |
| `ci.rerun` | "Retry" do job no painel ou `bk build rebuild` |

## Configuração que é do dono

Conta, app do GitHub, pipeline, segredos (*Cluster → Secrets*) e token do agente são feitos pelo dono, no painel. O agente nunca faz login por automação de navegador: foi assim que a conta do CircleCI acabou bloqueada.

## Economia de CI

O plano grátis tem limite de usuários e de retenção, não de minutos (os minutos são da sua máquina). O custo real é o tempo do agente e a carga na VPS:

| Ajuste | Onde | Efeito |
|---|---|---|
| **Cancel intermediate builds** (fora da branch principal) | Pipeline → Builds | Push novo cancela o build em andamento da mesma branch |
| **Skip intermediate builds** | Pipeline → Builds | Builds na fila da mesma branch pulam para o último commit |
| **Pular builds de branch cobertas por PR** | Pipeline → GitHub | Não roda duas vezes (branch e PR) o mesmo commit |
| PRs de forks: **não** | Pipeline → GitHub | Segurança e custo |
| `branches:` nos passos | `pipeline.yml` | E2E completo e smoke só na principal e no trem; PR roda gates e E2E afetado |
| `[skip ci]` na mensagem | commit | Para commits só de docs ou tracking |
| Agentes hospedados (ou um job por vez no self-hosted, `spawn=1`) | fila | Não disputa CPU e memória com o staging da VPS |
| **PR por história** | fluxo | Menos rodadas: ver [quando fechar o PR](../../padroes/quando-fechar-o-pr.md) |

## Agente self-hosted multiprojeto

Padrão completo, com entrevista ao dono, em [runner-self-hosted-multiprojeto](../../padroes/runner-self-hosted-multiprojeto.md). Resumo:

- **Deploy key por repo** (`bk-add-repo <dono>/<repo>` na VPS; cadastro com `gh api repos/<dono>/<repo>/keys -F read_only=true`) e **hook `environment`** global escolhendo checkout e `GIT_SSH_COMMAND` por `BUILDKITE_REPO`. Script: `scripts/runner-add-repo.sh`.
- **URL SSH no pipeline**: `bk api pipelines/<slug> -X PATCH -d '{"repository":"git@github.com:dono/repo.git"}'`.
- **Token do agente pelo Bitwarden, por pipe**: `bw get password "<item>" | ssh <host> 'install -m 600 /dev/stdin /root/buildkite-agent.token'`.
- **Limpeza**: `pre-exit` apaga o workspace; timer semanal endurecido só apaga caches e `builds/*` órfãos (sem git sobre workspace, sem tocar com job rodando); journal do host só com aprovação.
- **Segredos por pipeline**: `/etc/buildkite-agent/secrets/<slug>.env` via `bk-set-secret <slug> <KEY>` com o valor no stdin (`bw get password ... | ssh host 'bk-set-secret ...'`).
- **Exit 128 no checkout** em ~30 s = clone sem credencial (self-hosted não tem o app do GitHub dos hospedados).
- Não reinicie o agente com job em andamento (`journalctl -u buildkite-agent`).

## Armadilhas

- **Pipeline criada no "GitHub Actions mode"**: o passo inicial vira o plugin `github-actions` e o webhook do repo aponta para um gatilho `bktr_…` que responde 200 mas não cria build no modo normal. Corrija pela API: `configuration` com `buildkite-agent pipeline upload`, `provider_settings.github_actions_mode=false`, `trigger_mode=code`, aponte o webhook do repo para o `provider.webhook_url` da pipeline e desligue o gatilho antigo (`PATCH /pipelines/<slug>/triggers/<id>` com `enabled:false`).
- **Imagem padrão dos agentes Linux hospedados** é Ubuntu 22.04 com Node 20: ferramenta que lê config `.ts` (oxfmt, etc.) falha. Use `image:` na raiz do `pipeline.yml` (ex.: `node:24-bookworm`; precisa de git, bash e ca-certificates).
- O job hospedado roda como root: `initdb` do PostgreSQL recusa root; rode o smoke com `runuser -u <usuário comum>`.
- `skip_pull_request_builds_for_existing_commits`: o push gera o build de branch e o evento de PR é pulado; o status vai ao mesmo SHA, então o PR mostra o check normalmente.
- Repo privado no GitHub Free não tem proteção de branch nem rulesets: a trava de merge é o `ci-status` do fluxo, e ele decide só pelos `ci.requiredChecks` do adaptador. Um CI antigo que ainda reporta (ex.: app do CircleCI instalado) aparece como informativo e não precisa ser desinstalado para trocar de provedor.
- Agente self-hosted (reserva): roda na sua infraestrutura: mesmas regras de runner self-hosted ([segurança](../../seguranca.md)). Use `no-plugins`, `no-local-hooks` e um usuário sem `sudo` nem socket do Docker.
- O nome do check no GitHub só aparece depois do primeiro build: atualize a proteção da branch depois dele.
- O tap do Homebrew (`buildkite/buildkite`) precisa de `brew trust` antes de `brew install buildkite/buildkite/bk`. Isso é do dono.

## Aprendizados

| Data | Aprendizado |
|---|---|
| 2026-10-15 | CircleCI bloqueou a conta por login automatizado; migração para Buildkite |
| 2026-10-16 | Agentes Linux hospedados (`linux-medium`) no lugar da VPS: gates com smoke ~3 min, E2E afetado ~2,5 min |
| 2026-11-02 | Fila hospedada sem cota **cancela o job ~0,5 s depois de `runnable`, sem agente** (`started_at` nulo). Saída: agente próprio com Docker rootless (fila `privatelab-docker`) e `concurrency_group` comum aos passos pesados do host. `BUILDKITE_BUILD_CHECKOUT_PATH` no hook `environment` define o checkout; `buildkite-agent secret get` lê segredo do cluster em qualquer agente; filas do cluster criadas por `bk api --method POST /clusters/<id>/queues` |
| 2026-10-19 | Agente self-hosted virou multiprojeto: deploy key somente leitura por repo, hook `environment` por pipeline, token via Bitwarden por pipe, limpeza semanal; o 128 no checkout era clone sem credencial |
