# Catálogo de blocos

Blocos genéricos para montar uma tela orientada a ação. Planeje com eles no passo 00 (`../workflows/00-planejar-blocos.md`) e mapeie cada um para o componente da casa pelo adaptador do projeto.

O **id** de cada bloco é o nome usado em `data-bloco="<id>"` (para `scripts/contar-palavras.mjs`) e em `"tipo"` (para `scripts/wireframe-ascii.mjs`).

**Orçamento de palavras** conta só o texto fixo visível do bloco (sem dados dinâmicos, como nomes e números). Teto geral: 14 palavras por bloco fixo, 1 frase em dica e descrição, botão com até 3 palavras começando por verbo. O adaptador do projeto pode apertar ou afrouxar.

| id | Bloco | Orçamento |
|---|---|---|
| `cabecalho` | Cabeçalho com ação | 4 no título + 3 no botão |
| `linha-acao` | Linha com estado e ação | 6 por linha |
| `kpi` | KPI com variação | 3 no rótulo |
| `vazio` | Vazio com ação | 12 |
| `checklist` | Checklist de passos | 4 por passo |
| `destaque` | Cartão de destaque (CTA) | 14 |
| `formulario` | Formulário curto | 3 por rótulo, 8 por dica |
| `bloqueio` | Aviso de bloqueio | 12 |
| `sheet` | Sheet de detalhe | 4 no título, 14 por seção |
| `registros-copiar` | Lista de registros com copiar | 3 por rótulo |
| `lista-filtros` | Lista com filtros e ações em lote | 2 por filtro |
| `confirmacao` | Confirmação destrutiva | 14 + 3 no botão |

---

## `cabecalho`: cabeçalho com ação

- **Quando usar:** topo de toda tela. Diz onde a pessoa está e qual é a ação principal.
- **Anatomia:** título (substantivo), seletor de visão logo abaixo quando houver, ação primária à direita, ações extras em `[⋯]`.
- **Orçamento:** título até 4 palavras; botão até 3. Descrição opcional, 1 frase, igual em todas as visões.
- **Anti-padrões:** título que repete a navegação ("Página de configurações das fontes"); duas primárias; descrição que muda de altura ao trocar de visão; eyebrow ou kicker acima do título.

```
| Fontes                     [■ Nova fonte] [⋯] |
| [Ativas] [Pausadas]                           |
```

## `linha-acao`: linha com estado e ação

- **Quando usar:** cada item de uma lista que a pessoa opera um a um.
- **Anatomia:** identificador, selo de estado, 1 metadado que muda a decisão, ação frequente visível, resto em `[⋯]`.
- **Orçamento:** 6 palavras de texto fixo por linha (o selo conta).
- **Anti-padrões:** estado em frase ("Esta fonte está ativa e recebendo"); três botões por linha; metadado que ninguém usa para decidir.

```
| <nome>     (● Ativa)  há 2 min   [ Testar ] [⋯] |
```

## `kpi`: KPI com variação

- **Quando usar:** número que a pessoa acompanha para decidir se age. Até 4 por fileira.
- **Anatomia:** rótulo curto, valor, variação com sinal e período, ⓘ com a fórmula.
- **Orçamento:** rótulo até 3 palavras; período até 2 ("7 dias").
- **Anti-padrões:** número sem comparação; fórmula escrita no cartão; o template "número gigante + rótulo pequeno + 3 estatísticas + destaque" como estrutura da página; sparkline decorativa.

```
| Entregues 7d  ⓘ  |
| 912   ▲ +8%      |
```

## `vazio`: vazio com ação

- **Quando usar:** lista ou área que pode não ter dados.
- **Anatomia:** ícone do mundo do produto, 1 linha do que vai aparecer, 1 botão com a primeira ação.
- **Orçamento:** 12 palavras no total, botão incluído.
- **Anti-padrões:** "Nenhum dado encontrado" sem ação; ilustração genérica; parágrafo de onboarding; a mesma primária no cabeçalho e no vazio ao mesmo tempo.

```
|        {ícone do domínio}         |
|   As fontes conectadas aparecem aqui. |
|        [■ Conectar fonte]         |
```

## `checklist`: checklist de passos

- **Quando usar:** configuração ou primeiro uso com 2 a 5 passos em ordem.
- **Anatomia:** passo com estado (✓ ◐ ○), título curto, a ação do passo atual dentro dele, passos concluídos recolhidos.
- **Orçamento:** 4 palavras por título de passo; 1 frase opcional só no passo atual.
- **Anti-padrões:** mais de 5 passos; passo que a pessoa marca à mão quando o sistema sabe; explicação de todos os passos aberta ao mesmo tempo.

