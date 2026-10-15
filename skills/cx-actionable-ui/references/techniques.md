# Catálogo de técnicas

Fontes: Shopify Polaris (conteúdo, onboarding, Badge), Nielsen Norman Group (divulgação progressiva, information scent, estados vazios, esqueletos), Laws of UX. Use o prompt de uma linha para pedir a técnica a um agente.

## Índice
1. Divulgação progressiva · 2. Escaneabilidade · 3. Leitura de relance · 4. Pista de informação · 5. Lei de Hick · 6. Lei de Fitts · 7. Lei de Miller · 8. Reconhecimento em vez de memorização · 9. Mostrar, não explicar · 10. Ações na linha e em lote · 11. Estado vazio acionável · 12. Checklist de configuração · 13. Selos de status · 14. KPI com variação · 15. Padrões inteligentes · 16. Ajuda contextual · 17. Informação à frente · 18. Verbos nos botões · 19. Esqueletos de carregamento · 20. Convenção, Tesler, Doherty

**Top 12 por impacto em telas de admin:** 1, 11, 18, 17, 14, 16, 12, 13, 10, 15, 3, 5/7.

| # | Técnica (EN / pt-BR) | Definição | Quando usar | Anti-padrão | Prompt de uma linha |
|---|---|---|---|---|---|
| 1 | Progressive disclosure / Divulgação progressiva | Poucas opções essenciais primeiro; o resto sob demanda. Máx. 2 níveis | Configuração, formulários longos, detalhe | 3+ níveis; gatilho vago; mesma opção em várias rotas | "Aplique divulgação progressiva: só o que se usa em 80% das vezes fica visível, máx. 2 níveis, gatilho claro." |
| 2 | Scannability (F/Z-pattern) / Escaneabilidade | A pessoa varre em F; o início de cada linha pesa mais | Listas, cabeçalhos, cartões | Parágrafo denso; título que começa por palavra vazia | "Reescreva para escaneabilidade: título começa pela palavra informativa, bullets, sem parágrafo de mais de 2 linhas." |
| 3 | Glanceability / Leitura de relance | Entender o estado em 1-2 s sem ler | KPIs, status de integração, cabeçalho de entidade | Estado só em prosa; número sem contexto | "Faça esta seção passar no teste de 2 segundos: estado e número principal sem ler texto." |
| 4 | Information scent / Pista de informação | O rótulo promete o que há atrás do clique | Navegação, links, cartões de ação | "Saiba mais", "Detalhes", título que engana | "Revise rótulos de navegação e links: cada um diz o que a pessoa encontra ali." |
| 5 | Hick's Law / Lei de Hick | Mais escolhas, mais tempo de decisão | Barras de ação, menus | 6 botões de peso igual | "Reduza as escolhas: 1 primária, 1-2 secundárias, o resto em menu." |
| 6 | Fitts's Law / Lei de Fitts | Alvo maior e mais perto é mais rápido | Ação frequente, mobile | Ação frequente em ícone pequeno e distante | "Aumente e aproxime a ação mais usada; alvo mínimo de 44 px no mobile." |
| 7 | Miller's Law / Lei de Miller | A memória de trabalho segura cerca de 7 itens | Agrupar métricas e menus | 12 métricas iguais | "Agrupe em blocos de até 5-7 itens com título curto." |
| 8 | Recognition over recall / Reconhecimento em vez de memorização | Mostre opções em vez de exigir lembrar | Filtros, busca, seleção | Campo livre onde cabia lista | "Troque campo de texto livre por seleção com opções visíveis e recentes." |
| 9 | Show, don't tell / Mostrar, não explicar | Exemplo ou preview no lugar de instrução | Onboarding, vazios | Parágrafo que um preview resolveria | "Troque a explicação por um exemplo vivo ou preview; no máximo 1 linha de apoio." |
| 10 | Inline & bulk actions / Ações na linha e em lote | Ação onde está o dado; seleção múltipla abre barra de ações | Listas de pedidos, fontes, domínios | Ir a outra página para ação simples | "Mova ações frequentes para a linha e adicione barra de ações em lote ao selecionar." |
| 11 | Actionable empty state / Estado vazio acionável | Diz o que a área mostrará, por que está vazia e dá o botão para começar | Toda lista ou seção que pode estar vazia | Tela em branco, "Nenhum dado", "—" sozinho | "Neste vazio: 1 linha do que aparecerá, 1 botão de primeira ação, 1 link de ajuda opcional." |
| 12 | Setup checklist / Checklist de configuração | Até 5 passos auto-marcados, com progresso, dispensável | Primeira configuração | Tutorial longo e bloqueante; passos marcados à mão | "Monte um checklist de até 5 passos, auto-concluídos, com progresso e botão por passo." |
| 13 | Status badge / Selo de status | 1-2 palavras, no passado, mesmo tom para o mesmo status | Tabelas, cabeçalhos | Selo com frase; cor diferente para o mesmo status | "Padronize os selos: 1-2 palavras (Entregue, Pausado), tom fixo por status." |
| 14 | KPI card with delta / Cartão de KPI com variação | Valor grande, rótulo curto, delta com sinal e período, mini-tendência | Visão geral, créditos, pedidos, e-mails | Número sem comparação; descrição longa | "Cada KPI: valor, rótulo de 1-3 palavras, delta com sinal e período, sem parágrafo." |
| 15 | Smart defaults / Padrões inteligentes | Pré-preencher o valor mais provável | Formulários, fontes, modelos | Campo obrigatório vazio com valor óbvio | "Pré-preencha com o padrão mais provável e deixe 'Alterar' discreto." |
| 16 | Contextual help / Ajuda contextual | Tooltip ou popover curto ligado ao rótulo (ícone ⓘ) | Termos do domínio, fórmulas, campos técnicos | Parágrafo de ajuda sob cada campo | "Mova explicações para tooltip/popover de 1-2 linhas ligado ao rótulo." |
| 17 | Front-loading / Informação à frente | A palavra-chave nas primeiras palavras | Títulos, botões, mensagens | "Você pode, a qualquer momento, adicionar…" | "Reescreva cada frase com a informação-chave nas 3 primeiras palavras." |
| 18 | Action verbs on buttons / Verbos nos botões | Verbo + objeto, 2-3 palavras; destrutivo nomeia o objeto | Todo botão | "OK", "Enviar", "Continuar", "Clique aqui" | "Todo botão: verbo + objeto, máx. 3 palavras; destrutivo nomeia o que será excluído." |
| 19 | Skeleton screens / Esqueletos | Placeholder com a forma do conteúdo, só para carga de página | Listas, cartões | Spinner de tela inteira; skeleton em upload | "Use skeleton com a estrutura real para carga de página; barra de progresso para tarefa longa." |
| 20 | Jakob / Tesler / Doherty | Convenção familiar; a complexidade só muda de lugar; resposta em até 400 ms | Padrões de lista, filtro e feedback | Inventar padrão novo para ação comum | "Use o padrão convencional de lista, filtro e busca; dê feedback em até 400 ms." |

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
