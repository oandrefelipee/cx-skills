# Workflow: halftone e hachura (gravura)

Objetivo: imagem ou UI com meio-tom (pontos), hachura (linhas de gravura), ou halftone como pos-processamento 3D.
Ferramentas: `scripts/python/dither_image.py --algo halftone|hatch` (imagem estatica), `scripts/js/dither-gl.js` modo `hatch` (ao vivo), exemplo `examples/halftone-hachura.html` (6 algoritmos lado a lado, hachura ao vivo). Imagens de amostra em `assets/generated/` (`encomenda-halftone.png`, `encomenda-hatch.png`...).
Referencias: `references/algoritmos.md` (secoes 5 e 6), `references/webgl-shader.md`, `references/estilos-e-referencias.md` (secoes 6 e 7).

## Aviso de gosto
No caso real o usuario **rejeitou a hachura como visual principal** (a tecnica ficou). Pergunte antes de adotar hachura/gravura como estilo da tela; como textura de detalhe (nota, certificado, ilustracao editorial) costuma ser aceitavel. Halftone e primo mais "editorial".

## Passos (imagem estatica)

1. **Escolha**: ponto (`halftone`, jornal/impressao) ou linha (`hatch`, gravura). `--cell` = periodo do ponto/linha em px (6 a 12 para leitura).
   ```bash
   python3 scripts/python/dither_image.py in.png out/halftone.png --algo halftone --preset cinema --cell 8
   python3 scripts/python/dither_image.py in.png out/hatch.png    --algo hatch    --palette "#2B2118,#B9A98A,#F2ECDC" --cell 5
   ```
   A paleta vai sempre do mais escuro ao mais claro (escuro = tinta). Para jornal: 1 tinta escura sobre papel claro (2 cores: `--palette "#0B1033,#F2ECDC"`). Para gravura de nota: tinta de 1 a 2 cores sobre creme.
2. **Contraste de entrada**: `--lo/--hi/--gamma` para que a imagem use toda a faixa; halftone e muito sensivel a meios-tons.
3. **Sentido da tinta**: pontos/linhas representam **escuridao**. Em fundo escuro com tinta clara (como o shader de hachura do caso real) a tinta representa **luminancia**; confirme a inversao.
4. **Prancha** sobre varios fundos e compare com a original (`make_sheet.py`).

## Passos (ao vivo, WebGL)
```js
import { DitherGL } from '../scripts/js/dither-gl.js';
const g = new DitherGL(canvas); g.resize(480, 480); g.setTexture(img, { premult: true });
g.draw({ mode: 'hatch', px: 3, hatchPer: 4, colors: ['#0B1033','#2B2118','#B9A98A','#F2ECDC'] });
```
`hatchPer` e o periodo em css px; o motor escala por DPR e `scale` (passe `scale` se o objeto encolhe) com piso de 2.5 px para a linha nao sumir. Linhas diagonais: espessura `.16 + lum*.62`, segunda familia cruzada nos tons altos. Anime `reveal` para "gravar" a imagem.

## Halftone 3D (resumo)
Exemplo pronto e testado: `examples/halftone-3d.html` (esfera ou cubo no fragment shader, halftone ou Bayer, luz no ponteiro, celula em px de tela). Receita e limites (serrilhado na borda): `references/webgl-shader.md` secao 10.
Renderize a cena three.js em cinza num render target; um passe de tela cheia converte luminancia em pontos (`algoritmos.md` secao 5, GLSL) na grade rotacionada. Alternativas: `HalftoneDots` do Paper Shaders (WebGL2). So vale se ha cena 3D real; para imagem 2D use o script.

## Pronto quando
- [ ] Periodo (celula) legivel no tamanho final: amplie 400% e veja pontos/linhas distintos, sem moire.
- [ ] Moire ausente ao redimensionar (se aparecer, use periodo inteiro em px de dispositivo ou suavize).
- [ ] Contraste tinta/papel >= 4.5:1 se houver texto sobre a imagem.
- [ ] Gosto confirmado com o usuario (hachura) e variacoes catalogadas.
- [ ] Fallback pre-assado (PNG) para sem WebGL.
