---
name: cx-deploy-pipeline
description: Conduz uma mudança de PR até produção com segurança. Lê os checks do PR, tria e corrige CI vermelho, trata testes instáveis (flaky), mescla só com check verde, faz deploy com o "pode" humano, verifica health e smoke depois e faz rollback quando preciso. Gera um relatório HTML por PR. Independe de provedor (CircleCI, GitHub Actions ou Buildkite no CI; Dokploy, Railway, Vercel ou Fly no deploy) graças a um adaptador do projeto, com o GitHub como fonte da verdade. Use sempre que o pedido envolver status de CI, "por que o CI falhou", checks do PR, flaky, rerun, merge, trem de merge, merge queue, deploy, staging, produção, health check, smoke, canário, rollback, revert, relatório de PR, antes e depois, capturas ou vídeo no PR, quando fechar o PR, trocar ou acrescentar provedor de CI, deploy, DNS, segredos ou observabilidade, falta de disco durante build ou teste, ou antes de rodar uma suíte pesada no laptop. Use mesmo que o provedor não seja citado.
---

# Pipeline de entrega: CI → merge → deploy → verificação → rollback

O agente fala só em verbos (status, logs, rerun, deploy, health, rollback). O **GitHub é a fonte da verdade**: o merge depende dos checks do PR, e o CI externo só publica checks. Trocar de provedor troca o **adaptador**, nunca o fluxo.

## Regras de ouro

1. **Merge só com verde:** todos os checks exigidos em `pass` no SHA final, com revisão feita. Amarelo é "não".
2. **Nada pesado no laptop:** localmente, só tipos, lint, unitários e o E2E do arquivo tocado. A suíte completa é do CI.
3. **O "pode" é humano e vale uma vez:** deploy em ambiente com `needsPode`, restauração de backup e qualquer ação irreversível.
4. **Segredo nunca passa pelo agente:** o humano cola no painel ou em prompt seguro; todo log que sai do terminal passa por `scripts/redigir.mjs`.
5. **Deploy só termina verificado:** SHA implantado confere, health e smoke verdes. Senão, rollback do app.
6. **Migração em expand-contract:** o rollback volta só o app; o banco nunca desce sem o "pode".
7. **PR grande, por história:** acumula o trabalho da mesma história ou onda e fecha na hora certa ([quando fechar o PR](references/padroes/quando-fechar-o-pr.md)).
8. **Abaixo do piso de disco, para:** commit e push do WIP antes de qualquer outra coisa.

Detalhe e justificativa de cada uma em [`references/regras/INDEX.md`](references/regras/INDEX.md).

## Leitura progressiva

1. **Este SKILL.md.**
2. **O adaptador do projeto** (abaixo). Sem ele, peça ao humano ou crie a partir do modelo.
3. **Um ponto de entrada:** [`references/sintomas.md`](references/sintomas.md) se você parte de um problema ("check amarelo há 1 h"), ou o workflow da fase.
4. **O arquivo do item** (regra, padrão ou provedor) só quando precisar do detalhe.

## Como trabalhar

| Fase | Pedido | Leia |
|---|---|---|
| **Antes do merge** | Preparar a mudança e abrir ou atualizar o PR | [`workflows/00-preparar-pr.md`](workflows/00-preparar-pr.md) |
| | "Como está o CI?", "por que falhou?" | [`workflows/01-ler-e-triar-ci.md`](workflows/01-ler-e-triar-ci.md) |
| | Corrigir CI vermelho | [`workflows/02-corrigir-ci-vermelho.md`](workflows/02-corrigir-ci-vermelho.md) |
| | Teste que falha às vezes | [`workflows/03-tratar-flaky.md`](workflows/03-tratar-flaky.md) |
| | Capturas de antes e depois no PR e no relatório (tela, tela nova, vídeo) | [`workflows/10-antes-e-depois.md`](workflows/10-antes-e-depois.md) |
| **Merge e deploy** | Mesclar (PR único, trem ou merge queue) e gerar o relatório | [`workflows/04-mesclar-com-seguranca.md`](workflows/04-mesclar-com-seguranca.md) |
| | Subir para staging ou produção | [`workflows/05-deploy-com-pode.md`](workflows/05-deploy-com-pode.md) |
| **Depois** | Conferir que o deploy está de pé | [`workflows/06-verificar-pos-deploy.md`](workflows/06-verificar-pos-deploy.md) |
| | Voltar a versão | [`workflows/07-rollback.md`](workflows/07-rollback.md) |
| | Trocar ou acrescentar provedor | [`workflows/08-trocar-ou-acrescentar-provedor.md`](workflows/08-trocar-ou-acrescentar-provedor.md) |
| | Falta disco, memória ou CPU | [`workflows/09-disco-e-recursos.md`](workflows/09-disco-e-recursos.md) |
| Consulta | Contrato do adaptador | [`references/contrato-adaptador.md`](references/contrato-adaptador.md) |
| | Padrões (camadas, trem, quarentena, health, DORA…) | [`references/padroes/INDEX.md`](references/padroes/INDEX.md) |
| | Um provedor (CLI, MCP, armadilhas, aprendizados) | [`references/provedores/INDEX.md`](references/provedores/INDEX.md) |
| | Segurança de runners, segredos e cron | [`references/seguranca.md`](references/seguranca.md) |
| | Formato do relatório HTML | [`references/relatorio-pr.md`](references/relatorio-pr.md) |
| | Desenhar fluxo ou arquitetura | [`references/diagramas.md`](references/diagramas.md) |

