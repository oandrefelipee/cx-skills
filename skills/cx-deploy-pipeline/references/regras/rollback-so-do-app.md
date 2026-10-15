# Rollback volta só o app

**Regra:** toda migração segue [expand-contract](../padroes/expand-contract.md), então a versão anterior do app roda com o banco atual. O rollback troca só o app. Restaurar backup ou descer migração exige o "pode".

**Por quê:** voltar o app é rápido e reversível; mexer no banco sob pressão perde dados.

**Como cumprir:** na revisão do PR, toda migração responde "a versão anterior roda com isto?". Se não, divida o PR.

**Anti-padrão:** renomear ou apagar coluna no mesmo deploy que para de usá-la; `down` automático no rollback.
