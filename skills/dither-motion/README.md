# dither-motion

Skill geral para criar e animar estilos em dither (Bayer, Floyd-Steinberg, Atkinson, halftone, hachura, pixel-art, grao) em WebGL/shader, Canvas 2D, SVG/CSS e imagem por script. Parados ou animados.

## Instalar

Copie a pasta inteira para o diretorio de skills do Claude Code:

```bash
mkdir -p ~/.claude/skills
cp -R skills/dither-motion ~/.claude/skills/dither-motion  # ou: npx skills add oandrefelipee/cx-skills --skill dither-motion
```

Para uso so num projeto: copie para `<projeto>/.claude/skills/dither-motion/`. Reinicie a sessao para a skill ser listada.

## Conteudo

| Pasta | O que tem |
|---|---|
| `SKILL.md` | Principio, arvore de decisao por tipo de pedido, checklist de qualidade, verificacao |
| `references/` | 13 referencias (algoritmos, WebGL, Canvas 2D, SVG/CSS, Python, animacao, paletas, bibliotecas, desempenho/a11y, verificacao, armadilhas, estilos, aprendizados) |
| `workflows/` | 11 mini workflows (imagem, fundo, transicao, paleta, ilustracao, pixel-art, rabiscos, halftone, verificacao, animacao em arquivo, hero completo) |
| `scripts/python/` | `dither_image.py`, `dither_anim.py`, `procedural_sticker.py`, `doodle_gen.py`, `palette_tools.py`, `make_sheet.py` (indice em `scripts/README.md`) |
| `scripts/js/` | `dither-gl.js`, `dither-canvas.js`, `svg-tone-filter.js`, `doodle-mask.js`, `motion-helpers.js` |
| `scripts/verify/` | `serve.mjs`, `shots.cjs`, `check-layout.cjs` |
| `examples/` | 9 HTMLs autonomos (sirva por HTTP) + `README.md` |
| `assets/` | imagens e rabiscos de exemplo |
| `evals/evals.json` | 12 pedidos de teste com expectativas |

## Requisitos (nada e instalado pela skill)
- Python 3 com `pillow` e `numpy` (scripts Python).
- Node e Playwright com Chromium em cache (scripts de verificacao; o `_browser.cjs` acha o headless shell sem `playwright install`; defina `PLAYWRIGHT_PATH` se necessario).
- Navegador moderno (WebGL1/2 para os exemplos de shader).

## Teste rapido
```bash
cd ~/.claude/skills/dither-motion
node scripts/verify/serve.mjs . 8790 &        # guarde o PID
# abra http://127.0.0.1:8790/examples/bg-animado-canvas.html
python3 scripts/python/dither_image.py assets/sticker-moedas.png /tmp/teste.png --algo bayer8 --preset pixel-azul --cell 4
```

## Evals
`evals/evals.json` segue o formato do skill-creator (`skill_name`, `evals[]` com `id`, `prompt`, `expected_output`, `files`; `assertions` e `name` sao extras). Use-os para testar o disparo e a qualidade com e sem a skill.

## Origem
Nascida de 3 rodadas de trabalho (modal da primeira recarga, 2026) mais referencias de Higgsfield, Craft e Dither Kit. Os trechos marcados "caso real" sao exemplos, nao regras do dominio.
