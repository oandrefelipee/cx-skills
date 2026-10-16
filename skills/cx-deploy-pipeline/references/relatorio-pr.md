# Relatório HTML do PR

Todo PR ganha um relatório: uma página só, autocontida (imagens embutidas, sem rede), tema claro e escuro, para o humano revisar sem abrir dez abas. O agente gera antes do merge ([04](../workflows/04-mesclar-com-seguranca.md)) e atualiza depois do deploy ([06](../workflows/06-verificar-pos-deploy.md)).

```text
node scripts/relatorio-pr.mjs relatorio.json [--saida arq.html | --dir pasta] [--sem-indice]
```

Destino padrão: `relatorios.dir` do adaptador, senão `docs/relatorios/pr/`, com o nome `<numero>-<slug>.html` e um `index.html` que lista todos. Exemplo pronto (v2, com todos os blocos): [`../assets/exemplo-relatorio.html`](../assets/exemplo-relatorio.html), gerado de [`exemplo-relatorio.json`](../assets/exemplo-relatorio.json).

## Formato do JSON

Tudo é opcional, menos `pr.numero`: seção sem dado não aparece. O mesmo JSON gera sempre o mesmo HTML (sem data atual nem aleatório), então o relatório é revisável em diff.

| Campo | Tipo | Conteúdo |
|---|---|---|
| `titulo` | texto | o que a pessoa ganhou, não o nome técnico |
| `pr` | objeto | `numero`, `url`, `branch`, `base`, `autor` |
| `data`, `estado`, `estadoTexto` | texto | `estado` vira o selo principal (`pass`, `pending`, `fail`…); `estadoTexto` troca o texto dele ("Em produção") |
| `selos[]` | objetos | `tom` (`ok`, `aviso`, `erro`, `neutro`) e `texto`, ao lado do selo principal |
| `links[]` | objetos | `texto`, `url` (história, spec, wireframe, ticket) |
| `resumo` | texto | 1 ou 2 frases |
| `kpis[]` | objetos | `rotulo`, `valor`, `nota`, `tom`; vazio = derivados de checks, DORA, arquivos e duração do CI |
| `porque` | texto | **uma** frase: o problema e o que fica possível (modelo da `visual-pr`) |
| `atencao[]` | textos | 1 a 3 pontos para o revisor: migração, compatibilidade, omissão deliberada |
| `linhaDoTempo[]` | objetos | `etapa`, `quando`, `nota`, `estado` (`feito`, `agora`, `futuro`) |
| `oQueMudou[]` | textos | uma linha por mudança visível |
| `antesDepois[]` | objetos | `titulo`, `antes` e `depois`, cada um com `ascii`, `imagem` (caminho relativo ao JSON; é embutida) ou `texto`. Sem `antes` = **Prévia**. Com imagem dos dois lados ganha o modo **Deslizante**; mais de um par vira abas. Gere com `antes-e-depois.mjs --relatorio` ([10](../workflows/10-antes-e-depois.md)) |
| `esboco[]` | objetos | `titulo`, `nota`, `lang` (`diff`, `text`, `sql`…), `codigo`: a forma da mudança (contrato, banco, fluxo, componentes, árvore de arquivos), no estilo `/show-me`. `diff` colore `+` e `-` |
| `checks[]` | objetos | `nome`, `estado`, `provedor`, `link`, `duracaoSeg`, `nota`, `flaky` (`true` ou texto com rerun, dono e prazo); dá para colar o `checks` do `ci-status.mjs --json`. Check pulado não conta contra |
| `deploy[]` | objetos | `ambiente`, `sha`, `versao`, `migracao`, `health`, `p95`, `latenciaMs[]` (vira sparkline), `quando`, `link` |
| `riscos[]` | objetos | `nivel` (`alto`, `medio`, `baixo`), `texto`, `mitigacao` |
| `rollback` | texto | o plano de volta em uma frase |
| `arquivos` | objeto | `total`, `mais`, `menos` e `lista[]` (`caminho`, `mais`, `menos`), recolhida |
| `dora` | objeto | `periodo`, `frequenciaDeploy`, `leadTime`, `taxaFalha`, `recuperacao` ([DORA leve](padroes/dora-leve.md)), no rodapé |

## Como a página se organiza

```text
topo     PR · branch · autor · data              [Tema] [Exportar PDF]
         Título (serif) · resumo · selos · links
         KPIs  ─ checks · tempo até produção · arquivos · tempo de CI
índice   Por quê → Linha do tempo → O que mudou → Antes → depois → Esboço
         → Checks → Deploy → Riscos e plano de volta → Arquivos
rodapé   DORA leve · gerado por cx-deploy-pipeline
```

Índice lateral fixo no desktop e barra rolável no celular; tema claro e escuro (segue o sistema, com botão); impressão sem os controles. Inspiração: estrutura do corpo da [`visual-pr`](https://github.com/humanlayer/skills) (humanlayer) e desenho da [`visual-explainer`](https://github.com/nicobailon/visual-explainer) (nicobailon).

## Regras

- Nada de segredo, dado pessoal real ou log cru: o que vier de log passa por `redigir.mjs`.
- Capturas: as mesmas do corpo do PR, geradas pelo [10](../workflows/10-antes-e-depois.md) (`antes-e-depois.mjs --relatorio`), nas larguras e temas do adaptador; ASCII quando não houver tela.
- O link do relatório vai no corpo do PR ou num comentário. Commit do HTML no próprio PR.
