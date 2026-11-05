# Modelo de adaptador do projeto (cx-dither-animacoes)

Copie para `.cx/dither/adaptador.md` (ou `docs/design/dither-animacoes/README.md`) e preencha. Mantenha curto: o que não muda de projeto para projeto já está na skill.

```md
# Adaptador de dither e animações: <nome do projeto>

## Cor e tema
- Token de destaque: `--accent` (ou o nome local). Fundo: `--background`. Texto: `--foreground`.
- Como o tema muda: `data-theme="dark"` na raiz / classe `.dark` / `prefers-color-scheme`.
- Tokens extras por categoria (se houver): `--accent-2..4`.
- Arquivo dos tokens: `<caminho>`. Regra do projeto: sem hex fixo em componentes.

## Motor e componentes locais (reaproveitar antes de escrever)
| O quê | Onde | Observação |
|---|---|---|
| Canvas/shader de cena | `<pacote ou caminho>` | |
| Matrizes Bayer, kit de gráfico | `<caminho>` | licença e procedência |
| Fonte pixel, cursor | `<caminho>` | |

## Peça-modelo de qualidade
`<caminho da peça real, no produto, com prova>` e o que a torna o modelo (encaixe, celular, token, movimento reduzido, capturas).

## Paletas aprovadas
Nome, cores (ligadas a tokens), onde se aplica.

## Gosto registrado (com data e citação curta)
- Gostou: ...
- Rejeitou: ...
- Pedidos que se repetem: densidade da trama, tamanho da célula, contraste, quantidade de movimento, copy, tipografia.

## Processo de trabalho
Como pede, escolhe e corrige (galeria numerada, escolha por ids, duplicar variantes, uma pergunta por vez, prova por captura) e o que o irritou.

## Armadilhas locais
Sintoma -> causa -> correção, só o que for deste projeto.

## Prova
Comando de captura, tamanhos, temas, onde ficam as imagens.
```
