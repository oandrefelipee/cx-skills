# O host não acumula

Índice: [regras](INDEX.md) · Como aplicar: [higiene de host](../padroes/higiene-de-host.md).

**Regra:** todo processo que gera arquivo no host (build, deploy, job de CI, teste, log) tem **teto** ou **limpeza automática**, instalada por script versionado e idempotente. Nada depende de alguém lembrar de limpar.

**Por quê:** disco cheio derruba o staging, quebra deploy no meio e trava o CI, sempre na pior hora. Cache e imagens órfãs crescem sem ninguém ver (num caso real, ~10 GB de cache de build e dezenas de imagens órfãs em semanas).

**Como cumprir:**
- Limpeza no fim de cada job (hook `pre-exit`, `trap`) e um timer diário de rede de segurança.
- Tetos onde o software permite (GC do BuildKit, `max-size` de log, `--keep-storage`).
- No runtime que serve usuários, só o que é regenerável: cache de build antigo e imagens órfãs. Nunca volume, nunca imagem em uso.
- O CI nunca usa o Docker do runtime (ver Docker rootless no padrão).
- Toda limpeza registra quanto liberou, para dar para medir.

**Caso de borda:** se a limpeza precisar apagar algo que não é claramente regenerável (volume, dados de outro projeto), é ação irreversível: vale a regra do ["pode" humano](pode-humano.md).
