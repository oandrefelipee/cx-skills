# Adaptador do pipeline: <nome do projeto>

Modelo para qualquer projeto adotar a `cx-deploy-pipeline`. A skill é genérica; o adaptador diz como **este** projeto faz CI, merge e deploy.

## Onde colocar (ordem de descoberta)

A skill procura nesta ordem e usa o primeiro que existir:

1. **`.cx/pipeline/adaptador.json`** na raiz. Recomendado: a pasta `.cx/` reúne os adaptadores de todas as skills `cx-*` (por exemplo, `.cx/pipeline/`, `.cx/ui/`), igual em todos os apps.
2. **Seção no `AGENTS.md` ou `CLAUDE.md`** que aponta para o adaptador, em **no máximo 3 linhas**.
3. **`docs/deploy/pipeline/`**: `README.md` (regras da casa, em prosa curta) e `adaptador.json`.

Confira com `node <skill>/scripts/checar-config.mjs --descobrir`.

### As 3 linhas para o `AGENTS.md`

```markdown
## Pipeline (CI, merge, deploy)
Siga a skill `cx-deploy-pipeline`. Adaptador: `.cx/pipeline/adaptador.json` (valide com `checar-config.mjs`).
Merge só com os checks exigidos verdes; deploy em produção e restauração de backup só com o "pode" humano.
```

## Passo a passo

1. Copie [`../assets/adaptador-exemplo.json`](../assets/adaptador-exemplo.json) para `.cx/pipeline/adaptador.json`.
2. Preencha cada campo segundo o [contrato](contrato-adaptador.md). Sem segredo em lugar nenhum: em `segredos.onde`, só o lugar.
3. Crie os atalhos no `package.json` que o adaptador cita. No mínimo:

   ```json
   {
     "scripts": {
       "ci:status": "node <caminho-da-skill>/scripts/ci-status.mjs",
       "ci:logs": "<comando do provedor ou script do projeto>",
       "deploy:status": "<comando do provedor>",
       "deploy:smoke": "<smoke por ambiente>"
     }
   }
   ```

   Se a skill não estiver num caminho estável no projeto, copie `ci-status.mjs` e `_adaptador.mjs` para `scripts/` do projeto.
4. `node <skill>/scripts/checar-config.mjs --gh` até sair sem erro.
5. Acrescente as 3 linhas ao `AGENTS.md`.

## Regras da casa (opcional, em `README.md` ao lado)

- Camadas de validação: <o que roda no laptop, no PR, no lote, à noite>
- Quem dá o "pode": <pessoas ou papel>
- Janela de deploy em produção: <dias e horários, se houver>
- Onde ficam os runbooks do provedor: <links internos>
