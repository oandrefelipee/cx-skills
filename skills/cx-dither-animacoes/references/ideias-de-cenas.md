# Ideias de cenas e gráficos em dither (inspiração, escolha na hora)

Servem só como referência para se inspirar: nada aqui é obrigatório, e cada pedido escolhe (ou combina) o que fizer sentido. Todas cabem nos scripts da skill.

| Ideia | Como construir | Movimento | Onde usar |
|---|---|---|---|
| **Cofre** | objeto procedural em rampas de 4 tons (`procedural_sticker.py`, ver workflows/ilustracao-procedural.md), porta e disco como camadas separadas | disco gira em passos, porta abre com mola (`motion-helpers.js`), brilho em dither sai de dentro | boas-vindas, "guardado com segurança", confirmação de pagamento |
| **Impressora de dinheiro** | caixa em pixel-art nativa + cédulas procedurais; sequência de quadros (`dither_anim.py`) ou sprite CSS `steps()` | cédulas saem em fila, sobem e se empilham; luz piscando em 2 quadros | tela de espera de pagamento, carregamento, comemoração |
| **Notas dos pacotes** | uma cédula por pacote, crescendo em quantidade/tamanho (1 nota, maço, pirâmide), mesma geometria e paletas diferentes | hover levanta a nota; selecionar faz dissolve Bayer e salto com mola | seletor de pacote ou de créditos |
| **Background** | `dither-canvas.js` (Bayer 8x8, 3 tons, 12 a 15 fps) ou `dither-gl.js` modo `background` | respira devagar; acende na conclusão; estático com reduced-motion | atrás do palco do herói, nunca atrás de texto pequeno |
| **Gráfico em dither** | barras/linha/área desenhadas em Canvas com Bayer (ver o Dither Kit em references/bibliotecas.md) | barras crescem em passos; ponto destacado pisca 2 quadros | painéis e relatórios, sempre com versão limpa legível ao lado |
| **Moedas e confete** | `confetti()` de `dither-canvas.js` (quadrados 4x4 em 2 tons) ou moedas procedurais | caem pelas laterais, nunca sobre o título | comemoração |
| **Transição de passo** | overlay Bayer (`dither-gl.js` modo overlay) | cobre e revela, 400 a 800 ms | modais em passos, wizards |

Regra: um ou dois focos por tela; o resto fica chapado.
