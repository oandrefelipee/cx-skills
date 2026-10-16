# 10 · Antes e depois no PR

Fase: **antes do merge** (chamado pelo [00](00-preparar-pr.md) e pelo [04](04-mesclar-com-seguranca.md)). Objetivo: o revisor vê a mudança antes de ler o código, no corpo do PR e no relatório HTML, com as mesmas capturas.

Adaptado do [before-and-after](https://github.com/vercel-labs/before-and-after) (James Clements, vercel-labs), que é a origem do fluxo e do formatador. Licença e original sem mudanças: [`../vendor/before-and-after/`](../vendor/before-and-after/ORIGEM.md).

## Escolha o caminho

```text
o diff toca interface?  (adaptador antesDepois.caminhosUi; sem adaptador: .tsx/.jsx/.vue/.svelte/.css/.html de app)
├── sim, tela que já existia  → A · capturas antes (base) e depois (branch), por largura e tema
├── sim, tela nova            → B · só "Prévia" (sem antes) + o desenho aprovado ao lado
├── não, mas muda forma       → C · ASCII ou diagrama no relatório (contrato, fluxo, árvore de arquivos)
└── não muda nada visível     → pule; escreva "Sem mudança visível" no corpo
```

Mudança de animação ou interação → vídeo curto além das imagens (passo 5).

## Passos

1. **Matriz de capturas.** Use `antesDepois.matriz` do adaptador. Sem ela: `Desktop` e `Celular 390`, tema claro e escuro, só das telas tocadas. Cada célula vira um par com rótulo (`--rotulo "Celular 390 · escuro"`).
2. **Capture com a ferramenta do projeto**, nunca à mão:
   - o comando de `antesDepois.capturar` do adaptador (ex.: um spec do Playwright que salva em `capturas/`);
   - sem comando: `agent-browser` (`agent-browser skills get core --full`) ou o navegador do agente.
   - **Antes** sai da base (worktree da `main` ou o staging); **depois**, da branch. Mesma largura, mesmo estado, mesmos dados de exemplo.
   - Caminhos sem espaço, dentro do repositório: `capturas/<tela>-<largura>-<tema>-antes.png`.
3. **Alturas iguais.** O GitHub centraliza na vertical a imagem menor da célula. Em captura de página inteira, leia `document.documentElement.scrollHeight` nos dois lados e acrescente espaço **só embaixo** do menor até empatar. Em componente ou seção, capture a mesma região dos dois lados. Confira que os arquivos têm as mesmas dimensões em pixels.
4. **Fidelidade ao desenho (caminho B, e A quando houver wireframe da história).** Ponha a captura do desenho aprovado (wireframe, protótipo, Figma exportado) como par extra rotulado `Desenho aprovado`, antes do resultado. Divergência sem decisão registrada é achado de revisão, não detalhe.
5. **Vídeo (opcional).** O gravador do `agent-browser` grava a cerca de 10 fps (confira a versão instalada); não converta para 30/60 fps, que só duplica quadros. Página protegida: autentique dentro do contexto de gravação, não antes. Publique em duas etapas (passo 7).
6. **Gere o bloco e o relatório a partir dos mesmos pares:**

   ```text
   # corpo do PR (troca só o bloco marcado; o resto fica intacto)
   gh pr view <pr> --json body --jq .body > /tmp/corpo.md
   node scripts/antes-e-depois.mjs --corpo /tmp/corpo.md \
     --antes capturas/metricas-1440-claro-antes.png --depois capturas/metricas-1440-claro-depois.png --rotulo "Desktop · claro" \
     --antes capturas/metricas-390-escuro-antes.png --depois capturas/metricas-390-escuro-depois.png --rotulo "Celular 390 · escuro" \
     > /tmp/corpo-novo.md

   # campo antesDepois[] do relatório HTML (caminhos relativos à pasta do JSON)
   node scripts/antes-e-depois.mjs --relatorio --titulo "Métricas" --base <pasta-do-relatorio.json> \
     --antes ... --depois ... --rotulo ... > /tmp/antes-depois.json
   ```

   Tela nova: só `--depois` (vira **Prévia**). Crédito opcional: `--credito "<quem gerou>"`.
7. **Publique (ação visível: peça o "pode" se o projeto exigir para editar PR):**

   ```text
   mapfile -t ANEXOS < <(node scripts/antes-e-depois.mjs --lista-de-anexos --antes ... --depois ...)
   gh pr edit <pr> --body-file /tmp/corpo-novo.md $(printf -- '--attach %s ' "${ANEXOS[@]}")
   ```

   Rode o formatador e o `gh` da mesma pasta: o `--attach` sobe os arquivos e troca as referências locais pelas URLs do GitHub.
   **Vídeo lado a lado:** (a) suba os vídeos num comentário temporário com `gh pr comment --attach`; (b) pegue as URLs `https://github.com/user-attachments/assets/...` pelo `gh api`, na ordem antes/depois; (c) `--antes-video-url ... --depois-video-url ... --corpo /tmp/corpo.md` e `gh pr edit`; (d) confira o corpo e só então apague o comentário. Se algo falhar, mantenha o comentário (os anexos ficam recuperáveis) e retome da última etapa boa.
8. **Confira o resultado renderizado.** Abra o PR: nenhum `./capturas/...` sobrou dentro do bloco, as imagens carregam, e a evidência aparece **antes** dos detalhes técnicos. Vídeo: os dois `<video>` ficam na tabela, tocam e mostram controles.

## Onde o bloco entra

Perto do topo, depois do **Por quê** e de um link de preview ou deploy, se houver; antes de detalhes, testes e notas. Primeiro a evidência que prova o PR; depois estados alternativos e demonstrações, com o rótulo "demonstração" e o limite que importar (ex.: 10 fps). Não invente título nem divida parágrafo, lista ou tabela para criar uma âncora: na dúvida, acrescente o bloco no fim. Bloco que já existe (nosso ou o `before-and-after` original) é trocado inteiro.

## Proibido

- Captura com token, segredo de bypass, query autenticada, dado pessoal real ou arquivo de estado do navegador.
- Antes e depois com largura, tema, dados ou estado diferentes (a comparação mente).
- Recortar ou editar a imagem para esconder um defeito.

## Saída

```text
Antes e depois: 4 pares (Desktop/Celular 390 × claro/escuro) + Desenho aprovado
PR #42 atualizado (bloco antes-e-depois, 8 anexos, 0 refs locais). Relatório: antesDepois[] com 4 pares.
```
