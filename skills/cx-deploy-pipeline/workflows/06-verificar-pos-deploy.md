# 06 · Verificar pós-deploy

Fase: **depois**. Objetivo: provar que o SHA certo está no ar e saudável, e fechar o relatório.

## Passos

1. `deploy.status`: o SHA implantado é o esperado? Se não, o deploy não terminou ou subiu outra coisa.
2. Health:

   ```text
   node scripts/checar-health.mjs --ambiente <env> [--esperar-sha <sha>] [--linha-de-base base.json]
   ```

   Saudável = maioria das tentativas 2xx e mediana abaixo de 2x a linha de base.
3. Smoke do ambiente (`smoke` do adaptador). A profundidade segue o escopo do diff ([smoke e canário](../references/padroes/smoke-e-canario.md)): só config → health; backend → health e smoke; front → também uma captura.
4. Alertas que pedem decisão: 5xx novo, health falhando 2 vezes seguidas, latência acima de 2x a base, erro novo no observabilidade. Degradado → [07](07-rollback.md), com o "pode" se o ambiente exigir.
5. Atualize o relatório do PR com a seção Deploy e o DORA leve do período ([DORA leve](../references/padroes/dora-leve.md)); regenere com `relatorio-pr.mjs`.

## Saída

| Ambiente | SHA | Health | Smoke | Veredito |
|---|---|---|---|---|
| staging | 3f9a2c1 | 2/2 ok, 180 ms | ok | saudável |
