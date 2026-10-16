# Origem: before-and-after

| | |
|---|---|
| Projeto | before-and-after |
| Autor | James Clements (Copyright (c) 2026) |
| Organização | vercel-labs |
| Repositório | https://github.com/vercel-labs/before-and-after |
| Commit copiado | `8306d34` (pasta `skill/`) |
| Licença | [`LICENSE`](LICENSE) (permite usar, copiar, modificar e distribuir; não permite produto concorrente; exige manter avisos e incluir a licença) |

Nesta pasta estão o `SKILL.md` e o `scripts/format.mjs` **sem nenhuma mudança**, como referência e para auditoria.

O que a `cx-deploy-pipeline` derivou deles:

| Original | Derivado | O que mudou |
|---|---|---|
| `SKILL.md` | [`../../workflows/10-antes-e-depois.md`](../../workflows/10-antes-e-depois.md) | Em pt-BR; escolha de caminho (tela existente, tela nova, sem tela); matriz de largura e tema pelo adaptador; captura pela ferramenta do projeto; par com o desenho aprovado; ligação com o relatório HTML |
| `scripts/format.mjs` | [`../../scripts/antes-e-depois.mjs`](../../scripts/antes-e-depois.mjs) | Rótulos Antes, Depois e Prévia; marcador `antes-e-depois`, que também troca um bloco `before-and-after` antigo; saída `--relatorio` para o `antesDepois[]` |

Para atualizar: compare o `skill/` do repositório com esta pasta, traga as mudanças para os derivados e troque o commit acima.
