# Armadilhas (sintoma, causa, solucao)

Cada item custou tempo no trabalho real. Procure pelo sintoma.

| # | Sintoma | Causa | Solucao |
|---|---|---|---|
| 1 | Canvas WebGL preto ou textura nao carrega; console com erro de seguranca | Pagina aberta por `file://` (textura bloqueada) | Servir por HTTP (`scripts/verify/serve.mjs`) |
| 2 | `ERR_CONNECTION_RESET` e imagens que somem no verificador | `python -m http.server` derruba conexoes sob carga com varios verificadores | Servidor Node estatico proprio; rodar verificacoes em serie; recarregar imagem 2 vezes nos builders |
| 3 | WebGL nao renderiza no Chromium headless | Sem GPU | `--use-gl=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist` (+ `--use-angle=swiftshader`); ignorar "GPU stall due to ReadPixels" |
| 4 | Print "no meio da transicao" sempre mostra inicio ou fim | A transicao termina antes do print / headless ritma diferente | Forcar o estado por funcao de debug, trace de rAF ou relogio congelado |
| 5 | Playwright reclama de Chromium ausente | Versao do Playwright pede um build que nao esta instalado | `executablePath` apontando para o headless shell em cache (`~/Library/Caches/ms-playwright/chromium_headless_shell-*`), sem `playwright install` |
| 6 | Hover/estado selecionado "nao pega" depois de uma animacao de entrada | Animacao CSS com `fill-mode: both` mantem o `transform` final | Animar `translate`/`scale` individuais em vez de `transform`, ou remover a classe depois |
| 7 | Dither borra ou engrossa quando o objeto encolhe/morfa | Celula dimensionada pela textura, nao pela tela | `px_canvas = cell_css * DPR / escala`; recalcular a cada quadro |
| 8 | Franja escura nas bordas de PNG com alfa | Mipmap sem alfa premultiplicado | `UNPACK_PREMULTIPLY_ALPHA_WEBGL = true` (ou `tap()` no shader, mas so um dos dois) e saida `vec4(rgb*a, a)` |
| 9 | Pixel-art com bordas moles | Filtro LINEAR / mipmap na textura ou `image-rendering` ausente | `NEAREST` sem mipmap; CSS `image-rendering: pixelated`; tamanhos em multiplos inteiros |
| 10 | `generateMipmap` falha em WebGL1 | Textura nao e potencia de 2 | Usar 512/1024, ou LINEAR sem mipmap; WebGL2 nao tem a restricao |
| 11 | Dither sobre o titulo reduz a leitura | Confete/glow/canvas por cima do texto | Manter aneis/halos com centro limpo; particulas so nas laterais; z-index abaixo do texto |
| 12 | Ruido ilegivel em textos pequenos | Texto < 12 px sobre dither | Corpo >= 12 a 13 px; alvos >= 44 px; texto sobre cor chapada |
| 13 | Objeto "some" no fundo | Objeto azul sobre fundo azul; dither claro sobre azul | Adesivo branco de recorte; conferir sobre azul, branco e escuro |
| 14 | A paleta tingida por filtro SVG sai com cores trocadas | O mapeamento discreto depende da ordem dos tons; antialias cria tons intermediarios | Testar variacoes A/B/C em vez de supor; arte de origem sem antialias; `color-interpolation-filters="sRGB"` |
| 15 | Filtro SVG troca os degraus (tons deslocados) | Padrao do filtro e `linearRGB` | `color-interpolation-filters="sRGB"` no `<filter>` |
| 16 | Imagem de IA "pixel-art" nao tem grade nem 5 cores | IA nao respeita hex exato nem grade nativa | Normalizar (NEAREST para pixel-art, Lanczos para o resto) e validar por script: blocos 8x8 uniformes, N cores exatas, alfa binario |
| 17 | Objeto gerado sem transparencia | IA entregou fundo opaco | Exigir alfa nativo; validar `sips -g hasAlpha arquivo.png`; recortar |
| 18 | Ampliacao com colunas de largura irregular | Escala fracionaria em pixel-art | Multiplos inteiros do tamanho nativo |
| 19 | Fundo dither "treme" ou pisca entre quadros | Difusao de erro (instavel) usada em animacao, ou 30+ fps com contraste alto | Bayer/blue noise (estaveis); 12 a 15 fps; tons proximos |
| 20 | Contexto WebGL some depois de varios objetos | Um contexto por objeto (limite ~16) | Um canvas por superficie grande; Canvas 2D para os pequenos; `loseContext` ao desmontar |
| 21 | Animacao continua com aba oculta, gasta bateria | rAF sem pausa | `document.hidden`, `IntersectionObserver`, `visibilitychange` |
| 22 | Usuario com reduced-motion ve tela vazia | Estado inicial do `clip-path`/`opacity: 0` preso | No `@media (prefers-reduced-motion)`, desligar a animacao e restaurar o estado final |
| 23 | Morph de canvas distorcido com `layoutId` (Motion) | Layout animation usa `transform: scale` | Tamanho fixo no canvas e o wrapper escala; ou `layout="position"` e re-render do dither ao fim |
| 24 | Mola deixa o objeto a fracoes de pixel do slot | Faltou o `onUpdate(1)` final | Forcar `onUpdate(1)` ao concluir; `reveal = 1`, `resolve = 1` |
| 25 | CSS e JS brigam pelo `transform` | Dois sistemas no mesmo elemento | Wrappers separados (externo JS, interno CSS: flutuacao) |
| 26 | Luminancia errada nas bordas ao gerar dither em Python | Usou RGB premultiplicado | Dividir por alfa antes de calcular luminancia |
| 27 | Pixel-art ampliada borrada em Python | `LANCZOS`/`BICUBIC` ao ampliar | `Image.NEAREST` ao ampliar; Lanczos so ao reduzir arte normal |
| 28 | Salvou JPEG e o dither virou lixo | Compressao com perda em poucas cores | PNG ou WebP lossless |
| 29 | Dither desalinhado entre Canvas 2D e shader na mesma tela | `gl_FragCoord` tem origem embaixo | Inverter Y no shader (`gl_FragCoord.y = res.y - y`) se precisar casar |
| 30 | Em zsh, `echo =====` ou `git show ref:path` quebram | `=cmd` expande como comando; `$ref:a` e modificador | Aspas em `"====="` e `"${ref}:path"` |
| 31 | Imagem cross-origin "taint" a textura | Sem CORS | Mesma origem ou `crossOrigin='anonymous'` + cabecalho CORS |
| 32 | Meia celula nas bordas do canvas | `round(W/CELL)` vs `offsetWidth` nao multiplo | Ajustar o canvas para `ceil` e cortar com `overflow:hidden`, ou dimensionar o pai em multiplo da celula |

