# Acessibilidade e movimento reduzido

Dither é decoração que se mexe: o risco é atrapalhar leitura, foco, vestibular e energia. Estas regras valem para todo exemplo e receita do pacote. Foram verificadas nos exemplos com `axe-core` (0 violações em claro e escuro) **e** com capturas em movimento reduzido; o que o `axe` não enxerga (conteúdo de canvas) está marcado como revisão manual.

## 1. `prefers-reduced-motion`

Regra geral: **com movimento reduzido nada se move sozinho**. Mantenha a imagem (um quadro bonito e estável), troque animações por mudança de estado imediata ou fade curto (≤ 150 ms).

| Peça | Com `reduce` |
|---|---|
| Canvas/shader em laço | um quadro com `t = 3.3` e **nenhum** `requestAnimationFrame`; redesenhar o quadro parado em resize, mudança de tema/cor e mudança de valor (`laco.pedir()` nos exemplos) |
| Feixe de luz (`offset-path`) | `animation: none; offset-distance: 14%` (o ponto fica parado numa posição agradável) |
| Botão aceso (hover/foco) | `nivel = alvo` direto (sem suavização), sem `transform: scale` no `:active` |
| Cena de uma tomada (celebração) | só o banner/texto estático, sem canvas, sem confete; contador mostra o valor final já (`setTimeout 0`) |
| Transição de passos | troca direta ou fade ≤ 150 ms (nada de dissolução Bayer animada) |
| Contador subindo | valor final direto |
| Parallax/luz que segue o mouse | desligar (a biblioteca de animação **não** cobre isso: `MotionConfig reducedMotion="user"` só altera o que ela anima) |
| Canvas com `canvas-confetti` | `disableForReducedMotion: true` |

Detalhes que já morderam:
- A sonda de cor deve ter `transition: none`: com movimento reduzido o app pode ligar transições curtas em tudo e a leitura logo após trocar o tema devolve a cor antiga.
- Ouça a mudança em tempo real: `matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', …)`.
- Em testes: `context = browser.newContext({ reducedMotion: 'reduce' })` (ou `capture.mjs --reduced-motion`). Como o quadro parado é **determinístico**, ele também serve para comparação visual entre versões.

## 2. Movimento que não depende da preferência

- **Pausar fora da tela e com aba oculta** (`IntersectionObserver`, `visibilitychange`): economia de bateria e menos distração.
- Conteúdo que se move sozinho por mais de 5 s e aparece ao lado de outro conteúdo precisa de uma forma de pausar, parar ou ocultar (WCAG 2.2.2, nível A). Para fundos decorativos lentos, ofereça um botão "pausar animações" ou ligue o fundo ao estado `reduce`; em cenas que carregam informação, não dependa só da animação.
- **Flicker** (WCAG 2.3.1): no máximo 3 flashes por segundo e nada de troca brusca de brilho em área grande. O grão temporal do dither (ruído que muda a 12 Hz, `ign(cell + floor(t*12.))`) deve ter baixa amplitude; celebração sem clarão de tela cheia, pulso de anel ≤ 3 ciclos, nada de `lighter` em tela cheia.
- Nunca o dither sozinho comunica estado (ligado/desligado, erro, sucesso): acompanhe de texto, ícone ou forma.

## 3. Texto alternativo e semântica

- **Decorativo** (fundo, brasas, campo): `aria-hidden="true"` no canvas ou no contêiner. Os exemplos fazem isso.
- **Informativo** (ilustração que explica algo, gráfico): `role="img"` + `aria-label` com a **informação**, não com "canvas animado". Ex.: "Pilha de moedas, pacote, cartão e notas flutuando num céu de dither". Gráfico: `label="Projeção do saldo"` (Dither Kit) mais a tabela de dados ou um resumo em texto ("Cobre a Black Friday com folga de 312 pedidos").
- **Controle desenhado** (seletor de valor): papel nativo (`role="slider"` com `aria-valuemin/max/now/text`, teclado completo) ou use `<input type=range>` estilizado. Botões de toque invisíveis sobre o desenho (leque de notas) formam um `role="radiogroup"` com setas.
- Botão é `<button>`, não `<div>`; o canvas vai **dentro**, atrás do texto, `aria-hidden`.
- Região viva para resultado de celebração: `aria-live="polite"` com o texto completo ("Compra confirmada, +1.200 créditos, saldo 3.400"). Anuncie uma vez.
- Modal/celebração: `role="dialog" aria-modal="true"`, foco no botão principal (`autoFocus`), `Esc` fecha, devolve o foco, rolagem do corpo travada enquanto aberto.

## 4. Contraste e legibilidade

- Texto normal ≥ 4,5:1, texto grande e componentes de UI ≥ 3:1 (WCAG 1.4.3 e 1.4.11), **no pior quadro** do dither, não só no médio.
- Texto sobre trama perde legibilidade mesmo com a média boa. Soluções testadas: painel com fundo quase sólido (`color-mix(in oklab, var(--background) 80%, transparent)` + blur), halo da cor do fundo atrás das letras (`text-shadow` da própria cor da placa), densidade baixa no miolo do botão, texto **branco ou escuro escolhido pelo contraste calculado** sobre a cor de marca (`contraste(white, cor) >= contraste(escuro, cor)`).
- Cinza nunca sobre superfície colorida; use a cor do texto da superfície ou uma mistura dela.
- `axe-core` não lê o canvas: confira o contraste do texto sobre o dither **olhando a captura ampliada** (DPR 2) em claro e escuro, no estado "aceso" e parado. Para medir, amostre pixels da captura em torno do texto.
- Tema claro: dither "de buraco" mostra o fundo branco. Use duas opacidades da mesma cor (receita 10) ou a rampa invertida (destaque mais escuro), e confira.
- `forced-colors: active` (modo de alto contraste): canvas decorativos podem sumir; garanta bordas e texto por CSS (`border`, `outline`) que sobrevivem.

## 5. Foco, teclado e toque

- `:focus-visible` com anel visível (2 px + deslocamento), no botão e não só no canvas; foco também acende o feixe (`data-aceso`).
- Alvos de toque ≥ 44 px, texto ≥ 15 px no celular (regra do modal da primeira recarga). No toque não existe hover: o estado "aceso" vem de `pointerdown`/`focus`.
- Cursor customizado só para `pointerType === "mouse"`; toque e caneta usam a alça fixa. Nunca esconda o cursor do sistema em áreas que não respondem ao arrasto.
- Respeite `touch-action: none` apenas onde o arrasto controla um valor.

## 6. Roteiro rápido de verificação (a11y)

1. Rodar `axe-core` (claro e escuro) e zerar violações: `node` + Playwright + `axe.min.js` injetado (exemplo em `prova-e-captura.md`).
2. Capturar com `reducedMotion: 'reduce'` e confirmar que há um quadro estável e **nenhum** laço (HUD "0 quadros/s").
3. Navegar só com Tab/Enter/setas: foco visível em cada controle, ordem lógica.
4. Conferir contraste do texto sobre o dither em captura ampliada.
5. Verificar `aria-hidden` nos decorativos e `aria-label` nos informativos.
6. Testar sem WebGL (`getContext` devolvendo `null`) e conferir o gradiente/imagem de reserva.
