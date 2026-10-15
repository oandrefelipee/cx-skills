# Segredo nunca passa pelo agente

**Regra:** o agente nunca digita, imprime, comita ou passa por argumento um token, chave ou senha. O humano cola no painel do provedor ou num prompt seguro. Todo log que sai do terminal (chat, PR, relatório, issue) passa antes por `scripts/redigir.mjs`.

**Por quê:** chat, PR e logs de CI são copiados, indexados e guardados. Um token vazado precisa ser trocado; não há "apagar".

**Como cumprir:**

```text
<comando> 2>&1 | node scripts/redigir.mjs          # antes de colar
node scripts/redigir.mjs saida.log --verificar      # só conferir
```

No adaptador, `segredos.onde` diz o lugar, nunca o valor; `checar-config.mjs` recusa valor com cara de segredo.

**Anti-padrão:** `export TOKEN=...` no chat; `echo $TOKEN` para "conferir"; colar o log cru do CI no PR.