## Pensando antes de dar print
- A metade dos problemas visuais vem de 3 coisas: celula errada na tela (7), alfa/premultiplicado (8), contraste/leitura (11, 12, 13).
- Se algo "quase" funciona, verifique primeiro: HTTP, console, `__ready`, DPR.

## Limites conhecidos (scripts e exemplos da skill)

Observacoes do engenheiro apos testar os scripts. Nao sao bugs a corrigir no uso, e sim limites a saber antes de prometer algo.

| Limite | Efeito | O que fazer |
|---|---|---|
| **GIF tem alfa de 1 bit** (`dither_anim.py -o x.gif`) | bordas sem suavizacao; pode aparecer halo sobre fundo diferente do esperado; sem sombras translucidas | para dither e pixel-art e ok (borda nitida combina); para borda suave use **WebM VP9** (alfa) ou **PNG-seq**; ou gere com `--bg` da cor do destino |
| **Quadros identicos sao fundidos no GIF** | a quantidade de quadros no arquivo pode ser menor que `fps * duration`; o `--hold` nao incha o arquivo | nada a fazer; ao contar quadros para conferencia, conte duracoes e nao entradas |
| **MP4 (H.264) achata o alfa** | fundo transparente vira preto ou `--bg` | passe `--bg "#hex"` igual ao fundo da pagina ou use WebM |
| **Alfa em WebM** | suportado em Chromium e Firefox; Safari: verificar | manter GIF/PNG como fallback |
| **WebM/MP4 exigem `ffmpeg` no PATH** | sem ele o script avisa e segue so com GIF/PNG-seq | instalar fora da skill (nao instalamos nada); ou usar PNG-seq |
| **Serrilhado na borda do halftone a 45 graus na esfera** (`examples/halftone-3d.html`) | pontos cortados pela silhueta formam degraus | `aa` maior, celula menor, ou desenhar um anel/contorno liso por cima; em arte final, renderize em alta resolucao e reduza |
| **Motion via CDN nao foi exercitado** | `motion-helpers.js` carrega `motion@12.23.12` do jsDelivr; os exemplos desligam o CDN (`window.DITHER_MOTION_CDN = false`) e usam o fallback rAF, entao o caminho da lib real nao foi testado aqui | trate o CDN como opcional, teste com `?cdn=1` (quando o exemplo suporta) e confirme o `import` no seu ambiente; sempre com fallback |
| **`file://` nao funciona** | texturas WebGL, mascaras CSS (`mask-image` de arquivo), fetch e ESM sao bloqueados | servir por HTTP (`scripts/verify/serve.mjs`); a unica excecao e abrir um GIF/PNG em `<img>` |
| **SwiftShader nao mede desempenho** | fps no headless nao representa GPU real | medir em dispositivo real; usar o headless so para provar que renderiza |
| **Difusao de erro em Python puro e lenta** | `floyd`/`atkinson` com `--cell 1` em imagem grande leva segundos | usar `--cell >= 2` ou `--pixel-grid` |
| **`--cell` e ignorado com `--pixel-grid`** para Bayer/Floyd/Atkinson | a celula passa a ser o pixel logico | escolha a grade pelo `--pixel-grid N` |
