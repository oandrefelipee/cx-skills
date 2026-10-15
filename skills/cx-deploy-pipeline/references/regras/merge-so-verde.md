# Merge só com verde

**Regra:** só mescla com todos os `ci.requiredChecks` em `pass` no SHA que vai para a base, revisão aprovada e sem conflito.

**Por quê:** o GitHub é a fonte da verdade. Um check pendente pode falhar; um verde num SHA anterior não prova o atual; um check local é declaração de quem rodou, não prova.

**Como cumprir:** `ci-status.mjs` com saída 0 logo antes do merge; `gh pr merge` sem `--admin`; com merge queue ou trem, a fila prova de novo sobre a base atual.

**Anti-padrão:** "só falta o E2E, que é flaky"; mesclar e "corrigir depois"; tirar o check de obrigatório; mesclar com o check verde de outro SHA.
