# Verificacao

Conteudo: 1 Regra de ouro, 2 Servir por HTTP, 3 Chromium headless e WebGL, 4 Matriz de tamanhos, 5 O que checar por script, 6 Convencoes da pagina, 7 Olhar os prints, 8 Estados temporais (transicoes), 9 Checagens do shader, 10 Fluxo recomendado.

Scripts: `scripts/verify/serve.mjs`, `scripts/verify/shots.cjs`, `scripts/verify/check-layout.cjs`. Origem: `rodada4/tools/verify5m.cjs` e `verify4.cjs`. Confirme variaveis e flags com `--help`/cabecalho do arquivo.

## 1. Regra de ouro

Nao diga "funciona" sem ter **aberto e descrito** os prints. Verificar visual e uma etapa de trabalho: capture, olhe, ajuste, capture de novo. Quando a skill produz varias versoes, monte uma prancha de contato e olhe todas juntas.

## 2. Servir por HTTP

- `file://` **quebra WebGL** (textura bloqueada por seguranca) e fetch/ESM.
- `python3 -m http.server` **derruba conexoes sob carga** (`ERR_CONNECTION_RESET`) quando varios verificadores rodam ao mesmo tempo. Use `node scripts/verify/serve.mjs <pasta> [porta]` (servidor estatico robusto) ou rode as verificacoes em serie. Nos builders de HTML, recarregue a imagem 2 vezes em caso de falha.
- Depois da edicao, recarregue com cache desligado (`page.goto` novo contexto).

## 3. Chromium headless e WebGL

```js
const browser = await chromium.launch({ args: [
  '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist',
  '--use-angle=swiftshader', '--enable-unsafe-swiftshader' ] });
```
- SwiftShader renderiza WebGL em CPU: serve para **provar que renderiza**, nao para medir desempenho (fps nao e representativo).
- O aviso "GPU stall due to ReadPixels" e inofensivo (filtre do log de erros).
- Se o Playwright pedir um Chromium ausente, aponte `executablePath` para o headless shell em cache, sem `playwright install`:
  `~/Library/Caches/ms-playwright/chromium_headless_shell-*/…/chrome-headless-shell` (o caso real listou o diretorio e escolheu o primeiro que existia).
- Emule celular: `newContext({ viewport: {width, height}, deviceScaleFactor: 1, hasTouch: true, isMobile: true })`.

## 4. Matriz de tamanhos

| Tipo | Tamanhos |
|---|---|
| Celular | 360x640, 375x667, 390x844, 412x915, 430x932 |
| Desktop | 1280x800 (e 1920x1080 se for hero) |
| Extras uteis | 768x1024 (tablet), 320x568 (minimo), paisagem 844x390 |

Rode cada passo/estado do fluxo em cada tamanho; a matriz final e uma tabela "ok/FALHA" por (arquivo, tamanho, passo).

## 5. O que checar por script (rodar dentro da pagina)

| Checagem | Como |
|---|---|
| Botao primario dentro da viewport | `r.left >= 0 && r.right <= vw && r.bottom <= vh` |
| Alvo clicavel nao coberto | `document.elementFromPoint(cx, cy)` e o proprio elemento (ou filho/pai) |
| Alvo >= 44 px de altura | `r.height >= 44` (>= 40 em links secundarios) |
| Sem rolagem horizontal | `document.documentElement.scrollWidth <= innerWidth + 1` |
| Fonte >= 12 px | `parseFloat(getComputedStyle(el).fontSize) >= 11.9` (>= 9 em selos/rotulos) |
| Texto coberto por objeto/chip | comparar retangulos (encolha o bbox do objeto em ~18% porque PNGs tem margem transparente) |
| Texto invade rodape / sob cabecalho | comparar `bottom` do texto com o `top` do botao e o `bottom` do cabecalho |
| Texto vaza do cartao/recibo | `r.right > cartao.right` ou `r.bottom > cartao.bottom` |
| Console sem erros | `page.on('console')` e `page.on('pageerror')`; ignore `ReadPixels` e `Failed to load resource` conhecido |
| Objetos com imagem | todo `.obj` tem `img` ou `canvas` |
| Erros de shader | `window.__shaderErrors === 0` |

`scripts/verify/check-layout.cjs` implementa as genericas (botao na viewport, rolagem horizontal, alvos >= 44, fonte < 12, texto coberto). Adapte seletores ao seu projeto.

## 6. Convencoes da pagina que facilitam a verificacao

- `window.__ready = true` quando tudo carregou (imagens, fontes, texturas). O verificador espera por isso (`page.waitForFunction(() => window.__ready === true)`) e acusa "NAO PRONTO" no timeout.
- Parametro de URL (`?step=3`, `?estado=final`) para abrir direto num estado, so em dev.
- Contador de erros de shader em `window.__shaderErrors`.
- Atributos `data-*` nos elementos (`data-o`, `data-step`) para seletores estaveis.
- Espere o tempo da entrada antes do print (passo 1: ~2.8 s; demais: ~1.2 s no caso real).

## 7. Olhar os prints

1. Abra cada PNG com a ferramenta de leitura de imagem. Descreva: o que esta onde, o que esta cortado, o que cobre o que.
2. Cheque o **dither de perto**: recorte e amplie 400% um trecho (PIL `crop().resize(NEAREST)`). A celula tem o tamanho esperado? Ha meia celula nas bordas? Franja escura (premultiplicado)? Tons intermediarios fora da rampa (antialias)?
3. Compare variacoes numa **prancha de contato** (`scripts/python/make_sheet.py`) sobre azul, branco e escuro.
4. Compare com a referencia visual (print do estilo que o usuario gosta).
5. Verifique no tema claro e no escuro se o projeto os tem.

## 8. Estados temporais (transicoes, entradas)

Print "no meio da transicao" por temporizador **nao funciona** (a transicao acaba antes, ou o headless ritma diferente). Opcoes:
- **Forcar o estado**: exponha uma funcao de debug (`window.__setReveal(.5)`, `window.__setT(.5)`) e chame antes do print.
- **Trace de rAF**: injete um observador que registre `reveal`/`t`/`px` a cada quadro e confira que sobe de 0 a 1 de forma monotona.
- **Congele o relogio** do script (substitua `performance.now`) e avance manualmente.
- Para `prefers-reduced-motion`: `page.emulateMedia({ reducedMotion: 'reduce' })` e verifique que ha um quadro estatico e nenhum rAF rodando.

## 9. Checagens do shader

- Compila sem erro (`getShaderInfoLog`).
- Contagem de cores: rampa de 4 tons => ~4 cores opacas distintas no `readPixels` (4 sem grao e sem alfa tramado; mais com antialias de borda).
- A celula na tela e a esperada: leia um trecho do print e meca a largura de um bloco uniforme.
- Perda de contexto: dispare `WEBGL_lose_context.loseContext()` e confira que o fallback aparece.

## 10. Fluxo recomendado

1. Servir (`serve.mjs`) -> 2. `shots.cjs` (matriz) -> 3. `check-layout.cjs` -> 4. abrir/descrever os prints -> 5. corrigir -> 6. repetir ate zerar as falhas -> 7. relatorio curto: o que passou, o que ficou duvidoso.
Rode as verificacoes **em serie** se o servidor for `python -m http.server`.