```
| ✓ 1 Nome                          |
| ◐ 2 Conectar          [■ Testar]  |
| ○ 3 Publicar                      |
```

## `destaque`: cartão de destaque (CTA)

- **Quando usar:** uma oportunidade ou próximo passo que não é a tarefa da tela, mas vale o espaço (ativar recurso, terminar configuração).
- **Anatomia:** título, 1 frase de benefício, 1 botão, dispensar `[x]`. Visual aprovado (gradiente, cor) entra só se estiver no wireframe.
- **Orçamento:** 14 palavras no total.
- **Anti-padrões:** mais de um destaque por tela; brilho ou sombra decorativa; ícone ✨ para "IA"; destaque que não se pode dispensar.

```
| ▒▒ Integrar com agente   [x] ▒▒▒▒▒▒ |
| ▒▒ Gere o prompt pronto.         ▒▒ |
| ▒▒ [■ Gerar prompt]              ▒▒ |
```

## `formulario`: formulário curto

- **Quando usar:** até 5 campos visíveis. Mais que isso: passos ou "Mais opções".
- **Anatomia:** rótulo acima do campo, padrão inteligente preenchido, dica só onde há erro provável, botão de envio com verbo + objeto.
- **Orçamento:** rótulo até 3 palavras; dica até 8; botão até 3.
- **Anti-padrões:** placeholder no lugar do rótulo; dica em todos os campos; "Enviar" genérico; validação só no envio.

```
| Nome        [__________________]  |
| Webhook URL [__________________] ⓘ |
| [■ Salvar fonte]  [ Cancelar ]    |
```

## `bloqueio`: aviso de bloqueio

- **Quando usar:** algo impede a ação principal (falta crédito, conexão caiu, permissão).
- **Anatomia:** o que está bloqueado, por quê em 1 frase, a ação que destrava. Fica perto da ação bloqueada, não num banner genérico.
- **Orçamento:** 12 palavras, botão incluído.
- **Anti-padrões:** mostrar zero no lugar de "indisponível"; tom de alarme; aviso sem ação; aviso que não some depois de resolvido.

```
| (● Sem conexão)  Reconecte para enviar.  [■ Reconectar] |
```

## `sheet`: sheet de detalhe

- **Quando usar:** detalhe de um item sem perder a lista. No celular, vira tela cheia.
- **Anatomia:** título com selo, seções curtas, ação primária no rodapé fixo, fechar.
- **Orçamento:** título até 4 palavras; 14 por seção de texto fixo.
- **Anti-padrões:** sheet dentro de sheet; formulário longo; rolagem horizontal no 390.

```
| <item>               (● Pronta)   |
| Detalhes                        ⓘ |
| ···                               |
| [■ Publicar]          [ Fechar ]  |
```

## `registros-copiar`: lista de registros com copiar

- **Quando usar:** valores técnicos que a pessoa leva para outro sistema (DNS, chaves, URLs, tokens).
- **Anatomia:** rótulo curto, valor em fonte de dados, botão copiar por valor, ⓘ com onde colar.
- **Orçamento:** 3 palavras por rótulo.
- **Anti-padrões:** valor cortado sem copiar; instrução de cópia em parágrafo; segredo reexibido.

```
| CNAME  <nome>   <valor>   {copiar} |
| TXT    <nome>   <valor>   {copiar} |
```

## `lista-filtros`: lista com filtros e ações em lote

- **Quando usar:** muitos registros e operação repetida.
- **Anatomia:** busca, até 3 filtros visíveis, barra de ações aparece ao selecionar.
- **Orçamento:** 2 palavras por filtro; ações em lote até 3 palavras.
- **Anti-padrões:** filtros que mudam a posição do seletor; ações em lote sempre visíveis; contador em frase.

```
| [Buscar_______] [▾ Estado] [▾ Período]        |
| 3 selecionados   [ Pausar ] [ Exportar ]      |
```

## `confirmacao`: confirmação destrutiva

- **Quando usar:** ação que não se desfaz.
- **Anatomia:** título com o objeto, 1 frase com a consequência, botão destrutivo que nomeia o objeto, cancelar.
- **Orçamento:** 14 palavras + botão até 3.
- **Anti-padrões:** "Tem certeza?"; botão "Confirmar"; modal para ação reversível (use desfazer).

```
| Excluir domínio?                  |
| Os links deixam de abrir.         |
| [■ Excluir domínio] [ Cancelar ]  |
```
