# Padrões

Como as peças do pipeline costumam ser montadas. Leia a lista; abra o arquivo quando for aplicar.

- **[Camadas de validação (L0 a L3)](camadas-de-validacao.md):** o que roda no laptop, no PR, no lote e à noite.
  Use em: desenhar ou rever o CI de um projeto; decidir o que rodar agora.
- **[Quando fechar o PR](quando-fechar-o-pr.md):** sinais e anti-sinais para fechar um PR grande na hora certa.
  Use em: [00](../../workflows/00-preparar-pr.md), [04](../../workflows/04-mesclar-com-seguranca.md).
- **[Trem de merge ou merge queue](trem-ou-merge-queue.md):** validar vários PRs juntos sobre a base atual.
  Use em: muitos PRs prontos, CI caro ou lento.
- **[Quarentena de flaky](quarentena-de-flaky.md):** tirar o teste instável do portão sem deixar de rodá-lo.
  Use em: [03](../../workflows/03-tratar-flaky.md).
- **[Health check](health-check.md):** o que um endpoint de saúde precisa provar.
  Use em: [06](../../workflows/06-verificar-pos-deploy.md), configurar o provedor.
- **[Smoke e canário](smoke-e-canario.md):** verificação curta pós-deploy, com profundidade pelo escopo do diff.
  Use em: [06](../../workflows/06-verificar-pos-deploy.md).
- **[Expand-contract](expand-contract.md):** migrações compatíveis com a versão anterior do app.
  Use em: revisão de PR com migração, [07](../../workflows/07-rollback.md).
- **[Runner self-hosted multiprojeto](runner-self-hosted-multiprojeto.md):** um agente de CI na VPS para vários repos, com deploy key por repo, limpeza a armadilha do 128 e o **agente de deploy separado** (chave de deploy nunca no agente que roda PR).
  Use em: ligar um projeto novo ao agente, CI que falha no checkout.
- **[Higiene de host e CI com Docker isolado](higiene-de-host.md):** nada acumula no host (tetos, limpeza por job e timer diário) e o CI com Docker roda rootless, num usuário e slice próprios, nunca no Docker do runtime.
  Use em: ligar um host novo, disco enchendo, CI que precisa de Docker, fila hospedada sem cota.
- **[DORA leve](dora-leve.md):** quatro números por período, sem painel.
  Use em: relatório do PR, revisão mensal.
