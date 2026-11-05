# Workflow de referências (pesquisar, mostrar, escolher por ids, duplicar variantes)

Como o autor trabalha: ele **vê opções e escolhe**; não aceita implementar sem alinhar e não aceita ver uma escolha anterior sobrescrita. Este fluxo foi usado do início ao fim no projeto de origem (painel de créditos, modal da primeira recarga, objetos e estilos) e é o que produz resultados "perfeitos" mais rápido.

## 1. O ciclo

1. **Entender o pedido e o contexto do produto** (o que o objeto/tela representa: dinheiro, escala, autonomia, privacidade, features; o que já existe; cores globais).
2. **Pesquisar referências** em paralelo (subagentes): Mobbin (telas, fluxos, seções) e web (sites, galerias, repositórios). Pesquisa de estilos: o que o concorrente faz, o que o autor já citou, o estilo da casa.
3. **Montar uma galeria numerada** em artefato (HTML), agrupada por família, cada item com id curto (`V1`..`Vn` vídeo/slider, `R1`..`Rn` referência, `M1`..`M12` modal, `H1`.., `N1`.., `D1`..), miniatura, nome do produto e **uma linha do que levar e do que evitar**.
4. **O autor escolhe por ids** ("M1, M2, M5, M11, M12"; "gostei do D2 a densidade, não as cores") e comenta o que gostou de cada um.
5. **Fundir o que ele curtiu** em uma ou mais **variantes** novas, **duplicando** (nunca sobrescrevendo) as anteriores. Registrar cada uma em `variantes.ts` (letra, nome, pasta, estado, uma frase).
6. **Provar** (capturas, claro/escuro, 2 larguras, console) e **mostrar só o link** do artefato, com o que ficou fraco dito sem rodeio.
7. **Perguntar o que for factual** (copy, regras de produto) em vez de inventar; **registrar a decisão** (memória/documento) e seguir.

## 2. Mobbin e web: como buscar

- **Mobbin** (conectores `mcp__Mobbin__*`, autenticação do usuário): `search_screens`, `search_flows`, `search_sections` com consultas de **padrão + contexto** ("modal de recarga de créditos com atalhos de valor", "upgrade modal 3D objects", "empty state ilustrado", "celebration success"). Salve achados em coleção (`create_collection`, `save_content`), guarde o **link da tela** (`https://mobbin.com/screens/<id>`) e o app. Procure famílias: *modal simples*, *com atalhos de valor*, *boas-vindas/upgrade com objeto herói*, *pós-pagamento*, *primeira compra no fluxo de entrada*.
- **Web** (Firecrawl/Tavily/Brave): galerias de dither/pixel (Dribbble, Awwwards, Godly, Siteinspire), repositórios (Dither Kit, shaders de gradiente), bibliotecas de efeito (Magic UI, Aceternity como **receita**, não dependência), páginas de produto com a estética pedida (Higgsfield, Craft, Duolingo, Perplexity, Kraken, Pitch, Mercury, Mixpanel, Visitors). Para cada um registre: o que levar (o objeto herói, a densidade, o relevo, a transição), o que evitar (formulário comprido, só texto).
- **Regras de licença:** referência é inspiração, não cópia; código de terceiros só com licença e procedência registrada (`NOTICE.md`); imagem de marca de terceiros não vai para o produto.
- Quando o assunto é **estilo de imagem**, vale testar 4 a 6 estilos (grão isométrico, papel de rastreio, vidro e grão, vetor com contorno, risografia, argila fosca) com **os mesmos 4 objetos** para o autor comparar maçã com maçã.

## 3. Galeria numerada (modelo)

Um artefato HTML com:
- cabeçalho com a pergunta ("escolha por ids; pode misturar");
- seções por família; cada cartão com `id`, imagem, **título**, **por que está aqui** e **o que levar / evitar**;
- filtro simples por família, clique para ampliar, teclado acessível;
- rodapé com "picks da rodada anterior" (rodadas numeradas, v1, v2, v3 no mesmo link).
Publique com a ferramenta de artefato (privado por padrão), passe o link e mantenha a **mesma URL** nas rodadas seguintes (nova versão, não novo artefato).

