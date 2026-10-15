# 06 · Acrescentar ao guia

O guia visual `references/guia.html` é uma referência viva: princípios, leis, técnicas e fontes saem de um único bloco JSON dentro do HTML. Acrescentar é copiar um objeto e preencher, sem mexer em layout ou script. Use este fluxo sempre que aprender uma técnica, lei ou livro novo.

## Antes de começar

1. Abra `references/guia.html` num editor e procure `<script type="application/json" id="dados">`.
2. Confirme que o item ainda não existe: busque pelo nome em inglês e em português. Se existir, melhore o objeto em vez de duplicar.

## Passos

1. **Escolha a categoria:** `Princípio` (regra de postura), `Lei` (efeito psicológico estabelecido, com nome) ou `Técnica` (ação prática numa tela).
2. **Copie um objeto de `itens`** da mesma categoria e mude os campos:

| Campo | Regra |
|---|---|
| `id` | Único e estável: `p-…` (princípio), `l-…` (lei), `t-NN` (técnica, próximo número livre) |
| `en`, `pt` | Nome nos dois idiomas |
| `definicao` | 1-2 frases, em palavras suas |
| `quando` | Onde usar |
| `exemplo` | Exemplo real, curto. Use crases para trechos de interface: \`Comprar créditos\` |
| `anti` | O erro mais comum |
| `ctx` | Um ou mais de: `Configuração`, `Operação`, `Momento humano`, `Erro ou risco` (alimenta o filtro de tom) |
| `fontes` | Ids de `fontes` (pelo menos um). Cada id vira uma etiqueta "Fonte" clicável |
| `antes`, `depois` | HTML do mini mock. Classes: `ln`, `mu`, `p`, `bd` (`ok` `wa` `er` `n`), `bt` (`p` `big`), `fld`, `i`, `tip`, `bar`, `kpi`, `sk`, `prev`, `er-t` |
| `prompt` | Uma linha que se cola para pedir a um agente |
| `destaque` | `true` só para entrar em "Como pedir a um agente" |
| `pl` (opcional) | Exemplo, e se preciso mock, específico de um projeto. O guia genérico não usa; ver abaixo |

3. **Fonte nova?** Acrescente em `fontes`: `id`, `tipo` (`livro` | `guia`), `autor`, `titulo`, `edicao`, `url`, `curto` (rótulo da etiqueta), `ensina` (uma linha, com suas palavras). Registre também em `references/livros.md`.
4. **Valide:** abra o HTML no navegador (ou `python3 -m http.server`), confirme que o cartão aparece, que a busca e os filtros o encontram, que a etiqueta "Fonte" leva ao livro, que o mock cabe em 390 px e que o tema escuro legível. O JSON inválido deixa a página em branco: se acontecer, procure vírgula sobrando.

## Regras de conteúdo

- Resuma com suas palavras. Não copie trechos de livros nem de guias.
- Confira autor, título, edição e ano numa página da editora ou do autor. Não invente edição nem ano.
- Nada específico de projeto no guia genérico. Exemplos de um projeto vão em `pl`, no guia do projeto.
- Um termo por conceito: use os nomes já existentes (ex.: "Selo de status", não "badge" em um lugar e "etiqueta" em outro).

## Projeto com guia próprio

O guia do projeto é este mesmo HTML mais os campos `pl` (e `perfil: "projeto"` no JSON, `rotuloPl` com o nome do projeto). Quando acrescentar algo ao genérico, copie o objeto para o guia do projeto e, se houver exemplo real, preencha `pl`. A fonte de verdade do genérico é `references/guia.html` desta skill (repositório `oandrefelipee/cx-skills`). O guia de um projeto vive no adaptador dele e copia daqui os itens novos.
