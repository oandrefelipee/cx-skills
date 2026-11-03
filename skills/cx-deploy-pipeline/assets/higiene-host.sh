#!/bin/bash
# MOLDE (cx-deploy-pipeline): higiene diária do host (root, via timer): nada acumula sem teto. Ajuste CI_USER, os caminhos
# dos agentes e os tetos para o projeto. Origem: projeto PrivateLab, deploy/vps/higiene.sh.
# Higiene diária da VPS (root, via timer): nada acumula sem teto. Só APAGA o que é regenerável; nunca volume, nunca imagem
# em uso, nunca nada de outro projeto além de cache. Idempotente. Guia: docs/deploy/vps-higiene.md.
#
# O que limpa:
#   CI (Docker rootless do rx-docker-ci): contêineres parados, imagens sem uso há >48h, redes órfãs, volumes de projetos
#     rx-ci-* e o cache de build acima de CI_BUILDKIT_KEEP (o próprio dockerd também tem GC: isto é a rede de segurança)
#   Docker do Dokploy (root): SÓ cache de build com mais de ROOT_BUILD_UNTIL e acima de ROOT_BUILD_KEEP, e imagens órfãs
#     (<none>). NUNCA `image prune -a`, `volume prune` nem `system prune`: há outros projetos e dados nesse Docker.
#   Builds dos agentes do Buildkite com mais de BUILD_DAYS dias e temporários dos usuários de CI com mais de 1 dia.
# Pula tudo se um job do Buildkite estiver rodando. Saída: uma linha de resumo no journal (`journalctl -u rx-vps-higiene`).
set -u

CI_USER="${CI_USER:-rx-docker-ci}"
CI_BUILDKIT_KEEP="${CI_BUILDKIT_KEEP:-6GB}"
ROOT_BUILD_UNTIL="${ROOT_BUILD_UNTIL:-168h}"
ROOT_BUILD_KEEP="${ROOT_BUILD_KEEP:-8GB}"
BUILD_DAYS="${BUILD_DAYS:-2}"

exec 9>/run/rx-vps-higiene.lock
flock -n 9 || { echo "higiene: outra execução em andamento"; exit 0; }
if pgrep -f 'buildkite-agent bootstrap' >/dev/null 2>&1; then
  echo "higiene: job do Buildkite em andamento, pulando"; exit 0
fi

free_before="$(df -Pm / | awk 'NR==2{print $4}')"

# 1) Docker rootless do CI.
if id "$CI_USER" >/dev/null 2>&1; then
  uid="$(id -u "$CI_USER")"
  ci() { sudo -u "$CI_USER" env XDG_RUNTIME_DIR="/run/user/$uid" DOCKER_HOST="unix:///run/user/$uid/docker.sock" docker "$@"; }
  if ci info >/dev/null 2>&1; then
    ci container prune -f >/dev/null 2>&1
    ci image prune -af --filter "until=48h" >/dev/null 2>&1
    ci network prune -f >/dev/null 2>&1
    for v in $(ci volume ls -q 2>/dev/null | grep -E '^rx-ci-'); do ci volume rm "$v" >/dev/null 2>&1; done
    ci builder prune -f --keep-storage "$CI_BUILDKIT_KEEP" >/dev/null 2>&1
  fi
  find -P "$(getent passwd "$CI_USER" | cut -d: -f6)/builds" -xdev -mindepth 1 -maxdepth 1 -type d -mtime +"$BUILD_DAYS" \
    -exec rm -rf {} + 2>/dev/null
fi

# 2) Docker do Dokploy: só cache de build antigo e imagens órfãs.
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  docker builder prune -f --filter "until=$ROOT_BUILD_UNTIL" --keep-storage "$ROOT_BUILD_KEEP" >/dev/null 2>&1
  docker image prune -f >/dev/null 2>&1
fi

# 3) Builds órfãos dos agentes e temporários dos usuários de CI.
for b in /var/lib/buildkite-agent/builds /var/lib/buildkite-deploy-agent/builds; do
  [ -d "$b" ] && find -P "$b" -xdev -mindepth 1 -maxdepth 1 -type d -mtime +"$BUILD_DAYS" -exec rm -rf {} + 2>/dev/null
done
for u in buildkite-agent "$CI_USER"; do
  id "$u" >/dev/null 2>&1 && find -P /tmp -xdev -maxdepth 1 -user "$(id -u "$u")" -mtime +1 -exec rm -rf {} + 2>/dev/null
done

free_after="$(df -Pm / | awk 'NR==2{print $4}')"
echo "higiene: livre ${free_before}MB -> ${free_after}MB (+$((free_after - free_before))MB)"
exit 0
