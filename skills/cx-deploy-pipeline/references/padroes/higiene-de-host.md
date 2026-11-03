# Higiene de host e CI com Docker isolado

Índice: [padrões](INDEX.md) · Vizinhos: [runner self-hosted multiprojeto](runner-self-hosted-multiprojeto.md), [disco e recursos](../../workflows/09-disco-e-recursos.md), [regra: o host não acumula](../regras/host-nao-acumula.md).

Uma VPS que hospeda staging (ou produção) **e** CI enche o disco sozinha: cada deploy deixa imagens órfãs, cada build deixa cache, cada job deixa checkout e `/tmp`. A regra é que **tudo que gera arquivo tem teto ou limpeza automática**, instalada por script versionado no repositório e idempotente, e que o CI nunca encosta no runtime que serve usuários.

## Molde

```
host
├─ runtime (Dokploy/Coolify/compose, root) ... só o orquestrador mexe; higiene tira SÓ cache de build antigo e imagens <none>
├─ agente de CI (usuário próprio)  ........... limites no drop-in do serviço (CPUQuota, MemoryMax, TasksMax)
├─ agente de deploy (usuário próprio) ........ script fixo, chave de deploy só aqui
└─ agente de contêineres (usuário próprio) ... Docker ROOTLESS só dele + user-<uid>.slice com teto de CPU/memória
pipeline: passos pesados num concurrency_group ("<org>/vps-pesado") → um por vez no host
```

## Por que Docker rootless para o CI

- Pôr o agente no grupo `docker` (ou usar o Docker do runtime) = **root no mesmo host** do staging/produção: um PR malicioso ou um `prune` errado derruba o ambiente.
- Rootless: dockerd do próprio usuário (`dockerd-rootless-setuptool.sh install`, `loginctl enable-linger`, faixa em `/etc/subuid`/`subgid`), socket em `/run/user/<uid>/docker.sock`, sem acesso ao Docker do runtime. No Ubuntu 24.04 o AppArmor restringe user namespaces: o pacote `docker-ce-rootless-extras` já traz o perfil do `rootlesskit`.
- Limites: `systemctl set-property user-<uid>.slice CPUQuota=150% MemoryMax=3584M MemorySwapMax=512M` (persistente) cobrem o dockerd e todos os builds.
- Fila hospedada do provedor é a alternativa (isolada, paga por minuto); quando a cota acaba ela **cancela o job em <1 s sem agente** — sintoma clássico.

## Credenciais de agente self-hosted

- Agente e job rodam como o **mesmo usuário**: código de PR lê o token do agente (arquivo ou `/proc`). Não há como esconder por permissão. Mitigue: **um token por agente**, criado no cluster com `allowed_ip_addresses` só do host (IPv4 **e** IPv6, se o host sair pelos dois); vazado, não serve fora do host.
- **Deploy key própria e somente leitura por agente**, gerada pelo usuário do agente. Nunca copie chaves da pasta de outro agente como root: essas pastas são controláveis por código de PR (link simbólico para arquivo do sistema).
- Limpeza de árvore de usuário **como o dono** (`runuser -u <user> -- find ... -exec rm -rf -- {} +`), nunca como root.

## Tetos e limpeza

| Onde | Mecanismo | Frequência |
|---|---|---|
| Cache de build do Docker do CI | `daemon.json` → `builder.gc` (`defaultKeepStorage` + `unused-for`) e `builder prune --keep-storage` | contínuo + diário |
| Imagens/contêineres/redes/volumes do CI | `image prune -a --filter until=48h`, `container/network prune`, volumes do prefixo do CI | diário + fim do job |
| Projetos compose do CI | nome com prefixo (`<proj>-ci-<build>`), `down -v` no `trap` e no hook `pre-exit` | cada job |
| Checkout | hook `pre-exit` apaga o workspace; órfãos > 2 dias no timer | job + diário |
| Runtime (Docker root) | **só** `builder prune --filter until=168h --keep-storage 8GB` e `image prune` (órfãs) | diário |
| `/tmp` dos usuários de CI | > 30 min no job, > 1 dia no timer | job + diário |
| Logs de contêiner do CI | driver `local`, `max-size` 10m × 2 | contínuo |

**Nunca** no Docker do runtime: `system prune`, `image prune -a`, `volume prune` — há outros projetos e dados.

O timer roda com `Nice=15`, `IOSchedulingClass=idle`, `CPUQuota=50%`, pula se houver job em andamento (`pgrep -f 'buildkite-agent bootstrap'` ou equivalente) e escreve **uma linha** no journal: "livre X MB → Y MB". Molde pronto: [`assets/higiene-host.sh`](../../assets/higiene-host.sh).

## Checklist ao ligar um host novo

1. Agente de CI e de deploy separados ([runner multiprojeto](runner-self-hosted-multiprojeto.md)), cada um com token próprio restrito ao IP do host e deploy key própria.
2. Se o CI precisa de Docker: usuário rootless + slice com teto + fila própria + `concurrency_group` com os demais passos pesados.
3. `daemon.json` do CI com GC do BuildKit e log driver com teto.
4. Hook `pre-exit` (checkout, compose do CI, `/tmp`) e hook `environment` que recusa pipeline fora da lista e PR de fork.
5. Timer diário de higiene instalado e uma execução manual conferida no journal.
6. Documentar no repositório (`docs/deploy/vps-higiene.md` no projeto de referência PrivateLab) quem roda, com que teto, e como desfazer.
