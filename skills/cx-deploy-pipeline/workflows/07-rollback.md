# 07 · Rollback

Fase: **depois**. Objetivo: voltar ao último estado bom rápido, sem piorar o banco.

## Regra de migração

A política é **expand-contract** ([padrão](../references/padroes/expand-contract.md)): toda migração implantada é compatível com a versão anterior do app. Por isso o rollback volta **só o app**. Restaurar backup ou descer migração é outra operação e exige o "pode".

## Passos

1. Diga o que está quebrado (evidência redigida) e o plano:

   ```text
   production degradado desde 14:32 (health 1/3, 5xx em /checkout)
   Plano: voltar o app para 2b7e9d0 (deploy anterior). Banco fica.
   Pode?
   ```

2. Ambiente com `needsPode` → espere o "pode". Rollback automático do provedor por health (por exemplo, `FailureAction: rollback`) já pode ter agido: confira `deploy.status` antes.
3. Execute `deploy.rollback` do adaptador (redeploy da versão anterior, rollback pipeline do CI ou painel com o humano).
4. Verifique como no [06](06-verificar-pos-deploy.md).
5. Na branch principal, abra o **revert por PR** (`gh pr create` com `revert: <título>`), para o código voltar a bater com o que está no ar. Branch protegida: nunca push direto.
6. Registre o incidente no relatório do PR (risco materializado, tempo até recuperar) e conte para a taxa de falha do DORA leve.

## Proibido

- Restaurar backup, descer migração ou apagar dados sem o "pode".
- `git push --force` na branch principal.
