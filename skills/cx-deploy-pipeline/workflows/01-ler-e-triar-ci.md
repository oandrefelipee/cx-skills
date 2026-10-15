# 01 · Ler e triar o CI

Fase: **antes do merge**. Objetivo: saber em uma tabela o estado do PR e, se vermelho, a natureza da falha.

## Passos

1. Rode o comando único do projeto (`ci.status` do adaptador, normalmente `<gerenciador> run ci:status <pr>`) ou direto `node scripts/ci-status.mjs <pr>`.
2. Leia o código de saída:

   | Saída | Significa | Faça |
   |---|---|---|
   | 0 | Tudo verde | Revisão; depois [04](04-mesclar-com-seguranca.md) |
   | 8 | Pendente | Espere com intervalo (`gh pr checks <pr> --watch --fail-fast`, ou volte em 5 a 10 min). Não fique consultando em laço curto |
   | 1 | Falha ou check exigido ausente | Continue abaixo |

3. Check exigido **ausente** (não rodou): o CI não disparou para esse SHA, o nome mudou ou o filtro de branch o excluiu. Veja a página do provedor; não é falha de código.
4. Para o primeiro check vermelho, pegue o trecho do erro: `ci.logs` do adaptador, a CLI ou o MCP do provedor, ou o link do check. **Sempre** por `redigir.mjs` antes de mostrar.
5. Classifique:

   ```text
   O mesmo teste passa no SHA anterior e falha agora com erro determinístico? → REAL → 02
   Passou no rerun, ou o histórico do provedor o marca como instável?         → FLAKY → 03
   Erro antes dos testes (install, token, cota, imagem, runner fora do ar)?   → INFRA → página do provedor; humano se envolver segredo ou cobrança
   ```

## Saída

| Check | Estado | Natureza | Trecho | Próximo |
|---|---|---|---|---|
| ci: e2e | falha | real | `expected "Pausada", got "Ativa"` | 02 |
