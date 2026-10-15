# 05 · Deploy com o "pode"

Fase: **merge e deploy**. Objetivo: subir um SHA conhecido para um ambiente, com o humano decidindo quando o ambiente exige.

## Passos

1. Leia o ambiente em `deploy.environments` do adaptador: `trigger`, `needsPode`, `healthUrls`, `smoke`.
2. Se o `trigger` é automático (por exemplo, a cada merge na principal), não dispare nada: só acompanhe e vá para [06](06-verificar-pos-deploy.md).
3. Monte o resumo para o "pode":

   ```text
   Deploy em production
     SHA        3f9a2c1 (PR #42, #44)
     Migrações  1, expand (só acrescenta coluna)
     Health     2 URLs · smoke deploy:smoke production
     Volta      redeploy da versão anterior; migração fica
   Pode?
   ```

4. `needsPode: true` → espere um "pode" explícito, nesta conversa, para este deploy. Um "pode" anterior não vale para outro deploy.
5. Dispare pelo `deploy.run` do adaptador (ou tag, ou painel com o humano). Segredo de build ou de ambiente: o humano cola no painel; você nunca digita.
6. Acompanhe `deploy.status` até terminar; logs por `redigir.mjs`.

## Proibido

- Implantar SHA que não passou no portão do 04.
- Criar serviço, domínio ou banco novo sem o "pode" (são mudanças de infraestrutura, não deploy).
