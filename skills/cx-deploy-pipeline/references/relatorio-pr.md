# Relatório HTML do PR

Todo PR ganha um relatório: uma página só, autocontida (imagens embutidas, sem rede), tema claro e escuro, para o humano revisar sem abrir dez abas. O agente gera antes do merge ([04](../workflows/04-mesclar-com-seguranca.md)) e atualiza depois do deploy ([06](../workflows/06-verificar-pos-deploy.md)).

```text
node scripts/relatorio-pr.mjs relatorio.json [--saida arq.html | --dir pasta] [--sem-indice]
```

Destino padrão: `relatorios.dir` do adaptador, senão `docs/relatorios/pr/`, com o nome `<numero>-<slug>.html` e um `index.html` que lista todos. Exemplo pronto: [`../assets/exemplo-relatorio.html`](../assets/exemplo-relatorio.html), gerado de [`exemplo-relatorio.json`](../assets/exemplo-relatorio.json).

## Formato do JSON

| Campo | Tipo | Conteúdo |
|---|---|---|
| `titulo` | texto | o que a pessoa ganhou, não o nome técnico |
| `pr` | objeto | `numero`, `url`, `branch`, `base`, `autor` |
| `data`, `estado` | texto | `estado` vira selo (`pass`, `pending`, `fail`…) |
| `resumo` | texto | 1 ou 2 frases |
| `oQueMudou[]` | textos | uma linha por mudança visível |
| `antesDepois[]` | objetos | `titulo`, `antes` e `depois`, cada um com `ascii`, `imagem` (caminho relativo ao JSON; é embutida) ou `texto` |
| `checks[]` | objetos | `nome`, `estado`, `provedor`, `link` (dá para colar o `checks` do `ci-status.mjs --json`) |
| `deploy[]` | objetos | `ambiente`, `sha`, `health`, `quando`, `link` |
| `dora` | objeto | `periodo`, `frequenciaDeploy`, `leadTime`, `taxaFalha`, `recuperacao` ([DORA leve](padroes/dora-leve.md)) |
| `riscos[]` | objetos | `nivel` (`alto`, `medio`, `baixo`), `texto`, `mitigacao` |
| `rollback` | texto | o plano de volta em uma frase |

## Regras

- Nada de segredo, dado pessoal real ou log cru: o que vier de log passa por `redigir.mjs`.
- Capturas: as do PR, nas larguras e temas que o projeto exige; ASCII quando não houver tela.
- O link do relatório vai no corpo do PR ou num comentário. Commit do HTML no próprio PR.
