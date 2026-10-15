# Smoke e canário

**Smoke:** uma passada curta e determinística pelo caminho crítico logo depois do deploy. **Canário:** observar por um tempo, comparando com a linha de base, às vezes com só uma fração do tráfego.

## Profundidade pelo escopo do diff

| Escopo do diff | Verificação |
|---|---|
| Só documentação | nenhuma |
| Só config | health |
| Backend | health + smoke de API |
| Front | health + smoke + uma captura da página principal |
| Misto ou migração | tudo + canário curto |

## Canário leve

- Linha de base antes do deploy (`checar-health.mjs --salvar-linha-de-base base.json`).
- Checagens a cada 1 a 5 min por 15 a 30 min.
- Alerta só em mudança contra a base e só se persistir em 2 checagens seguidas.

| Métrica | Seguir | Segurar e investigar | Voltar |
|---|---|---|---|
| Taxa de erro | até +10% da base | +10% a 2x | acima de 2x |
| Latência p95 | até +20% | +20% a +50% | acima de +50% |
| Erro novo no front | nenhum | raro | frequente |

Voltar segue [07](../../workflows/07-rollback.md), com o "pode" quando o ambiente exige.
