# 00 · Preparar o PR

Fase: **antes do merge**. Objetivo: chegar ao PR com a mudança completa e só os gates leves rodados no laptop.

## Regras deste passo

- **Nada pesado no laptop.** Rode só tipos, lint, unitários do módulo e o E2E do arquivo que você tocou. Suíte E2E completa, smoke com banco, build de imagem e qualquer item de `recursos.proibidoNoLaptop` ficam para o CI ([regra](../references/regras/nada-pesado-no-laptop.md)).
- **PR grande, por história.** Um PR por história ou onda; correções do caminho entram no mesmo PR. Decida a hora de fechar com [quando fechar o PR](../references/padroes/quando-fechar-o-pr.md).

## Passos

1. `node scripts/preflight-disco.mjs`. Abaixo do piso: [09](09-disco-e-recursos.md) antes de tudo.
2. Ache o adaptador (`node scripts/checar-config.mjs --descobrir`). Sem adaptador: siga com os comandos óbvios do `package.json` e avise.
3. Rode os gates leves do escopo:

   ```text
   tipos (filtrado ao pacote) → lint → unitários do módulo → E2E só do spec tocado
   ```

4. Commit em mensagens convencionais; push.
5. Ainda não é hora de fechar? Continue acumulando na mesma branch (veja os sinais). É hora? Abra ou atualize o PR:
   - título no padrão do projeto; corpo com **O que mudou**, **Antes → Depois** (captura ou ASCII) e **Riscos**;
   - PR em rascunho enquanto o CI roda pela primeira vez, se o projeto usar rascunhos.
6. Siga para [01](01-ler-e-triar-ci.md).

## Pare se

- o próximo passo exige rodar algo da lista proibida para "ter certeza": deixe o CI provar;
- o diff mistura duas histórias sem relação: separe antes de abrir.

## Saída

```text
Gates leves: tipos ok · lint ok · unit 48/48 · e2e pedido.spec 6/6
PR #42 atualizado (3 commits). CI disparado. Próximo: 01-ler-e-triar-ci.
```
