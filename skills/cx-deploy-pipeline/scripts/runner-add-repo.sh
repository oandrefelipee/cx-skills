#!/bin/bash
# Liga um repositório a um agente Buildkite self-hosted já instalado (com bk-add-repo), por deploy key somente leitura.
# Uso: runner-add-repo.sh <dono>/<repo> <host-ssh> [pipeline-slug]
# Requer: ssh para o host (root), gh logado com admin no repo, bk logado (opcional: sem ele, só imprime o comando).
# A chave privada nunca sai da VPS; nada de segredo é lido nem impresso.
set -eu
repo="${1:-}"; host="${2:-}"; slug="${3:-}"
[[ "$repo" =~ ^[A-Za-z0-9._-]+/[A-Za-z0-9._-]+$ && -n "$host" ]] || { echo "Uso: $0 <dono>/<repo> <host-ssh> [pipeline-slug]" >&2; exit 1; }
[ "${DRY_RUN:-}" = "1" ] && { echo "+ ssh $host bk-add-repo $repo"; echo "+ gh api repos/$repo/keys (read_only)"; [ -n "$slug" ] && echo "+ bk api pipelines/$slug -X PATCH repository=git@github.com:$repo.git"; exit 0; }
# stderr fica visível: conexão, chave de host ou bk-add-repo ausente precisam de diagnóstico.
pub="$(ssh "$host" "bk-add-repo $repo" | tail -n1)"
case "$pub" in ssh-ed25519\ *) ;; *) echo "Falha ao obter a chave pública (bk-add-repo instalado em $host?)." >&2; exit 1;; esac
# Idempotente: se a chave já está no repo (execução anterior que parou depois), não cadastra de novo (o GitHub dá 422).
corpo="$(echo "$pub" | awk '{print $2}')"
if gh api "repos/$repo/keys" --paginate --jq '.[].key' | awk '{print $2}' | grep -qxF "$corpo"; then
  echo "Deploy key já cadastrada em $repo."
else
  gh api "repos/$repo/keys" -f title="buildkite-$(echo "$host" | tr -c 'A-Za-z0-9\n' '-')" -f key="$pub" -F read_only=true >/dev/null
  echo "Deploy key (somente leitura) cadastrada em $repo."
fi
if [ -n "$slug" ] && command -v bk >/dev/null 2>&1; then
  bk api "pipelines/$slug" -X PATCH -d "{\"repository\":\"git@github.com:$repo.git\"}" >/dev/null
  echo "Pipeline $slug agora usa a URL SSH."
else
  echo "Falta: pipeline do Buildkite com repository=git@github.com:$repo.git (bk api pipelines/<slug> -X PATCH -d '{\"repository\":...}')."
fi
