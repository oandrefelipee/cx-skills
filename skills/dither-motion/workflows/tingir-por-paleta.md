# Workflow: tingir por paleta (gradient-map)

Objetivo: recolorir uma ilustracao de poucos tons (ou qualquer imagem) com a paleta da marca, e poder TROCAR a paleta sem regerar a arte.
Ferramentas: `scripts/js/svg-tone-filter.js` (filtro SVG, sem WebGL), `scripts/js/dither-gl.js` (modo `gradient-map`), `scripts/python/palette_tools.py` (`map`, `svg-tones`, `contrast`, `ramp`), `scripts/python/dither_image.py` (`--preset cinema` para gerar a base cinza). Exemplo: `examples/tingir-paleta-svg.html`.
Referencias: `references/svg-css.md` (secao 1), `references/paletas.md`.

## Escolha do caminho
| Situacao | Caminho |
|---|---|
| Arte ja em 4 tons de cinza, tema trocavel em CSS, sem WebGL | filtro SVG |
| Qualquer imagem, quer dither + paleta ao vivo, objeto animado | shader `gradient-map` |
| So precisa de um PNG recolorido | `palette_tools.py map` (Python) |

## Passos (filtro SVG)

1. **Base cinza de 4 tons exatos**: se a arte nao esta pronta, gere: `python3 scripts/python/dither_image.py in.png base.png --algo bayer8 --preset cinema --cell 4` (cinzas `#0A0A0A, #5A5A5A, #B0B0B0, #FFFFFF`).
2. **Paleta** do mais escuro ao mais claro (4 hex). Veja o contraste: `python3 scripts/python/palette_tools.py contrast "#FFC933" "#0B1033"`.
3. **Filtro**: gere os `tableValues` (`python3 scripts/python/palette_tools.py svg-tones --palette "#0B1033,#4C1D95,#2DD4BF,#FFC933"`) ou use o helper:
   ```js
   import { mountTone, applyTone, setTones } from '../scripts/js/svg-tone-filter.js';
   mountTone('tone', ['#0B1033', '#4C1D95', '#2DD4BF', '#FFC933']);
   applyTone(document.querySelector('.arte'), 'tone');
   setTones('tone', ['#0B1033', '#8B5CF6', '#2DD4BF', '#F2ECDC']);   // troca ao vivo
   ```
4. **Compare variacoes de ordem** (A/B/C, `paletas.md` secao 7) lado a lado; o mapeamento discreto depende da ordem. Imprima em prancha sobre azul, branco e escuro.
5. **Confira bordas**: antialias cria tons intermediarios (franja). Se aparecer, regenere a base sem antialias (`--keep-alpha` desligado) ou ponha contorno de tinta no tom 0.
6. **Sombra dura depois do tingimento**: `filter: url(#tone) drop-shadow(0 6px 0 rgba(0,16,80,.55))`.

## Passos (shader gradient-map)
```js
import { DitherGL } from '../scripts/js/dither-gl.js';
const g = new DitherGL(canvas); g.resize(320, 320);
g.setTexture(img, { premult: true });                         // nearest:true para pixel-art
g.draw({ mode: 'gradient-map', px: 3, colors: ['#0B1033','#4C1D95','#2DD4BF','#FFC933'] });
```
`lo/hi/gam` esticam a luminancia; `aDither: true` tramam a borda do alfa.

## Pronto quando
- [ ] A paleta troca em runtime (CSS/JS) sem regerar a imagem.
- [ ] Cada tom cai no degrau esperado (prancha mostra 4 cores, sem tons intermediarios).
- [ ] Testado sobre fundo azul, branco e escuro; contraste do objeto contra o fundo >= 3:1.
- [ ] `color-interpolation-filters="sRGB"` presente (o helper ja faz).
- [ ] Fallback: sem filtro/WebGL, a imagem original ou uma versao pre-gerada em Python aparece.
