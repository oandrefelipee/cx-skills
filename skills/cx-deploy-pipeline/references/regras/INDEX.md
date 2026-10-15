# Regras

Leia a lista inteira; abra o arquivo só quando precisar do porquê ou do caso de borda. São inegociáveis: o adaptador do projeto pode endurecer, nunca afrouxar.

- **[Merge só com verde](merge-so-verde.md):** todos os checks exigidos em `pass` no SHA final e revisão feita.
  Use em: [04](../../workflows/04-mesclar-com-seguranca.md).
- **[Nada pesado no laptop](nada-pesado-no-laptop.md):** localmente só gates leves; a suíte completa é do CI.
  Use em: [00](../../workflows/00-preparar-pr.md), [02](../../workflows/02-corrigir-ci-vermelho.md).
- **[O "pode" é humano e vale uma vez](pode-humano.md):** deploy com `needsPode`, restauração de backup e ações irreversíveis.
  Use em: [05](../../workflows/05-deploy-com-pode.md), [07](../../workflows/07-rollback.md).
- **[Segredo nunca passa pelo agente](segredos.md):** o humano cola; todo log sai por `redigir.mjs`.
  Use em: sempre.
- **[Deploy só termina verificado](deploy-verificado.md):** SHA confere, health e smoke verdes.
  Use em: [06](../../workflows/06-verificar-pos-deploy.md).
- **[Rollback volta só o app](rollback-so-do-app.md):** migrações em expand-contract; banco não desce sem "pode".
  Use em: [07](../../workflows/07-rollback.md).
- **[PR grande, por história](pr-por-historia.md):** acumular o que é da mesma história e fechar na hora certa.
  Use em: [00](../../workflows/00-preparar-pr.md), [04](../../workflows/04-mesclar-com-seguranca.md).
- **[Piso de disco](piso-de-disco.md):** abaixo dele, parar, commit e push.
  Use em: [09](../../workflows/09-disco-e-recursos.md).
