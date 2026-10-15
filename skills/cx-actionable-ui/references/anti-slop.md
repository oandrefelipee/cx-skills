# Anti-slop

"Slop" é o visual e o texto que um modelo produz quando ninguém decidiu: brilho, sombra, ícone de faísca, frase que repete o título. Cada regra abaixo tem o porquê, para você aplicar o espírito e não só a letra. Use no passo 03 (antes de mexer) e no 05 (antes de entregar).

## Regras

1. **Sem brilho e sem sombra decorativa.**
   Por quê: brilho radial, halo colorido e sombra larga não carregam informação; disputam atenção com a ação e envelhecem a tela. Sombra só para elevação real (menu, sheet, popover), com deslocamento e desfoque suaves, e declarada uma vez: borda ou sombra, não as duas.

2. **Sem ✨ (sparkles) para "IA".**
   Por quê: virou o clichê de "feito por IA" e não diz o que o recurso faz. O ícone vem do mundo do produto: o objeto que a IA produz ou a ação que ela executa (um documento, um terminal, um envio). Emoji e glifo Unicode não substituem o sistema de ícones da casa.

3. **Gradiente só aprovado e com função.**
   Por quê: gradiente sem função é enfeite; com função (marcar um destaque único, indicar uma área de marca) é decisão de design e, portanto, do dono. Nunca gradiente em texto. Nunca acrescente nem remova gradiente fora do que o wireframe aprovado mostra.

4. **Uma ação primária.**
   Por quê: duas primárias dividem a decisão ao meio e a pessoa hesita. O resto é secundário, link ou `[⋯]`.

5. **Nada de texto que repete o título.**
   Por quê: "Fontes · Gerencie suas fontes" gasta uma linha para dizer o que o título já disse. Se a descrição não acrescenta uma decisão, ela sai.

6. **Paralelismo nas listas.**
   Por quê: itens da mesma lista com a mesma forma (todos verbo, ou todos substantivo; mesmo tamanho) são lidos de relance. Forma misturada obriga a reler cada item.

7. **Selo em vez de frase.**
   Por quê: "Esta conexão está ativa" é lida; `(● Ativa)` é vista. Estado é selo de 1 a 2 palavras, com tom fixo por status.

8. **Fidelidade ao wireframe aprovado.**
   Por quê: a aprovação do dono vale para o visual inteiro, não só para os textos. Gradiente, selo sólido, cor, ícone e hierarquia aprovados são requisito. "Menos texto" corta texto, nunca remove visual aprovado; "polir" não acrescenta brilho, sombra nem ícone. Qualquer mudança visual fora do aprovado volta ao dono como proposta, com antes e depois.

9. **Capturas sempre atuais.**
   Por quê: capturas velhas na pasta de evidências provam uma tela que não existe mais. Depois de mexer em UI, refaça a matriz inteira (larguras × temas) e rode `scripts/checar-capturas.mjs`.

## Piso de acabamento (resumo)

Resumo do "craft floor" da skill [impeccable](https://github.com/pbakaus/impeccable) (crédito: Paul Bakaus). Com a impeccable instalada, leia o original em `reference/craft-floor.md`.

- [ ] Contraste: texto ≥ 4,5:1; texto grande ≥ 3:1; texto secundário em fundo colorido tingido do próprio tom, nunca cinza.
- [ ] Profundidade: sombra com deslocamento e desfoque suave; halo colorido sem deslocamento é decoração.
- [ ] Espaçamento: grupos apertados, separação generosa, mais espaço acima do título que abaixo.
- [ ] Tipografia: degraus de tamanho e peso óbvios; texto real em todas as larguras, sem estouro.
- [ ] Movimento: um momento pensado, não efeitos espalhados.
- [ ] Estados: hover, desabilitado, carregando, erro, vazio, foco por teclado.
- [ ] Superfícies do navegador: seleção, cursor, barra de rolagem, anel de foco e números tabulares tematizados.
- [ ] Texto: a língua do produto; controle nomeia a ação; erro nomeia o problema e a saída.
- [ ] Recusar por padrão: cartões iguais de ícone + título + texto como estrutura; eyebrow acima do título; numeração 01/02/03 sem sentido; vidro e desfoque decorativos; borda lateral colorida grossa em cartão ou alerta; emoji no lugar de ícone.


## Paralelismo de verdade

Itens de uma lista têm a mesma forma gramatical **e o mesmo tipo de coisa**. Parecer curto e alinhado não basta.

- Errado: "Investiga seu checkout · Envia todo pedido pago · Token só no servidor". Os dois primeiros são ações do agente; o terceiro é uma garantia de segurança.
- Certo: "Acha onde nasce o pedido · Envia todo pedido pago · Guarda o token no servidor" (três ações), ou separar a garantia: tópicos com as ações e a garantia num selo ou ⓘ.

Teste rápido: comece cada item com "Ele…" ou "Você…". Se um item não fecha a frase, ele é de outro tipo.
