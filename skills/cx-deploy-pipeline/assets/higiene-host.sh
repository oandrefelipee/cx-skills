#!/bin/bash
# MOLDE (cx-deploy-pipeline): higiene diária do host, rodando como root por um timer. Nada acumula sem teto.
# Ajuste CI_DOCKER_USER, AGENT_TREES e os tetos para o projeto. Guia: references/padroes/higiene-de-host.md.
# Origem: projeto de referência PrivateLab, deploy/vps/higiene.sh.
#
# Só APAGA o que é regenerável. Nunca volume do runtime, nunca imagem em uso, nunca dado de outro projeto.
# Exceção explícita: volumes do Docker rootless do CI com prefixo CI_PREFIX, que são descartáveis por construção
# (cada job sobe o próprio compose com esse prefixo e o derruba com `down -v`).
#
# O que limpa:
#   CI (Docker rootless de CI_DOCKER_USER): contêineres parados, imagens sem uso há mais de 48 h, redes órfãs,
#     volumes que começam literalmente com CI_PREFIX (se definido) e o cache de build acima de CI_BUILDKIT_KEEP (o dockerd também tem GC; isto é a rede de segurança).
#   Docker do runtime (root): SÓ cache de build com mais de ROOT_BUILD_UNTIL acima de ROOT_BUILD_KEEP e imagens órfãs.
#     NUNCA `image prune -a`, `volume prune` nem `system prune`: pode haver outros projetos e dados nesse Docker.
#   Checkouts órfãos dos agentes (mais de BUILD_DAYS dias) e /tmp dos usuários de CI (mais de 1 dia).
#
# Segurança: as árvores dos agentes são controláveis por código de PR (um link simbólico plantado ali). Por isso todo
# `find ... rm` sobre elas roda COMO O DONO (runuser), nunca como root, e root é recusado.
# Pula tudo se houver job do CI rodando. Saída: uma linha no journal ("livre X MB -> Y MB").
set -u

CI_DOCKER_USER="${CI_DOCKER_USER:-ci-docker}"
# Prefixo LITERAL dos volumes do compose do CI (o nome do projeto compose, ex.: "<proj>-ci-"). Vazio = não apaga volume.
CI_PREFIX="${CI_PREFIX:-}"
CI_BUILDKIT_KEEP="${CI_BUILDKIT_KEEP:-6GB}"
ROOT_BUILD_UNTIL="${ROOT_BUILD_UNTIL:-168h}"
ROOT_BUILD_KEEP="${ROOT_BUILD_KEEP:-8GB}"
BUILD_DAYS="${BUILD_DAYS:-2}"
LOCK="${LOCK:-/run/higiene-host.lock}"
# Árvores de checkout, uma por linha: "usuário|caminho|profundidade". A profundidade é a de UM checkout dentro do
# caminho. Buildkite padrão: builds/<agente>/<org>/<pipeline> → 3. Com checkout fixo pelo hook (ex.: $HOME/builds/rx) → 1.
AGENT_TREES="${AGENT_TREES:-buildkite-agent|/var/lib/buildkite-agent/builds|3}"

exec 9>"$LOCK"
flock -n 9 || { echo "higiene: outra execução em andamento"; exit 0; }
if pgrep -f 'buildkite-agent bootstrap' >/dev/null 2>&1; then
  echo "higiene: job do CI em andamento, pulando"; exit 0
fi

# Usuário válido para limpeza: existe e não é root. Agentes costumam ser contas de sistema (uid < 1000), então o
# que protege é rodar como ele e exigir que ele seja dono da base (clean_tree), não o número do uid.
user_ok() { local u="$1" uid; uid="$(id -u "$u" 2>/dev/null)" || return 1; [ "$uid" -ne 0 ]; }

# Apaga, como o dono, entradas com mais de BUILD_DAYS dias na profundidade de um checkout. A base precisa ser
# diretório real (não link) e pertencer ao usuário.
clean_tree() {
  local user="$1" base="$2" depth="$3"
  user_ok "$user" || { echo "higiene: usuário $user recusado"; return 0; }
  [ -d "$base" ] && [ ! -L "$base" ] && [ "$(stat -c %U "$base")" = "$user" ] || return 0
  runuser -u "$user" -- find -P "$base" -xdev -mindepth "$depth" -maxdepth "$depth" -type d -mtime +"$BUILD_DAYS" \
    -exec rm -rf -- {} + 2>/dev/null
}

free_before="$(df -Pm / | awk 'NR==2{print $4}')"

# 1) Docker rootless do CI.
if user_ok "$CI_DOCKER_USER"; then
  uid="$(id -u "$CI_DOCKER_USER")"
  ci() { runuser -u "$CI_DOCKER_USER" -- env XDG_RUNTIME_DIR="/run/user/$uid" DOCKER_HOST="unix:///run/user/$uid/docker.sock" docker "$@"; }
  if ci info >/dev/null 2>&1; then
    ci container prune -f >/dev/null 2>&1
    ci image prune -af --filter "until=48h" >/dev/null 2>&1
    ci network prune -f >/dev/null 2>&1
    if [ -n "$CI_PREFIX" ]; then
      ci volume ls -q 2>/dev/null | while IFS= read -r v; do
        [[ "$v" == "$CI_PREFIX"* ]] && ci volume rm "$v" >/dev/null 2>&1
      done
    fi
    ci builder prune -f --keep-storage "$CI_BUILDKIT_KEEP" >/dev/null 2>&1
  fi
fi

# 2) Docker do runtime: só cache de build antigo e imagens órfãs.
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  docker builder prune -f --filter "until=$ROOT_BUILD_UNTIL" --keep-storage "$ROOT_BUILD_KEEP" >/dev/null 2>&1
  docker image prune -f >/dev/null 2>&1
fi

# 3) Checkouts órfãos e /tmp dos usuários de CI, sempre como o dono. -mindepth 1: o próprio /tmp nunca é candidato.
users=""
while IFS='|' read -r u path depth; do
  [ -n "$u" ] || continue
  clean_tree "$u" "$path" "${depth:-1}"
  users="$users $u"
done <<<"$AGENT_TREES"
for u in $users "$CI_DOCKER_USER"; do
  user_ok "$u" || continue
  runuser -u "$u" -- find -P /tmp -xdev -mindepth 1 -maxdepth 1 -user "$u" -mtime +1 -exec rm -rf -- {} + 2>/dev/null
done

free_after="$(df -Pm / | awk 'NR==2{print $4}')"
echo "higiene: livre ${free_before}MB -> ${free_after}MB (+$((free_after - free_before))MB)"
exit 0
