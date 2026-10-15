# Dokploy

Categoria: hospedagem · Estado: completo

Painel autohospedado numa VPS: clona o repositório, constrói na própria VPS e sobe aplicações ou compose atrás do Traefik.

## Como atende o contrato

| Campo | Como fazer |
|---|---|
| `deploy.run` | auto-deploy por webhook ao mesclar; ou CLI `dokploy`; ou API (`application.deploy` / `compose.deploy` com `x-api-key`) |
| `deploy.status` | aba Deployments do serviço; CLI ou API |
| `deploy.logs` | aba Logs do serviço; CLI |
| `deploy.rollback` | aplicação: rollback automático por health (modo Swarm com ação de falha "rollback") ou redeploy de uma versão anterior; compose: deploy do SHA anterior (revert por PR) |
| health | health check do contêiner e `/health` de cada serviço |

## CLI

- `dokploy`, autenticada pelo humano com chave de API (a configuração fica na máquina dele; nunca comite nem imprima).
- Toda criação de projeto, serviço, domínio ou banco e todo deploy em produção: "pode" antes.

## Armadilhas

- Construir na VPS divide CPU e disco com o que está no ar; acompanhe o disco da VPS.
- Domínios declarados por rótulos do Traefik no compose não devem ser cadastrados de novo na aba Domains.
- Aponte o DNS **antes** de pedir o certificado; o desafio HTTP precisa da porta 80.
- O painel não deve ficar exposto na internet: acesso por VPN ou túnel.
- Segredo de build (token de pacote privado) como segredo do BuildKit; confira que não ficou no histórico da imagem.
- Rollback automático por health existe para aplicações em modo Swarm; o compose não volta sozinho.
- Ambiente novo pode subir "saudável" e ainda precisar de dados iniciais (agenda, domínio autorizado, usuário administrador): tenha um checklist de primeiro deploy.

## Segurança

- Segredos na aba Environment de cada ambiente; staging e produção nunca compartilham valor.
- Firewall e proxy são do humano: o agente guia, não executa.

## Aprendizados

| Data | Aprendizado |
|---|---|
| | |

## Fontes

- [Rollbacks](https://docs.dokploy.com/docs/core/applications/rollbacks) · [produção, health e rollback](https://docs.dokploy.com/docs/core/applications/going-production)
