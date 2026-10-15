# Trem de merge ou merge queue

Os dois validam PRs **sobre a base atual** antes de entrar, para que dois PRs verdes isolados não quebrem juntos. O adaptador escolhe em `merge.estrategia`.

| | Merge queue (GitHub) | Trem (do projeto) | Direto |
|---|---|---|---|
| Quem monta o lote | o GitHub | um script do projeto (`merge.comandoTrem`) | ninguém |
| Requisito | plano que ofereça a fila; o CI precisa rodar no evento da fila (`merge_group` no Actions, gatilho equivalente nos outros) | branch de lote (por exemplo `train/<carimbo>`) que o CI roda completo | só checks do PR |
| Custo de CI | uma execução por grupo | uma execução por lote | uma por PR |
| Falha no lote | a fila tira o PR culpado | bisseção: rodar o que falhou em cada PR, o culpado sai | - |
| Use quando | a plataforma oferece e o volume é alto | a fila não está disponível ou o CI é caro | poucos PRs, CI barato |

## Regras

- O check exigido precisa rodar no evento da fila ou na branch do lote; senão a fila nunca fica verde.
- O nome exigido é o do job, não o do arquivo de workflow.
- Lote pequeno (3 a 4 PRs): falha fica fácil de atribuir.
- A branch do lote é descartável: nunca é mesclada como está; os PRs entram na ordem do lote.
