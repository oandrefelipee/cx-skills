# Técnicas

Como usar: leia esta lista inteira (cada item tem nome, o que é e onde usar) e abra o arquivo do item só quando precisar do detalhe: antes e depois em ASCII, microcopy, prompt pronto, fonte e ligações. Para partir de um problema, comece por [`../sintomas.md`](../sintomas.md).

Ações práticas numa tela. São 30, na ordem do guia visual; os números ficam no `id` de cada arquivo (`t-01` a `t-30`).

- **[Divulgação progressiva](divulgacao-progressiva.md)** (Progressive disclosure): Mostra só o essencial primeiro e deixa o resto sob demanda, em no máximo 2 níveis.
  Use em: Configuração, formulários longos, detalhe de um registro.
- **[Escaneabilidade](escaneabilidade.md)** (Scannability (F/Z-pattern)): A pessoa varre a tela em F: o começo de cada linha recebe a atenção.
  Use em: Listas, cabeçalhos, cartões de resumo.
- **[Leitura de relance](leitura-de-relance.md)** (Glanceability): Entender o estado em 1-2 segundos, sem ler.
  Use em: KPIs, status de integração, cabeçalho de entidade.
- **[Pista de informação](pista-de-informacao.md)** (Information scent): O rótulo promete o que a pessoa vai encontrar atrás do clique.
  Use em: Navegação, links, cartões de ação.
