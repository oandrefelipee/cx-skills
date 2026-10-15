# 03 · Tratar teste instável (flaky)

Fase: **antes do merge**. Objetivo: separar ruído de falha real sem esconder regressão.

## Passos

1. **Um** rerun só dos jobs que falharam (`ci.rerun --failed`, CLI ou MCP do provedor, ou o botão no painel).
2. Passou no rerun → é flaky. Falhou de novo com o mesmo erro → é real: [02](02-corrigir-ci-vermelho.md).
3. Registre o flaky ([padrão de quarentena](../references/padroes/quarentena-de-flaky.md)): nome do teste, link das duas execuções, dono e prazo. Se o provedor detecta instáveis (por exemplo, `find_flaky_tests` no MCP do CircleCI), cite o histórico.
4. Se o projeto tem quarentena: o teste continua rodando e reportando, mas sai do portão de merge até o prazo.
5. Corrija a causa no mesmo PR quando for barata (espera explícita, dado isolado, relógio fixo); senão, abra a tarefa com dono.

## Proibido

- Rerun em série "até passar".
- Aumentar retries globais para esconder um teste.
- Quarentena sem dono ou sem prazo.
