# 06 · Acrescentar ao guia

Princípios, leis e técnicas vivem cada um num `.md` em `references/principios/`, `references/leis/` e `references/tecnicas/`; as fontes vivem em `references/livros.md`. Esses arquivos são a fonte única. O guia visual `references/guia.html` é gerado a partir deles. **Acrescentar um item = criar o `.md`, pôr o link no INDEX e rodar o script.** Nunca edite o bloco JSON do HTML à mão.

## Antes de começar

Confirme que o item ainda não existe: busque pelo nome em português e em inglês nos três `INDEX.md` (`rg -i "<nome>" references/`). Se existir, melhore o arquivo em vez de duplicar.

## Passos

1. **Escolha o tipo:** princípio (regra de postura), lei (efeito psicológico estabelecido, com nome) ou técnica (ação prática numa tela).
2. **Copie um arquivo do mesmo tipo** com nome em kebab-case pt-BR (`leis/lei-de-hick.md`, `tecnicas/selo-de-status.md`) e preencha:

| Parte | Regra |
|---|---|
| `id` (frontmatter) | Único e estável: `p-…`, `l-…` ou `t-NN` (próximo número livre) |
| `pt`, `en` | Nome nos dois idiomas |
| `ctx` | Um ou mais de: `Configuração`, `Operação`, `Momento humano`, `Erro ou risco` (alimenta o filtro de tom do guia) |
| `fontes` | Ids da coluna `Id` de `livros.md` (pelo menos um) |
| `destaque` | `true` só para entrar em "Como pedir a um agente" no guia |
| `## Definição` | 1-2 frases, em palavras suas |
| `## Quando usar` | Onde usar, e a linha `**Exemplo:** …` com crases para trechos de interface |
| `## Anti-padrão` | O erro mais comum |
| `## Antes → depois` | Wireframe ASCII pequeno, largura 390 (40 colunas), pela convenção de `references/wireframe-ascii.md` |
| `## Microcopy` | `- Antes: "…"` e `- Depois: "…"` |
| `## Prompt` | Uma linha em citação (`> …`), pronta para colar num agente |
| `## Fonte` | Autor, *obra*, edição, como em `livros.md` |
| `## Ligações` | 2 a 4 itens relacionados, link relativo e uma palavra do porquê |
| `<!-- guia:antes … -->`, `<!-- guia:depois … -->` | HTML do mini mock do guia, numa linha. Classes: `ln`, `mu`, `p`, `bd` (`ok` `wa` `er` `n`), `bt` (`p` `big`), `fld`, `i`, `tip`, `bar`, `kpi`, `sk`, `prev`, `er-t` |

   Alvo: de 30 a 70 linhas. Mantenha os títulos de seção exatamente como estão: o script os lê.

3. **Ponha o link no `INDEX.md` da pasta**, em 2 ou 3 linhas (nome, o que é, onde usar). A ordem do INDEX é a ordem do guia.
4. **Se for um sintoma novo** que o item resolve, acrescente-o em `references/sintomas.md`.
5. **Fonte nova?** Acrescente uma linha em `references/livros.md`, na tabela de livros ou de guias online, com `Id`, autor, título, edição (só livros), o que ensina (com suas palavras), `Rótulo` curto e link.
6. **Gere e confira:**

```bash
node scripts/gerar-guia.mjs      # regrava o JSON do guia.html; acusa campo vazio, fonte inexistente, item fora do INDEX
node scripts/checar-links.mjs    # nenhum link relativo quebrado
python3 -m http.server 8765 --directory references   # abra http://localhost:8765/guia.html
```

   No navegador, confira que o cartão aparece, que a busca e os filtros o encontram, que a etiqueta "Fonte" leva ao livro, que o mock cabe em 390 px e que o tema escuro fica legível.

## Regras de conteúdo

- Resuma com suas palavras. Não copie trechos de livros nem de guias.
- Confira autor, título, edição e ano numa página da editora ou do autor. Não invente edição nem ano.
- Nada específico de projeto: exemplos fictícios e genéricos (loja, pedidos, assinaturas, integrações).
- Um termo por conceito: use os nomes já existentes (ex.: "Selo de status", não "badge" num lugar e "etiqueta" em outro).

## Projeto com guia próprio

Um projeto pode manter uma cópia do guia no adaptador dele, com exemplos reais no campo opcional `pl` do JSON (e `perfil: "projeto"`, `rotuloPl` com o nome do projeto). A fonte de verdade do guia genérico são os `.md` desta skill (repositório `oandrefelipee/cx-skills`); o guia do projeto copia daqui os itens novos.