- **[Lei de Hick, na prática](hick-na-pratica.md)** (Hick's Law): Quanto mais escolhas, mais tempo para decidir.
  Use em: Barras de ação, menus, cabeçalhos.
- **[Lei de Fitts, na prática](fitts-na-pratica.md)** (Fitts's Law): Alvos maiores e mais próximos são mais rápidos de acertar.
  Use em: Ação frequente, principalmente no celular.
- **[Lei de Miller, na prática](miller-na-pratica.md)** (Miller's Law): A memória de trabalho segura cerca de 7 itens.
  Use em: Agrupar métricas e menus.
- **[Reconhecimento em vez de memorização](reconhecimento-em-vez-de-memorizacao.md)** (Recognition over recall): Mostrar opções visíveis em vez de exigir que a pessoa lembre.
  Use em: Filtros, busca, seleção de modelo ou fonte de dados.
- **[Mostrar, não explicar](mostrar-nao-explicar.md)** (Show, don't tell): Trocar a instrução por um exemplo ou preview vivo.
  Use em: Onboarding, vazios.
- **[Ações na linha e em lote](acoes-na-linha-e-em-lote.md)** (Inline & bulk actions): Ação onde está o dado; seleção múltipla abre barra de ações.
  Use em: Listas de pedidos, integrações e domínios.
- **[Estado vazio acionável](estado-vazio-acionavel.md)** (Actionable empty state): Diz o que a área mostrará, por que está vazia e dá a primeira ação.
  Use em: Toda lista ou seção que pode ficar vazia.
- **[Checklist de configuração](checklist-de-configuracao.md)** (Setup checklist): Até 5 passos auto-marcados, com progresso, dispensáveis.
  Use em: Primeira configuração da conta.
- **[Selo de status](selo-de-status.md)** (Status badge): 1-2 palavras, no passado ou estado, com tom fixo por status.
  Use em: Tabelas, cabeçalhos de entidade.
- **[Cartão de KPI com variação](kpi-com-variacao.md)** (KPI card with delta): Valor grande, rótulo curto, delta com sinal e período.
  Use em: Visão geral, créditos, pedidos, e-mails.
- **[Padrões inteligentes](padroes-inteligentes.md)** (Smart defaults): Pré-preencher o valor mais provável.
  Use em: Formulários, fontes, modelos.
- **[Ajuda contextual](ajuda-contextual.md)** (Contextual help): Explicação curta ligada ao rótulo, em tooltip ou popover (ⓘ).
  Use em: Fórmulas, termos do domínio, campos técnicos.
- **[Informação à frente](informacao-a-frente.md)** (Front-loading): A palavra-chave nas primeiras palavras.
  Use em: Títulos, botões, mensagens.
- **[Verbos nos botões](verbos-nos-botoes.md)** (Action verbs on buttons): Verbo + objeto, até 3 palavras; o destrutivo nomeia o objeto.
  Use em: Todo botão.
- **[Esqueletos de carregamento](esqueletos-de-carregamento.md)** (Skeleton screens): Placeholder com a forma do conteúdo, só em carga de página.
  Use em: Listas e cartões que carregam.
- **[Convenção, Tesler e Doherty](convencao-tesler-doherty.md)** (Jakob, Tesler & Doherty): Convenção familiar; a complexidade só muda de lugar; feedback em até 400 ms.
  Use em: Padrões de lista, filtro e feedback.
- **[Validação em linha](validacao-em-linha.md)** (Inline validation): Valida o campo enquanto (ou assim que) a pessoa o preenche, com a mensagem ao lado do campo, e não só no envio.
  Use em: Formulários com formato (e-mail, CPF, domínio, senha).
- **[Desfazer em vez de confirmar](desfazer-em-vez-de-confirmar.md)** (Undo instead of confirm): Para ações reversíveis, execute e ofereça `Desfazer`, em vez de interromper com `Tem certeza?`.
  Use em: Arquivar, mover, excluir com lixeira, editar em lote.
- **[Hierarquia visual](hierarquia-visual.md)** (Visual hierarchy): Use tamanho, peso, cor e posição para dizer o que é primário, secundário e terciário.
  Use em: Cabeçalhos de entidade, linhas de lista, cartões, formulários.
- **[Linguagem simples](linguagem-simples.md)** (Plain language): Palavras comuns, frases curtas, voz ativa, sem jargão interno.
  Use em: Todo texto de interface, especialmente erros e avisos.
- **[Mensagens de erro úteis](mensagens-de-erro-uteis.md)** (Helpful error messages): O erro diz o que aconteceu, por quê (se ajudar) e o que fazer, com a ação à mão.
  Use em: Falhas de formulário, de integração, de pagamento, de importação.
- **[Razão dados–tinta](razao-dados-tinta.md)** (Data-ink ratio): Maximize a parte da tinta que representa dados e apague o resto: grade pesada, bordas, sombras, decorações.
  Use em: Gráficos, tabelas e painéis.
- **[Sinalizadores (signifiers)](sinalizadores.md)** (Signifiers): Faça o elemento mostrar como pode ser usado: um botão parece botão, um link parece link, um campo parece campo.
  Use em: Botões, links, áreas clicáveis, controles personalizados.
- **[Números alinhados e formatados](numeros-alinhados.md)** (Numbers that align): Alinhe números à direita, com casas fixas e separadores do idioma, e fonte de algarismos tabulares.
  Use em: Tabelas financeiras, KPIs, extratos.
- **[Agrupar com espaço](agrupar-com-espaco.md)** (Grouping with space): Use espaço em branco, mais do que linhas e caixas, para separar grupos.
  Use em: Formulários longos, páginas de configuração, cartões.
- **[Um termo por conceito](um-termo-por-conceito.md)** (One term per concept): Escolha uma palavra para cada ideia e use-a em todo lugar: menu, título, botão, e-mail, documentação.
  Use em: Todo o produto; glossário compartilhado entre design, texto e código.

## Top 12 por impacto em telas de admin

1. [Divulgação progressiva](divulgacao-progressiva.md) · 2. [Estado vazio acionável](estado-vazio-acionavel.md) · 3. [Verbos nos botões](verbos-nos-botoes.md) · 4. [Informação à frente](informacao-a-frente.md) · 5. [KPI com variação](kpi-com-variacao.md) · 6. [Ajuda contextual](ajuda-contextual.md) · 7. [Checklist de configuração](checklist-de-configuracao.md) · 8. [Selo de status](selo-de-status.md) · 9. [Ações na linha e em lote](acoes-na-linha-e-em-lote.md) · 10. [Padrões inteligentes](padroes-inteligentes.md) · 11. [Leitura de relance](leitura-de-relance.md) · 12. [Hick](hick-na-pratica.md) e [Miller](miller-na-pratica.md) na prática.

## Regras de microcopy que sustentam as técnicas

| Regra | Origem |
|---|---|
| Frases curtas, um termo por conceito | Polaris |
| Não repetir o que já está no título ou na navegação | Polaris |
| Botão começa com verbo; o rótulo combina com o resultado | Polaris |
| Selo: 1-2 palavras, no passado | Polaris Badge |
| Vazio: o que é, por que está vazio, como começar | NN/g |
| Onboarding até 5 passos, dispensável, auto-concluído | Polaris |
| Divulgação até 2 níveis | NN/g |
