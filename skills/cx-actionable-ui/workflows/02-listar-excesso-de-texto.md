# 02. Listar o excesso de texto

Objetivo: decidir, bloco a bloco, o que fica, encurta, muda de lugar ou sai.

1. Conte as palavras visíveis de cada bloco de texto (rótulos de botão não entram).
2. Marque como suspeito: parágrafo com mais de 2 linhas, explicação fixa, fórmula por extenso, frase que repete o título ou o selo, estado dito só em prosa, "—" sozinho.
3. Dê um veredito por bloco:

| Veredito | Quando | Vai para |
|---|---|---|
| Manter | Muda a decisão ou é o próprio estado | Fica |
| Encurtar | Correto, mas longo | Microcopy (passo 04) |
| Virar ajuda | Explica "como" ou "por quê" | Tooltip ou popover ⓘ ([ajuda contextual](../references/tecnicas/ajuda-contextual.md)) |
| Virar estado vazio | Só aparece quando não há dados | [Vazio acionável](../references/tecnicas/estado-vazio-acionavel.md) |
| Virar selo | Diz o estado em frase | [Selo de status](../references/tecnicas/selo-de-status.md) |
| Cortar | Repete título, vizinho ou o óbvio | Remover |

Saída: tabela `bloco | palavras | veredito | técnica`, com a técnica como link para o arquivo dela.
