# Runner self-hosted multiprojeto

Um agente de CI numa VPS que atende **vários repositórios do mesmo dono**, sem ficar amarrado a um projeto. Vale para Buildkite (exemplo abaixo); a ideia serve para qualquer runner.

## Antes de agir: entrevistar o dono (opções, recomendada primeiro)

Se algo não estiver no adaptador, pergunte, nunca assuma:

| Dúvida | Opções |
|---|---|
| Qual host? | A VPS que já existe e tem folga (recomendada) · VPS nova só de CI · Mac (só se o dono pedir) |
| Limites de CPU e memória? | Padrão conservador `300%` e `5G` com o staging no mesmo host (recomendada) · mais folga se o host for só de CI |
| Quais repos entram agora? | Só o que o dono nomeou (recomendada) · todos os privados (exige confirmação repo a repo) |
| Fila | Uma fila compartilhada, um job por vez (recomendada) · uma fila por projeto |

## Peças

1. **Deploy key por repositório**, somente leitura, gerada **na VPS** (a privada nunca sai): `~buildkite-agent/.ssh/deploy_<dono>_<repo>`. Chave pessoal ou token amplo no agente é proibido.
   **Limite de confiança:** todas as chaves do agente ficam legíveis pelo mesmo usuário Unix, então um job de PR de qualquer repo pode ler `deploy_*` e clonar os outros (`GIT_SSH_COMMAND` só escolhe a chave, não restringe). Só junte no mesmo agente repos do **mesmo dono e mesmo nível de confiança**, sem PR de fork; repo mais sensível ganha usuário e agente próprios. O hook `environment` recusa pipeline fora da lista.
2. **Hook `environment` global** (`/etc/buildkite-agent/hooks/`), com `no-local-hooks` e `no-plugins`: escolhe o diretório de checkout por pipeline e o `GIT_SSH_COMMAND` pela `BUILDKITE_REPO` (`git@github.com:dono/repo.git`), com `IdentitiesOnly`.
3. **URL SSH no pipeline** (`bk api pipelines/<slug> -X PATCH -d '{"repository":"git@github.com:dono/repo.git"}'`); com HTTPS a chave não é usada.
4. **Token do agente pelo cofre, por pipe**, sem arquivo local nem histórico:
   `export BW_SESSION=$(bw unlock --raw) && bw sync && bw get password "<item>" | ssh <host> 'install -m 600 /dev/stdin /root/buildkite-agent.token'`
5. **Limpeza**: `pre-exit` apaga o workspace do job; timer numa unit endurecida (NoNewPrivileges, ProtectSystem=strict, ReadWritePaths mínimo), como o usuário do agente, sob `flock` e **pulando se houver job** (`pgrep -f 'buildkite-agent bootstrap'`), **só apaga** (`find -P -xdev -delete`): caches, navegadores antigos e checkouts órfãos com mais de 2 dias (o mesmo limite da [higiene de host](higiene-de-host.md); num host com os dois timers, vale o diário). **Nunca rode git nem outro binário sobre workspace deixado por job** (conteúdo não confiável). O journal do host (que guarda logs de outros serviços) só é limitado com aprovação do dono. "Sempre limpar para não ficar bloat" é regra do dono.
6. **Segredos por pipeline** em `/etc/buildkite-agent/secrets/<slug>.env` (`root:agente`, 640), carregados pelo hook com parse seguro (só `KEY=valor`, `KEY` em `[A-Z0-9_]+`, sem `source`). Gravação por `bk-set-secret <slug> <KEY>` com o valor no stdin, nunca no argv: `bw get password "<item>" | ssh <host> 'bk-set-secret <slug> <KEY>'`.
7. **Instalador idempotente com `DRY_RUN=1`**, sem dependência do repo (a versão do Playwright vem de variável, não do `package.json`).

## Agente de deploy separado (regra de ouro: chave de deploy nunca no agente que roda PR)

