# 04 · Mesclar com segurança

Fase: **merge e deploy**. Objetivo: levar à branch principal só o que está provado, com o relatório do PR anexado.

## Portão (todos verdadeiros)

- `ci-status` sai com **0** no **SHA final** (nenhum commit depois do último verde);
- revisão aprovada e comentários resolvidos ou respondidos;
- sem conflito com a base;
- o PR está completo segundo [quando fechar o PR](../references/padroes/quando-fechar-o-pr.md);
- o **relatório HTML do PR** foi gerado e o link está no corpo ou num comentário.

## Passos

1. Gere o relatório ([formato](../references/relatorio-pr.md)):

   ```text
   node scripts/relatorio-pr.mjs relatorio.json
   ```

   Ele grava em `relatorios.dir` do adaptador (padrão `docs/relatorios/pr/<numero>-<slug>.html`) e atualiza o `index.html` da pasta. Commit no próprio PR e o link no corpo.
2. Siga `merge.estrategia` do adaptador ([trem ou merge queue](../references/padroes/trem-ou-merge-queue.md)):
   - **direto:** `gh pr merge <pr> --<metodo> --delete-branch`, sem `--admin`;
   - **merge queue:** `gh pr merge <pr> --auto`; a fila reroda os checks sobre a base atual;
   - **trem:** junte o PR ao próximo lote (`merge.comandoTrem`); o lote verde é mesclado em ordem, o culpado sai.
3. Confirme que o merge entrou (`gh pr view <pr> --json state,mergeCommit`) e anote o SHA para o deploy.

## Proibido

- Mesclar com check amarelo, "falhou mas é flaky" sem o rerun do 03, ou só com o check local.
- `--admin` para furar a proteção da branch.
- Tirar um check de obrigatório para destravar o merge.
