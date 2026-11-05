# Exemplos

Sirva a pasta `skills/cx-dither-animacoes/` por HTTP (file:// quebra textura WebGL e máscaras CSS):

```
node scripts/verify/serve.mjs . 8790
# abra http://127.0.0.1:8790/examples/<arquivo>.html
```

Ordem de leitura (do mais simples ao mais completo):

| # | Arquivo | O que mostra | Usa |
|---|---------|--------------|-----|
| 1 | `bg-animado-canvas.html` | fundo Bayer 8x8 animado, sombra pontilhada, confete (sem WebGL) | `dither-canvas.js` |
| 2 | `tingir-paleta-svg.html` | tingir imagem cinza por paleta, troca ao vivo (sem WebGL) | `svg-tone-filter.js` |
| 3 | `rabiscos-clip.html` | rabiscos SVG "desenhados" por máscara, suave e em passos | `doodle-mask.js` |
| 4 | `shader-gradient-map.html` | gradient-map/hatch/passthrough em WebGL, reveal por mola | `dither-gl.js`, `motion-helpers.js` |
| 5 | `transicao-pixelada.html` | overlay Bayer cobrindo/revelando entre duas telas | `dither-gl.js`, `motion-helpers.js` |
| 6 | `halftone-hachura.html` | 6 algoritmos (PNGs do Python) + hachura ao vivo | `dither-gl.js`, `assets/generated/` |

Todos importam por caminho relativo `../scripts/js/...` e as imagens de `../assets/`.
A lib Motion (CDN jsDelivr) é opcional: os exemplos desligam o CDN (`window.DITHER_MOTION_CDN = false`)
e usam o fallback em requestAnimationFrame. Sem WebGL, os exemplos 4 a 6 mostram aviso/fallback.

Verificar: `node scripts/verify/shots.cjs http://127.0.0.1:8790/examples/<arquivo>.html ./prints --sizes 390x844,1280x800`
e `node scripts/verify/check-layout.cjs <url> --primary '[data-primary]'`.

## NOVOS

Adicionados na rodada 2 (todos autônomos, sem erro de console em 390x844 e 1280x800):

| Arquivo | O que mostra | Como abrir / verificar |
|---------|--------------|------------------------|
| `flip-slots.html` | `flipSlots`: moedas, escudo e caixa migram entre duas páginas por slots (spring, fallback rAF; `?cdn=1` tenta a lib Motion), com entrada opcional em dissolve Bayer via `DitherGL` | `check-layout.cjs ... --primary '#go' --steps 1,2 --step-selector '#go'` |
| `halftone-3d.html` | esfera/cubo desenhados no próprio fragment shader (sem three.js), luz que segue o ponteiro, halftone (pontos crescem com a luz) ou Bayer 8x8, controle de célula, respeita reduced-motion; o cabeçalho explica como seria com three.js | abra e mova o ponteiro sobre a forma |
| `hero-completo.html` | tudo junto com moderação: fundo Canvas 2D em dither no cabeçalho, painel chapado, botão com relevo 3D, objeto com sombra pontilhada e dissolve Bayer, rabisco sob "recarga", marcador pontilhado | `check-layout.cjs ... --primary '[data-primary]' --sizes 360x640,390x844,1280x800` |

Também mudou nos scripts de apoio:
- `scripts/js/dither-gl.js`: no modo `passthrough` a textura agora fica **nítida** (resolução cheia); passe `mosaic: true` para o efeito de mosaico (celulas `px`).
- `scripts/js/motion-helpers.js`: `flipSlots.goTo` faz "pop" no próprio slot para objetos que estavam ocultos.

Geradores de arquivo (Python) que alimentam estes exemplos e `assets/`:
`scripts/python/dither_anim.py` (GIF/PNG/WebM/MP4 em dither) e `scripts/python/doodle_gen.py` (rabiscos SVG brush/engrave/pixel).
Veja `scripts/README.md`.

## Núcleo (botão, campo, cena, React)

Também autônomos; sirva por HTTP como os demais. Cada um tem plano B sem WebGL ou com movimento reduzido.

| Arquivo | O que mostra |
|---------|--------------|
| `button-brasa.html` | botão Canvas 2D com feixe de luz na borda, variantes Brasa e Placa, tema e cor por token |
| `dither-field.html` | WebGL2: campo de 4 tons (maré, ondas, chuva), HUD e reserva sem WebGL |
| `scene-objects.html` | cena em pixel (moeda, pacote, cartão) e 3D leve por SDF com morph |
| `react-dither-canvas.tsx` (+ `.demo.tsx`, `.demo.html`) | hook e componente React genéricos, seguros em StrictMode |
