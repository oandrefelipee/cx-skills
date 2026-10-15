# Health check

Um endpoint de saúde serve a dois públicos: o orquestrador do provedor (decide reiniciar ou voltar a versão) e a verificação pós-deploy.

## O que ele deve provar

- o processo responde (`200` rápido);
- as dependências **essenciais** respondem (banco com uma consulta trivial, fila), com tempo limite curto;
- a **versão** no ar (SHA ou tag) aparece na resposta, para o `--esperar-sha` do `checar-health.mjs`.

Separe, se o provedor permitir: *liveness* (o processo está vivo) e *readiness* (pode receber tráfego). Dependência opcional fora do ar não derruba o health.

## No provedor

- Configure intervalo, tempo limite, período de partida e tentativas.
- Com troca sem parada (`start-first` ou equivalente), a versão nova só recebe tráfego depois de saudável.
- Rollback automático por health (quando existir) cobre só a falha de health; o resto é verificação ([06](../../workflows/06-verificar-pos-deploy.md)).

## Anti-padrão

Health que devolve 200 sempre; health que chama serviço externo lento e derruba tudo junto; versão ausente na resposta.
