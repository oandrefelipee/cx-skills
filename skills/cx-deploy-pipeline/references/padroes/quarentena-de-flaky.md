# Quarentena de flaky

Teste instável é o que falha e passa sem mudança de código. Ele corrói a confiança no CI; escondê-lo corrói mais.

## Fluxo

```text
falhou → 1 rerun dos jobs que falharam
         ├── falhou de novo → falha real (02)
         └── passou → flaky: registrar (teste, 2 links, dono, prazo)
                      └── quarentena: continua rodando e reportando, sai do portão de merge
```

## Regras

- A quarentena tira do **portão**, não da **execução**: o resultado continua visível.
- Todo item tem **dono e prazo**; vencido o prazo, o teste é consertado ou apagado com justificativa.
- Limite de itens em quarentena (por exemplo 5): acima disso, consertar vira prioridade.
- Use a detecção do provedor quando existir (histórico de instáveis) em vez de memória.
- Causas comuns: espera fixa em vez de espera por condição, dado compartilhado entre testes, relógio e fuso, ordem de execução, porta ou recurso disputado.

## Anti-padrão

Rerun em série; retries globais altos; `skip` sem registro; quarentena eterna.
