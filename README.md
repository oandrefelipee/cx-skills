# cx-skills

Skills de agente para Claude Code, Codex, Cursor e outros agentes compatíveis com [skills.sh](https://skills.sh).

| Skill | O que faz |
|---|---|
| [`cx-deploy-pipeline`](skills/cx-deploy-pipeline/SKILL.md) | Leva uma mudança de PR até produção com segurança: lê e tria o CI, trata flaky, mescla só com check verde, faz deploy com o "pode" humano, verifica health e smoke e faz rollback. Independe de provedor (adaptador do projeto), com o GitHub como fonte da verdade. Relatório HTML por PR, catálogo de provedores com aprendizados e scripts sem dependência. |
| [`cx-actionable-ui`](skills/cx-actionable-ui/SKILL.md) | Torna telas de produto orientadas a ação: menos texto, uma ação primária, estado em selo, ajuda em ⓘ. Planeja por blocos e wireframe ASCII antes de escrever, com orçamento de palavras e regras anti-slop. Princípios, 14 leis de UX, 30 técnicas, matriz de tom, bibliografia, guia visual e scripts. |

## Instalar

```bash
npx skills add oandrefelipee/cx-skills
```

Só uma skill:

```bash
npx skills add oandrefelipee/cx-skills --skill cx-actionable-ui
npx skills add oandrefelipee/cx-skills --skill cx-deploy-pipeline
```

## O que vem na `cx-actionable-ui`

A skill usa divulgação progressiva: o agente lê o `SKILL.md`, depois um índice ou o mapa de sintomas, e só então o arquivo do item de que precisa.

```
skills/cx-actionable-ui/
  SKILL.md                    princípios em 1 linha, tabela "Como trabalhar", adaptador
  workflows/                  00 planejar blocos · 01 auditar · 02 medir texto · 03 aplicar
                              técnicas · 04 microcopy · 05 QA visual · 06 ampliar o guia
  references/
    sintomas.md               "texto demais", "não sei qual é a ação"… → itens a abrir
    principios/INDEX.md       8 princípios, um .md cada
    leis/INDEX.md             14 leis de UX, um .md cada
    tecnicas/INDEX.md         30 técnicas, um .md cada
    diagramas.md              quando usar ASCII e quando usar Mermaid
    catalogo-de-blocos.md     blocos com orçamento de palavras
    wireframe-ascii.md        convenção de wireframe em 390 e 1280
    anti-slop.md · tone-matrix.md · checklist.md · livros.md · adaptador-modelo.md
    guia.html                 guia visual, gerado a partir dos .md
  scripts/                    contar-palavras · checar-capturas · wireframe-ascii
                              gerar-guia · checar-links (Node ou Bun, sem dependências)
```

Cada item (princípio, lei ou técnica) traz: definição, quando usar, anti-padrão, antes e depois em wireframe ASCII, microcopy antes e depois, prompt de uma linha, fonte e ligações para itens vizinhos.

## O que vem na `cx-deploy-pipeline`

Mesmo padrão progressivo: `SKILL.md` com as regras de ouro e os workflows em 3 fases, depois o índice do tipo e só então o arquivo do item.

```
skills/cx-deploy-pipeline/
  SKILL.md                    8 regras de ouro, "Como trabalhar" por fase, descoberta do adaptador
  workflows/                  antes do merge: 00 preparar PR · 01 ler e triar CI · 02 corrigir · 03 flaky
                              merge e deploy: 04 mesclar (com relatório) · 05 deploy com o "pode"
                              depois: 06 verificar · 07 rollback · 08 trocar ou acrescentar provedor · 09 disco
                              10 antes e depois no PR e no relatório (capturas, tela nova, vídeo)
  references/
    sintomas.md · contrato-adaptador.md · adaptador-modelo.md · relatorio-pr.md
    regras/INDEX.md           8 regras, um .md cada
    padroes/INDEX.md          camadas L0–L3, quando fechar o PR, trem ou merge queue, quarentena,
                              health check, smoke e canário, expand-contract, DORA leve
    provedores/               ci · hospedagem · dns-cdn · segredos · jobs-filas · observabilidade ·
                              registro-imagens, com INDEX por categoria, _modelo.md e "Aprendizados"
    seguranca.md · diagramas.md · fontes.md
  scripts/                    ci-status · redigir (+ testes) · preflight-disco · checar-config ·
                              checar-health · relatorio-pr · antes-e-depois (+ testes) · checar-links
                              (Node ou Bun, sem dependências)
  assets/                     adaptador-exemplo.json · exemplo-relatorio.json/.html
  vendor/before-and-after/    original de vercel-labs/before-and-after (James Clements), licença e ORIGEM.md
```

O fluxo de antes e depois é copiado e adaptado do [before-and-after](https://github.com/vercel-labs/before-and-after) (James Clements, vercel-labs), com a licença original em `skills/cx-deploy-pipeline/vendor/before-and-after/LICENSE`.

O adaptador do projeto é descoberto nesta ordem: `.cx/pipeline/adaptador.json`, a seção do `AGENTS.md` ou `CLAUDE.md` (até 3 linhas apontando o arquivo) e `docs/deploy/pipeline/`. Modelo em [`references/adaptador-modelo.md`](skills/cx-deploy-pipeline/references/adaptador-modelo.md).

Para contribuir com um provedor, copie [`references/provedores/_modelo.md`](skills/cx-deploy-pipeline/references/provedores/_modelo.md) para a categoria certa, ponha a linha no `INDEX.md` dela e rode:

```bash
node skills/cx-deploy-pipeline/scripts/checar-links.mjs
node skills/cx-deploy-pipeline/scripts/redigir.test.mjs
```

## Como contribuir

1. Crie ou edite o `.md` do item em `references/principios/`, `leis/` ou `tecnicas/`, seguindo o formato de um item existente, e ponha o link no `INDEX.md` da pasta. Fontes novas vão em `references/livros.md`.
2. Regere o guia e confira os links:

   ```bash
   node skills/cx-actionable-ui/scripts/gerar-guia.mjs
   node skills/cx-actionable-ui/scripts/checar-links.mjs
   ```

3. Mantenha o conteúdo genérico: exemplos fictícios (loja, pedidos, assinaturas, integrações), resumos com palavras próprias e fontes conferidas na editora ou no autor.

O passo a passo completo está em [`workflows/06-acrescentar-ao-guia.md`](skills/cx-actionable-ui/workflows/06-acrescentar-ao-guia.md).

## Adaptador por projeto

As skills são genéricas. Cada projeto pluga as regras próprias num adaptador dentro do repositório dele:

| Skill | Adaptador | Modelo |
|---|---|---|
| `cx-actionable-ui` | `docs/design/ui-acao/README.md` | [`adaptador-modelo.md`](skills/cx-actionable-ui/references/adaptador-modelo.md) |
| `cx-deploy-pipeline` | `.cx/pipeline/adaptador.json` (ou referência no `AGENTS.md`, ou `docs/deploy/pipeline/`) | [`adaptador-modelo.md`](skills/cx-deploy-pipeline/references/adaptador-modelo.md) |

A pasta `.cx/` na raiz é o lugar comum para os adaptadores de todas as skills `cx-*`.
