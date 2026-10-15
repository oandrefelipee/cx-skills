# 09 · Disco e recursos

Fase: **depois** (ou a qualquer momento). Objetivo: não perder trabalho nem corromper o repositório quando a máquina aperta.

## Protocolo de parada (abaixo do piso)

`node scripts/preflight-disco.mjs` sai com 1 → siga em ordem:

1. **Pare o pesado:** build, E2E, instalação, download, contêiner.
2. **Salve o trabalho:** commit do WIP (`wip: <o que falta>`) e push. Push primeiro, limpeza depois.
3. **Limpe só o que é seu e seguro:** saídas de teste, caches de build da sua worktree, worktrees órfãs suas. Nunca pasta de outro agente, volume de banco, `~` inteiro ou nada fora do projeto sem o "pode".
4. **Avise** com o número livre, o piso e o que ficou pendente.

## Memória e CPU

- Máquina com carga acima do número de núcleos: não paralelize testes; rode o mínimo e deixe o resto para o CI.
- Um E2E por vez na máquina; respeite travas e portas de outros agentes.
- Não mate processo que você não iniciou.

## Prevenção

- Rode o preflight antes de install, build e E2E.
- Não clone repositórios grandes nem baixe imagens para "olhar": leia pela web ou pela API.
