# Deploy só termina verificado

**Regra:** o deploy só está pronto quando o SHA no ar é o esperado e o health e o smoke do ambiente estão verdes.

**Por quê:** "o provedor disse ok" significa que o contêiner subiu, não que o produto funciona. O rollback automático por health cobre só a falha de health.

**Como cumprir:** `deploy.status` → `checar-health.mjs --ambiente <env> --esperar-sha <sha>` → `smoke`. Profundidade pelo escopo do diff ([smoke e canário](../padroes/smoke-e-canario.md)).

**Anti-padrão:** encerrar no "deploy finished"; health que só responde 200 sem tocar banco nem dependências.
