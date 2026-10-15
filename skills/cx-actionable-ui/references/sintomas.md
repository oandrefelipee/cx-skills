# Sintomas → o que abrir

Como usar: ache o sintoma que mais parece com a tela, abra os itens na ordem indicada e pare quando o problema estiver resolvido. O primeiro item costuma bastar; os seguintes refinam. Para ver tudo de um tipo, use os índices: [princípios](principios/INDEX.md), [leis](leis/INDEX.md), [técnicas](tecnicas/INDEX.md).

## 1. Texto demais

A tela parece um documento: parágrafos, fórmulas por extenso, explicação fixa sob cada campo.

1. [Estado e ação antes de explicação](principios/estado-e-acao-antes-de-explicacao.md)
2. [Ajuda contextual](tecnicas/ajuda-contextual.md)
3. [Cortar não é esconder o que importa](principios/cortar-nao-e-esconder.md)
4. [Linguagem simples](tecnicas/linguagem-simples.md)

```text
Antes
+--------------------------------------+
| A integração está desligada porque a |
| chave expirou. Para voltar a enviar, |
| abra as configurações e gere outra.  |
+--------------------------------------+
Depois
+--------------------------------------+
| (● Chave expirada) [■ Renovar chave]ⓘ|
+--------------------------------------+
```

Meça antes e depois com `scripts/contar-palavras.mjs`.

## 2. Não sei qual é a ação

Vários botões do mesmo peso, ou a ação está no fim de um texto.

1. [Uma ação primária por tela ou bloco](principios/uma-acao-primaria.md)
2. [Hierarquia visual](tecnicas/hierarquia-visual.md)
3. [Verbos nos botões](tecnicas/verbos-nos-botoes.md)
4. [Efeito Von Restorff](leis/efeito-von-restorff.md)

```text
Antes:  [Salvar] [Enviar] [Exportar] [Duplicar] [Excluir]
Depois: [■ Enviar fatura]  [ Salvar ]  [⋯]
```

## 3. Estado confuso

Não dá para dizer em 2 segundos se está tudo bem; o estado só aparece em prosa ou muda de nome de tela para tela.

1. [Leitura de relance](tecnicas/leitura-de-relance.md)
2. [Selo de status](tecnicas/selo-de-status.md)
3. [Um termo por conceito](tecnicas/um-termo-por-conceito.md)
4. [Lei da similaridade](leis/lei-da-similaridade.md)

## 4. Muitas opções

Menu com 12 itens, barra de filtros que não cabe, formulário com tudo à vista.

1. [Lei de Hick](leis/lei-de-hick.md)
2. [Divulgação progressiva](tecnicas/divulgacao-progressiva.md)
3. [Padrões inteligentes](tecnicas/padroes-inteligentes.md)
4. [Miller na prática](tecnicas/miller-na-pratica.md)

## 5. A tela parece feita por IA

Gradiente em tudo, ✨, cartões iguais em grade, sombra decorativa, texto genérico ("Desbloqueie o poder de...").

1. [`anti-slop.md`](anti-slop.md)
2. [Dados primeiro, enfeite por último](principios/dados-primeiro.md)
3. [Razão dados–tinta](tecnicas/razao-dados-tinta.md)
4. [Voz constante, tom variável](principios/voz-constante-tom-variavel.md)

## 6. Vazio sem saída

Lista vazia com "Nenhum dado", "—" sozinho ou área em branco.

1. [Estado vazio acionável](tecnicas/estado-vazio-acionavel.md)
2. [Mostrar, não explicar](tecnicas/mostrar-nao-explicar.md)
3. [Checklist de configuração](tecnicas/checklist-de-configuracao.md), se for o primeiro uso

```text
Antes
+--------------------------------------+
| Nenhum dado                          |
+--------------------------------------+
Depois
+--------------------------------------+
| Nenhuma fatura ainda                 |
| As faturas emitidas aparecem aqui.   |
| [■ Emitir fatura]                    |
+--------------------------------------+
```

## 7. Números sem contexto

KPI solto, sem comparação, ou tabela com números desalinhados.

1. [Cartão de KPI com variação](tecnicas/kpi-com-variacao.md)
2. [Números alinhados e formatados](tecnicas/numeros-alinhados.md)
3. [Lei de Miller](leis/lei-de-miller.md)

```text
Antes:  Pedidos 1284
Depois: Pedidos 1.284  ▲ +12% vs. semana passada
```

## 8. Erro que culpa a pessoa

"Entrada inválida", "Ops!", erro só no envio, sem dizer o que fazer.

1. [Mensagens de erro úteis](tecnicas/mensagens-de-erro-uteis.md)
2. [Validação em linha](tecnicas/validacao-em-linha.md)
3. [Lei de Postel](leis/lei-de-postel.md)
4. [`tone-matrix.md`](tone-matrix.md), linha "Erro ou risco"

## 9. Layout que pula

O seletor muda de lugar ao trocar de aba, o conteúdo empurra a tela ao carregar.

1. [Esqueletos de carregamento](tecnicas/esqueletos-de-carregamento.md)
2. [Lei de Jakob](leis/lei-de-jakob.md)
3. [Limiar de Doherty](leis/limiar-de-doherty.md)
4. [`checklist.md`](checklist.md), item de layout estável

## 10. Não sei onde clicar

Link que não parece link, ícone sem rótulo, card inteiro clicável sem sinal.

1. [Sinalizadores](tecnicas/sinalizadores.md)
2. [Pista de informação](tecnicas/pista-de-informacao.md)
3. [Fitts na prática](tecnicas/fitts-na-pratica.md)

## 11. Confirmação demais

"Tem certeza?" a cada clique; a pessoa confirma sem ler.

1. [Desfazer em vez de confirmar](tecnicas/desfazer-em-vez-de-confirmar.md)
2. [Lei do esforço mínimo](leis/lei-do-esforco-minimo.md)
3. [Ações na linha e em lote](tecnicas/acoes-na-linha-e-em-lote.md)

## 12. Tudo parece um bloco só

Campos e seções sem respiro, bordas em tudo, grupos que não se distinguem.

1. [Agrupar com espaço](tecnicas/agrupar-com-espaco.md)
2. [Lei da proximidade](leis/lei-da-proximidade.md)
3. [Escaneabilidade](tecnicas/escaneabilidade.md)

## 13. Configuração que assusta

Formulário técnico enorme, a pessoa não sabe por onde começar nem quando terminou.

1. [Checklist de configuração](tecnicas/checklist-de-configuracao.md)
2. [Lei de Tesler](leis/lei-de-tesler.md)
3. [Divulgação em dois níveis](principios/divulgacao-em-dois-niveis.md)
4. [Regra do pico e do fim](leis/regra-do-pico-e-do-fim.md)

```text
✓ 1 Nome
◐ 2 Conectar        [■ Testar conexão]
○ 3 Publicar
```
