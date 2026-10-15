# Wireframe ASCII: convenção

Wireframe ASCII é rápido de escrever, cabe num PR, num chat e num diff, e obriga a decidir estrutura antes de estilo. Ele não substitui um protótipo visual quando o visual importa: serve para aprovar blocos, ordem, hierarquia e orçamento de texto.

## Símbolos

| Símbolo | Significa |
|---|---|
| `+----+` e `|` | Borda de tela, bloco ou cartão |
| `====` | Separador forte (topo de tela, barra fixa) |
| `[■ Ação]` | Botão primário (um por tela ou bloco) |
| `[ Ação ]` | Botão secundário |
| `[⋯]` | Menu de ações extras |
| `(● Estado)` | Selo de status; a cor vai entre colchetes se importar: `(● Ativa)[verde]` |
| `ⓘ` | Ajuda contextual (tooltip ou popover); o conteúdo vai numa nota abaixo do wireframe |
| `[____________]` | Campo de texto; rótulo antes: `Nome [________]` |
| `[▾ Opção]` | Seleção |
| `[x]` / `[ ]` | Caixa marcada / desmarcada |
| `✓` `○` `◐` | Passo concluído, pendente, em andamento |
| `▲ +12%` / `▼ -3%` | Variação de KPI com sinal |
| `{copiar}` | Botão de copiar ao lado de um valor técnico |
| `···` | Conteúdo repetido (mais linhas iguais) |
| `<…>` | Valor dinâmico: `<nome do pedido>` |
| `▒▒▒` | Área visual aprovada (gradiente, imagem, mapa); descreva numa nota |

Nada de emoji decorativo. Se a tela tem um ícone, escreva o nome dele entre chaves: `{ícone: caminhão}`.

## Larguras

- **390** (celular): 40 colunas, contando as bordas.
- **1280** (desktop): 96 colunas, contando as bordas. A barra lateral do produto pode ser omitida; escreva `(shell)` no topo se ela existir.

Desenhe as duas larguras sempre. O que é lado a lado no 1280 vira pilha no 390, e a ação primária do 390 aparece sem rolar.

## Notas

Abaixo de cada wireframe, numere as notas: conteúdo de cada ⓘ, comportamento (o que abre, o que muda), e cada área `▒▒▒` aprovada (cor, gradiente, imagem). As notas fazem parte da aprovação.

## Exemplo 1: lista com KPIs (1280)

```
+==============================================================================================+
| Pedidos                                                                      [■ Importar CSV] |
| [Todos] [Exceções] [Pausados]                                                                 |
+----------------------------------------------------------------------------------------------+
| +----------------------+  +----------------------+  +----------------------+                 |
| | Em trânsito        ⓘ |  | Atrasados            |  | Entregues 7d         |                 |
| | 1.284     ▲ +12%     |  | 37        ▼ -3%      |  | 912       ▲ +8%      |                 |
| +----------------------+  +----------------------+  +----------------------+                 |
| [Buscar pedido_________]  [▾ Origem]  [▾ Período]                                             |
| +------------------------------------------------------------------------------------------+ |
| | <código>   <cliente>          (● Em trânsito)      Etapa 3 de 5      [ Ver ]       [⋯]  | |
| | <código>   <cliente>          (● Atrasado)[âmbar]  Etapa 2 de 5      [ Ver ]       [⋯]  | |
| | ···                                                                                      | |
| +------------------------------------------------------------------------------------------+ |
+----------------------------------------------------------------------------------------------+
1. ⓘ Em trânsito: pedidos enviados e ainda não entregues.
```

## Exemplo 1: lista com KPIs (390)

```
+======================================+
| Pedidos              [■ Importar]    |
| [Todos] [Exceções] [Pausados]        |
+--------------------------------------+
| Em trânsito ⓘ   1.284   ▲ +12%       |
| Atrasados          37   ▼ -3%        |
| [Buscar pedido_____________] [▾]     |
| +----------------------------------+ |
| | <código>        (● Em trânsito)  | |
| | <cliente> · Etapa 3 de 5     [⋯] | |
| +----------------------------------+ |
| ···                                  |
+--------------------------------------+
```

## Exemplo 2: configuração em passos (390)

```
+======================================+
| Nova fonte                           |
+--------------------------------------+
| ✓ 1 Nome                             |
| ◐ 2 Conectar                       ⓘ |
|   URL  [https://<…>________] {copiar}|
|   Token [••••••••••••] {copiar}      |
|   [■ Testar conexão]                 |
| ○ 3 Publicar                         |
+--------------------------------------+
1. ⓘ Conectar: cole a URL no checkout; o token vai no cabeçalho.
```

## Exemplo 3: vazio e sheet de detalhe (1280)

```
+==============================================================================================+
| Domínios                                                                     [■ Adicionar]   |
+----------------------------------------------------------------------------------------------+
|                                                                                              |
|                         {ícone: globo}                                                       |
|                         Nenhum domínio ainda                                                 |
|                         Os domínios conectados aparecem aqui.                                |
|                         [■ Adicionar domínio]                                                |
|                                                                                              |
+----------------------------------------------------------------------------------------------+

Ao clicar numa linha (estado com dados), abre o sheet à direita:
                                                         +-----------------------------------+
                                                         | <domínio>        (● Verificando)  |
                                                         | Registros DNS                   ⓘ |
                                                         | CNAME  <nome>  <valor>  {copiar}  |
                                                         | TXT    <nome>  <valor>  {copiar}  |
                                                         | [■ Verificar agora]  [ Fechar ]   |
                                                         +-----------------------------------+
1. Vazio: no cabeçalho e no vazio há a mesma ação; no vazio, o cabeçalho esconde o botão (uma primária).
```

## Comparar a captura com o wireframe aprovado

Faça isto no passo 05, para cada largura e tema:

1. Abra lado a lado o wireframe aprovado (ou o protótipo HTML aprovado, servido por HTTP) e a captura.
2. Confira bloco por bloco, de cima para baixo: o bloco existe, na mesma ordem, com o mesmo componente e a mesma hierarquia.
3. Confira as áreas `▒▒▒` e as notas: gradiente, cor de selo, imagem, ícone. Se a captura perdeu algo aprovado, é regressão, mesmo que o texto tenha melhorado.
4. Confira o que a captura acrescentou: brilho, sombra, ícone, borda, texto. Acréscimo não aprovado sai ou volta ao dono como proposta.
5. Rode `scripts/checar-capturas.mjs` para garantir que nenhuma captura da matriz está velha ou faltando.
6. Registre a comparação numa tabela: bloco · wireframe · captura · veredito.
