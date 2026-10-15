# 03. Aplicar as técnicas

Objetivo: transformar a tabela do passo 02 em mudança de interface.

1. Para cada veredito, escolha a técnica em `../references/tecnicas/INDEX.md` (ou parta do problema em `../references/sintomas.md`). Abra o arquivo da técnica para ver o antes e depois em ASCII e o prompt pronto.
2. Mapeie a técnica ao **componente real do projeto**. Use o mapa do adaptador do projeto (`docs/design/ui-acao/`, ver SKILL.md). Sem mapa, use os componentes do design system da casa e não invente um novo.
3. Respeite as regras do projeto sobre imports e padrões (por exemplo, "só pela fachada").
4. Hierarquia final: 1 ação primária; estado em selo; números com delta; ajuda em ⓘ.
5. Mudança grande de layout em tela existente passa por **wireframe antes e depois**, aprovado pelo dono, antes do código (regra do projeto, quando houver).

Com a impeccable: `distill` conduz a simplificação; mantenha como filtro o veredito do passo 02.

Saída: plano de edição por arquivo (o que muda, qual técnica, qual componente) e o código.
