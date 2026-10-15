# Matriz de tom por gatilho

A voz da marca é a mesma em todo lugar: clara, curta, segunda pessoa, verbo no começo do botão. O tom muda com o que a pessoa está fazendo e sentindo (princípio do Polaris, da Shopify).

| Contexto | Tom | Estilo de referência | Exemplo |
|---|---|---|---|
| Configuração técnica (integrações, DNS, chaves, API, fontes de dados) | Seco e técnico | Vercel, Stripe | `Conectado · Servidor` + `[Rotacionar]` |
| Operação do dia a dia (pedidos, métricas, créditos, auditoria) | Curto e neutro | Resend, Linear | `Sem créditos` + `[Comprar créditos]` |
| Momentos humanos (onboarding, estado vazio, sucesso, primeiro uso, e-mail ao cliente final) | Curto e amigável | Shopify | "Tudo pronto. Envie seu primeiro pedido." |
| Erro ou risco | Claro e calmo: o que houve e a ação | Stripe, Polaris | "DNS não encontrado. [Ver registros]" |

## Como decidir

1. Descubra o gatilho da tela ou do trecho: a pessoa está configurando, operando, começando ou se recuperando de um problema?
2. Aplique o tom da linha. Em dúvida entre duas, vale a de erro/risco (calma antes de simpatia).
3. Não misture: um estado vazio amigável não vira piada, e uma chave de API não ganha exclamação.

## Regras que valem para todos os tons

- Informação-chave nas 3 primeiras palavras (front-loading).
- Botão = verbo + objeto, até 3 palavras. Destrutivo nomeia o que será apagado.
- Selo de status: 1 a 2 palavras, no passado ou estado ("Entregue", "Pausado", "Conectado").
- Erro: o que houve + o que fazer. Sem culpar a pessoa, sem "Ops!".
- Mesmo conceito, mesma palavra. Não alterne sinônimos.
- Sem "Clique aqui", "OK", "Enviar" solto, "Saiba mais" sem objeto.