Achado de 2026-10-19: filtrar segredo de deploy por `BUILDKITE_BRANCH`/`BUILDKITE_PULL_REQUEST` no hook do agente de build **não protege nada**. Todos os builds rodam como o mesmo usuário Unix, que lê os arquivos de segredo direto, e os metadados do Buildkite são falsificáveis por quem edita o `pipeline.yml` (PR executa código sem revisão). Segredo que implanta (Dokploy, cloud, registry de produção) vai para um **segundo agente**:

1. **Usuário Unix próprio** (`bk-deploy`): sem shell, sem sudo, sem Docker; nem ele lê o que é do agente de build nem o contrário (o instalador testa os dois sentidos e falha se vazar).
2. **Cluster próprio no Buildkite, com token próprio** (e pipeline próprio, sem gatilho do GitHub, disparado por `trigger` do pipeline de CI). Num mesmo cluster, o usuário de build lê a config do agente dele, copia o token e registra um agente falso na fila de deploy. Pipelines de clusters diferentes só se disparam com uma *rule* `pipeline.trigger_build.pipeline` (a API REST ignora `conditions`; use a UI se quiser). O instalador recusa o token do agente de build.
3. **Hooks de nível de agente** (`root:root`, `hooks-path` próprio, `no-plugins`, `no-local-hooks`, `strict-single-hooks`): `checkout` não baixa nada e `command` **ignora o comando do pipeline**, executando só um script fixo `root:root` (`/usr/local/sbin/...`). Allowlist de variáveis de ambiente vazia (`--enable-environment-variable-allowlist` com `^$`) e `--protected-environment-variables` (`BASH_ENV`, `LD_*`, `GIT_*`, ...).
4. **Script fixo** confere pipeline, org, repositório, origem do build, branch, ausência de PR e que o commit é a ponta atual da branch (lida com deploy key de leitura do próprio usuário de deploy). O efeito do script não pode depender de entrada: o pior caso falsificado deve ser "implantar o que já está na main". Limpa o ambiente do job e lê a chave de arquivo `root:bk-deploy 0640`, gravado por um helper que recebe o valor no stdin.
5. **Unit do systemd com sandbox**: `ProtectSystem=strict`, `PrivateTmp`, `PrivateDevices`, `InaccessiblePaths` do agente de build, `/root` e Docker (variável de ambiente como `BASH_ENV` só vira ataque se o processo lê um arquivo que o atacante controla; feche os diretórios graváveis por outros usuários).
6. O instalador do agente de build **remove** qualquer linha do segredo de deploy dos arquivos de segredo e o helper de gravação recusa esse prefixo.

Exemplo concreto: `deploy/ci/buildkite-deploy-agent-vps.sh` e `deploy/ci/bk-deploy-staging.sh` do PrivateLab; prova com build de branch que mira a fila (comando malicioso não executa) e job com `LD_PRELOAD` recusado.

## Armadilha do exit 128

Job do agente self-hosted que morre em ~30 s no checkout com `exit status 128` é **clone sem credencial** num repo privado. Os agentes hospedados clonam pelo app do GitHub; o self-hosted não tem nada. Corrija com deploy key (peças 1 a 3), não com token no pipeline. Confira também se o `known_hosts` tem o github.com.

## Segurança

Ver [seguranca.md](../seguranca.md): usuário sem sudo e sem socket do Docker, PRs de fork não compilam, nenhum segredo em arquivo versionado. Nunca reinicie o agente com job em andamento: confira (`pgrep -f 'buildkite-agent bootstrap'` vazio, ou o painel sem job no agente) e só então `systemctl restart buildkite-agent`; depois, `journalctl -u buildkite-agent -n 50` para ver o registro.

## Script genérico

`scripts/runner-add-repo.sh <dono>/<repo> <host-ssh> [pipeline-slug]` faz os passos 1 a 3. É bash e precisa de `ssh` e `gh`; o `bk` é opcional (sem ele, imprime o passo do pipeline). Idempotente: pula a chave já cadastrada. Sem segredo: só lida com a chave pública.