## Adaptador do projeto

Antes de agir, ache o adaptador, **nesta ordem** (o primeiro que existir vence):

1. **`.cx/pipeline/adaptador.json`** na raiz do projeto. A pasta `.cx/` reúne os adaptadores de todas as skills `cx-*`.
2. **A seção do `AGENTS.md` ou `CLAUDE.md`** que aponta para o adaptador, em no máximo 3 linhas.
3. **`docs/deploy/pipeline/`** (`README.md` com as regras da casa e `adaptador.json`).

`node scripts/checar-config.mjs --descobrir` diz qual foi achado. O adaptador traz os checks exigidos, os comandos de status, logs, rerun, deploy, health e rollback, a estratégia de merge (trem, merge queue ou direto), os ambientes com quem dá o "pode", o piso de disco, o que é proibido no laptop, onde ficam os segredos (nunca o valor) e a pasta dos relatórios. Ele vence esta skill nos detalhes do projeto. Para criar um, copie [`references/adaptador-modelo.md`](references/adaptador-modelo.md).

Campo ausente no adaptador vira pergunta ao humano, nunca palpite.

## Scripts

Node 18+ ou Bun, sem dependências; `--ajuda` mostra o uso. O `ci:status` do projeto chama o `ci-status.mjs` daqui.

| Script | Para quê | Exemplo |
|---|---|---|
| `scripts/ci-status.mjs` | Checks do PR pelo `gh`, com provedor, link e checks exigidos ausentes; saída 0 verde, 1 falha, 8 pendente | `node scripts/ci-status.mjs 42` |
| `scripts/redigir.mjs` | Mascara segredos; **obrigatório** em todo log que sai do terminal | `<cmd> 2>&1 \| node scripts/redigir.mjs` |
| `scripts/preflight-disco.mjs` | Espaço livre contra o piso; abaixo dele, o protocolo de parada | `node scripts/preflight-disco.mjs` |
| `scripts/checar-config.mjs` | Valida o adaptador: campos, scripts citados, segredo colado, checks que o GitHub não conhece | `node scripts/checar-config.mjs --gh` |
| `scripts/checar-health.mjs` | Health pós-deploy por URL ou ambiente, com linha de base e SHA esperado | `node scripts/checar-health.mjs --ambiente staging` |
| `scripts/relatorio-pr.mjs` | Relatório HTML autocontido do PR e o `index.html` da pasta | `node scripts/relatorio-pr.mjs relatorio.json` |
| `scripts/checar-links.mjs` | Links relativos quebrados nos .md da skill | `node scripts/checar-links.mjs` |
| `scripts/redigir.test.mjs` | Casos que o `redigir` precisa mascarar (e os que não pode mudar), inclusive via symlink | `node scripts/redigir.test.mjs` |

## CLI e MCP do provedor

Use o que estiver instalado, nesta ordem: comando do adaptador, CLI do provedor, MCP do provedor, API, painel com o humano. Nenhum é requisito: sem eles, `ci-status.mjs` e o link do check bastam para triar. A página do provedor em `references/provedores/` diz quais ferramentas existem (por exemplo, o MCP do CircleCI tem logs de falha, flaky, rerun, validação de config e rollback).

## Saídas esperadas

Tabelas curtas, não prosa: check, estado, causa, próxima ação. Em cada passo diga o que acabou de acontecer, o que está acontecendo e o que vem a seguir. Logs colados sempre redigidos.

**Autocheck antes de responder:**
- não mesclei nem implantei nada sem verde e, quando exigido, sem o "pode";
- não rodei nada da lista `proibidoNoLaptop`;
- nenhum valor de segredo aparece na resposta;
- o relatório do PR existe e o link está no PR (fase de merge);
- o que aprendi sobre um provedor foi para a seção "Aprendizados" da página dele.
