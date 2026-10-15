# Expand-contract

Toda migração implantada é compatível com a versão **anterior** do app. Assim o rollback volta só o app, e o banco nunca desce sob pressão.

## As fases

```text
1. expand    acrescenta (coluna nula, tabela, índice); nada é removido nem renomeado
2. migrate   o app novo escreve no novo e lê dos dois; preenchimento em lotes, se preciso
3. contract  num deploy POSTERIOR, já estável, remove o que ficou velho
```

Cada fase é um deploy. A fase 3 nunca vai junto com a mudança de código que deixou de usar o velho.

## Exemplos

| Mudança | Errado (um deploy) | Certo |
|---|---|---|
| Renomear coluna | `RENAME` | criar a nova → escrever nas duas → ler da nova → apagar a velha depois |
| Tornar obrigatória | `NOT NULL` direto | preencher → validar → restrição num deploy seguinte |
| Apagar tabela | `DROP` junto com o código | parar de usar → esperar → `DROP` num PR próprio |

## Regras

- Restaurar backup ou descer migração só com o "pode".
- O PR com a fase contract é pequeno e isolado ([quando fechar o PR](quando-fechar-o-pr.md)).
- Banco com gatilhos de imutabilidade ou dados regulados: o plano de volta é escrito antes do deploy.