## 4. Duplicar variantes (nunca sobrescrever)

- Cada direção ganha **pasta e id próprios** (`d5`..`d17` no laboratório; letras E..P): `ModalD13.tsx`, `paletas.ts`, `temas.ts`…
- Um **catálogo** lista as opções (`catalogo.tsx`) e um **registro** (`variantes.ts`) guarda: letra, nome, pasta, estado (guardada, disponível, ativa, desativada), prévia (`assets/variantes/<letra>.webp`) e uma frase.
- Antes de alterar uma variante escolhida, **copie** (K2, M2, O2…): foi uma correção do autor ("tem que DUPLICAR, não reaproveitar") e originais restaurados.
- Estados: *guardada* (só laboratório), *disponível* (registrada na loja), *ativa/desativada* (chave no painel). Depois de escolher, **todas ficam salvas**; rebaixar nunca apaga código.
- Teste A/B: o painel do autor escolhe qual versão cada loja vê; manter ao menos uma ativa.

## 5. O que o autor já escolheu (para o gosto não se perder)

| Tema | Escolha / gosto |
|---|---|
| Botão Gerar Pix | dither detalhado Bayer 8×8, **Brasa** e **Placa**, feixe de luz fino em volta que acende. Último veredito: AJUSTAR (feixe mais fino e botão menor, 2026-11-04); sem aprovação explícita das duas |
| Cursor e fonte do valor | cursor **Feixe** (estilo Apple, pequeno) e fonte **Jersey 25** aprovados por imagem (2026-11-03 23:40); o nome exato é inferido, confirme na entrevista |
| Painel | **P4 Mix** (selo −N%, recibo enxuto, alternância e botão grande); trilha estilo Visitors; cor do valor pelas 4 cores dos pacotes; **sem neon** |
| Modal da 1ª recarga | passos (Entender, Escolher, Pagar, Pago); objetos estilo Craft sobre a tela, setas e frase manuscrita apontando valor, adesivos com recorte branco (D2 Papel e Fio), cores vibrantes e relevo 3D de pacote (D3 Cobalto Pixel), topbar animada de features |
| Paletas | azul da plataforma (`--accent`) + lima/rosa-choque, laranja/coral, menta/violeta, e **cores das notas** (ouro, turquesa, roxo) |
| Versões que gostou | E · Vivo, G · Dither, depois **L · Rota** (van acendendo ganhos numa estrada de pixel) e M/J (palco com leque e ticket) |
| Dinheiro como objeto | moedas, cédulas, pilha, maço, pirâmide de maços, cofre, impressora de dados |
| Rejeitou | estilo 3D neon das imagens de IA, "AI slop", Geist Pixel, kicker mono sobre título, gradiente em texto |

## 6. Perguntas que valem antes de começar uma nova peça

1. Animado ou parado? Onde vive (botão, fundo, cena, gráfico, celebração)?
2. Qual é a **cor global** (token) e há paletas alternativas?
3. Quais **objetos/mensagens** a peça precisa representar (features, dinheiro, escala, autonomia, privacidade)?
4. Quais **referências** ele já citou (nomes, links)? Há algo que ele **não** quer?
5. Quantas **variantes** mostrar (duas ou mais), e onde ficam salvas?
6. Que **prova** ele espera (capturas, protótipo rodando, link)?

## 7. Gramática de aprovação do autor

- "Gostei de: V1, V4, M2..." = escolha na galeria (por ids); pode vir com "não as cores" ou "só a topbar": aproveite a parte, não o todo.
- **Toque em cartão de decisão = escolha.** "Confirmo a Dn" = aprovação daquela decisão. Texto livre que responde a OUTRA pergunta ("A e B") não vale como resposta ao cartão aberto: confirme o alvo.
- Comentário fixado numa captura ("gostei desse", "botão feio") é feedback pontual: trate como entrada.
- Para fechar decisões: **uma pergunta por vez, com ASCII ou tabela antes** (2026-11-04). Mostre algo visível antes de perguntar.
- Subagentes só Haiku 5.5 high quando o limite semanal aperta (regra do projeto dele em 2026-11-05, não universal).
