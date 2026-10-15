# 02 · Corrigir CI vermelho

Fase: **antes do merge**. Objetivo: o menor conserto certo, no mesmo PR, até verde.

## Passos

1. Reproduza **só o que falhou**, no menor recorte: o spec ou o teste específico, nunca a suíte inteira no laptop.
2. Ache a causa raiz. Corrija o código ou o teste quando o comportamento mudou de propósito; nunca afrouxe uma asserção para passar.
3. Commit no mesmo PR, citando o check (`fix: corrige X apontado por <check>`), e push.
4. Volte a [01](01-ler-e-triar-ci.md).

## Limites

- **3 rodadas** de corrigir → push → conferir sem verde: pare, resuma o que falta e devolva ao humano.
- A correção exige uma decisão de produto ou arquitetura: pergunte antes.
- Falha de infraestrutura (token, cota, runner): não "conserte" mexendo no teste; veja a página do provedor.

## Proibido

- `--no-verify`, pular hook, marcar check como opcional, apagar teste, `skip` sem registro de quarentena ([03](03-tratar-flaky.md)).
- Reescrever histórico de branch compartilhada sem o "pode".
