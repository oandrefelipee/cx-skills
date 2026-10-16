# Fontes

Resumos com palavras próprias; consulte a fonte para o detalhe atual.

## Plataforma e práticas

- GitHub: [merge queue](https://docs.github.com/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue) e [checks exigidos](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks).
- GitHub CLI: [`gh pr checks`](https://cli.github.com/manual/gh_pr_checks) (campo `bucket`, `--required`, saída 8 = pendente).
- GitHub: [API de commit statuses](https://docs.github.com/en/rest/commits/statuses), para CI externo publicar resultado.
- DORA: [métricas de entrega](https://dora.dev/guides/dora-metrics/).
- Quarentena de testes instáveis: [minware](https://www.minware.com/guide/best-practices/flaky-test-quarantine), [Mill](https://mill-build.org/blog/4-flaky-tests.html).
- Dokploy: [rollbacks](https://docs.dokploy.com/docs/core/applications/rollbacks) e [produção](https://docs.dokploy.com/docs/core/applications/going-production).
- CircleCI: [servidor MCP oficial](https://github.com/CircleCI-Public/mcp-server-circleci) e [skills oficiais](https://github.com/CircleCI-Public/skills).

## Skills que inspiraram a estrutura

- `gh-fix-ci` ([openai/skills](https://skills.sh/openai/skills/gh-fix-ci)): script único que lê os checks e extrai o erro.
- `diagnose-ci-failures` ([warpdotdev/common-skills](https://skills.sh/warpdotdev/common-skills/diagnose-ci-failures)): esperar o CI terminar; plano antes do código.
- `debug-ci-failures` e `circleci-deploy-setup` ([CircleCI-Public/skills](https://github.com/CircleCI-Public/skills)): ordem status → logs → flaky; auditar antes de gerar.
- `shipping-and-launch` ([addyosmani/agent-skills](https://skills.sh/addyosmani/agent-skills/shipping-and-launch)): limiares de rollback e plano de banco.
- `land-and-deploy`, `canary` e `setup-deploy` (gstack): portão de prontidão, canário pelo escopo do diff, configuração declarada.
- `babysit` (poteto): limite de 3 rodadas e nunca desobrigar um check.
- `before-and-after` ([vercel-labs/before-and-after](https://github.com/vercel-labs/before-and-after), James Clements): fluxo e formatador de antes e depois no PR. **Copiado e adaptado** (não só inspiração): original e licença em [`../vendor/before-and-after/`](../vendor/before-and-after/ORIGEM.md); derivados no [10](../workflows/10-antes-e-depois.md) e em `scripts/antes-e-depois.mjs`.
- `visual-pr` ([humanlayer/skills](https://github.com/humanlayer/skills), `plugins/visual-pr`): estrutura do corpo do PR (por quê em uma frase, 1 a 3 pontos de atenção, esboço da mudança no estilo `/show-me`), usada nos campos `porque`, `atencao[]` e `esboco[]` do relatório.
- `visual-explainer` ([nicobailon/visual-explainer](https://github.com/nicobailon/visual-explainer)): desenho do relatório v2 (tipografia com personalidade, superfícies sutis, índice lateral responsivo, KPIs, tabela com status e sparkline).
