# Desempenho e acessibilidade

Conteudo: 1 Orcamento, 2 Escada de fallback, 3 reduced-motion, 4 Fotossensibilidade, 5 Leitura e contraste, 6 Semantica, 7 Toque e mobile, 8 Gate de dispositivo fraco.

## 1. Orcamento (valores do caso real e de bom senso)

| Item | Regra |
|---|---|
| Canvas 2D de fundo | resolucao `W/CELL x H/CELL` (CELL 4 = 1/16 dos pixels); 12 a 15 fps |
| WebGL | DPR <= 1.5 (dither e pixelado de proposito; DPR 1 ja serve); 1 quad tela cheia |
| Contextos WebGL | um por superficie grande; navegadores derrubam o mais antigo apos ~16; destruir ao fechar (`WEBGL_lose_context`) |
| Elementos animados | 1 a 2 por tela; os demais estaticos |
| Particulas (confete) | < 150, `Math.round` nas posicoes, canvas de meia resolucao |
| Pausa | `document.hidden`, `IntersectionObserver` (fora da viewport), aba em segundo plano |
| Imagens pre-assadas | WebP lossless para poucas cores; PNG com alfa binario; evitar JPEG |
| JS | sem biblioteca para 1 efeito; Motion via `motion/mini` ou `LazyMotion` se bundle importar |

Custo real de um quad com ~40 operacoes por pixel: 720x720 a DPR 1 roda a 60 fps em iGPU de 2018. O que pesa: DPR alto, muitos contextos, `filter: blur` animado e `getBoundingClientRect` no loop.

## 2. Escada de fallback (sempre ter a proxima degrau)

1. WebGL2/1 com shader completo.
2. Canvas 2D (fundo Bayer, 12 a 15 fps).
3. Imagem pre-assada (`dither_image.py`) com `image-rendering: pixelated`.
4. CSS puro: `linear-gradient` de 3 tons + tile Bayer 8x8 (`svg-css.md` secao 4).
5. Quadro textual / cor chapada.

Detecte: `canvas.getContext('webgl2')` / `'webgl'`; `try/catch` ao compilar o shader (contar `window.__shaderErrors`). Sempre deixe a imagem/estado final no HTML (progressive enhancement): sem JS a pagina continua inteira.

## 3. prefers-reduced-motion

- CSS: desligue `animation`/`transition`, mantenha o **estado final** visivel (nada de `clip-path`/`opacity: 0` do estado inicial preso).
- Canvas/WebGL: desenhe **um quadro estatico** e pare o rAF; escute mudancas (`matchMedia(...).addEventListener('change', ...)`).
- Mola/morph: `onUpdate(1)` imediato.
- Transicoes viram corte seco ou fade de ~150 ms.
- Fundos animados, parallax, flutuacao, confete e marquee simplesmente nao rodam.

## 4. Fotossensibilidade

Nada deve piscar mais de **3 vezes por segundo** em area grande (WCAG 2.3.1). Dither de alto contraste (preto/branco) que oscila a 12+ fps em tela cheia pode violar: use tons proximos (azul sobre azul) e movimento lento (o campo se desloca devagar; so a grade e discreta). Transicoes em tela cheia: uma passada, nao piscar.

## 5. Leitura e contraste

- Texto >= 12 a 13 px; corpo 14 a 16 px. Dither sob texto menor que 12 px vira ruido.
- Contraste do texto sobre a **pior** celula do dither (tom mais claro ou mais escuro adjacente), >= 4.5:1.
- Nunca pinte dither por cima do texto. Se o enfeite precisa tocar o texto, deixe o centro limpo.
- Informacao nunca vive so no padrao (use cor + forma + texto).
- Objeto da cor do fundo exige contorno/adesivo; teste sobre branco tambem.
- Modo de alto contraste/forced-colors: confira que bordas e estados continuam visiveis (`@media (forced-colors: active)`).

## 6. Semantica

- Decorativo: `aria-hidden="true"` no canvas/SVG, ou `alt=""` na imagem.
- Informativo (um grafico em dither): `role="img"` + `aria-label` descritivo (o `Dither Kit` aceita `label`), e a tabela de dados acessivel em outro lugar.
- Texto de estado que muda (ex.: "pagamento confirmado") em `aria-live="polite"` fora do canvas.
- Foco visivel nos botoes com relevo (o `outline` nao pode sumir por causa da sombra dura).

## 7. Toque e mobile

- Alvos >= 44 x 44 px (>= 40 px em links secundarios de rodape, minimo aceito no caso real).
- Botao primario sempre dentro da viewport (rodape fixo com `padding-bottom: env(safe-area-inset-bottom)`).
- Matriz: 360x640, 375x667, 390x844, 412x915, 430x932 e 1280x800. Sem rolagem horizontal.
- Parallax so com `pointer: fine`; em toque, desligue.
- Esconda enfeites que cobrem texto em telas estreitas.

## 8. Gate de dispositivo fraco (opcional)

Para efeitos pesados (shader cinematografico), caia para 2D ou quadro estatico se: sem WebGL2, `navigator.connection?.saveData`, `effectiveType` `2g`/`slow-2g`, `navigator.deviceMemory <= 2` (verificar suporte), FPS medido baixo nos primeiros segundos, ou movimento reduzido. Carregue o motor so com a aba visivel. Medir FPS: conte quadros em 1 s com `requestAnimationFrame` e desista se < 30.
