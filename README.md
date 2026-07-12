# Recipe Book (Livro de Receitas)

Módulo para Foundry VTT que adiciona um livro de receitas de crafting:
o Mestre cria receitas (ingredientes → produtos), atribui a personagens
específicos, e controla uma "janela de tempo" durante a qual os
jogadores podem fabricar os itens da receita, consumindo os
ingredientes automaticamente.

## Instalação

1. Extraia esta pasta (`recipe-book`) dentro de `Data/modules/` na sua
   instalação do Foundry (ou use "Instalar Módulo" e aponte para o
   `module.json`, caso hospede os arquivos em algum lugar).
2. Ative o módulo em **Configurar Módulos** no seu mundo.

## Como usar

### Mestre
1. Um botão **Livro de Receitas** aparece na barra de ferramentas
   lateral (ícone de livro). Clique para abrir o livro.
2. Clique em **Nova Receita**: dê um nome, tags (separadas por
   vírgula, opcional) e descrição (com formatação — negrito, itálico,
   listas etc.).
3. Arraste itens (de um compêndio, do diretório de itens do mundo, ou
   da ficha de um personagem) para a caixa **Ingredientes** e para a
   caixa **Produtos**. Ajuste as quantidades nos campos numéricos.
4. Marque quais personagens recebem essa receita, em **Atribuir a
   personagens** (agrupado por jogador dono).
5. Salve. A receita passa a aparecer no livro dos jogadores donos
   desses personagens, agrupada pelas tags que você definiu.
6. A **Janela de Criação** pode ser aberta/fechada de duas formas:
   - Clicando no ícone de cadeado no canto superior da lista de
     receitas, dentro do próprio livro.
   - Pelo controle integrado à lista de jogadores do Foundry (o
     painel no canto inferior esquerdo que mostra quem está online),
     no mesmo estilo do módulo Breaktime — visível só para o Mestre
     como botão clicável; os jogadores veem o status, mas não podem
     alterá-lo.

### Jogador
1. Abra o **Livro de Receitas** pela barra de ferramentas.
2. Verá apenas as receitas atribuídas aos personagens que possui.
3. Se a Janela de Criação estiver aberta e o personagem tiver os
   ingredientes necessários, o botão **Criar como [Personagem]** fica
   disponível. Ao clicar, os ingredientes são consumidos e o(s)
   produto(s) aparece(m) no inventário do personagem, com uma
   mensagem no chat registrando o craft.
4. Se faltar ingrediente ou a janela estiver fechada, o jogo avisa o
   motivo e nada é consumido.

## Compatibilidade com sistemas de jogo

O módulo é agnóstico de sistema. A única configuração
específica-de-sistema é o **campo de quantidade do item**
(`Configurar Módulos > Recipe Book`), que por padrão é
`system.quantity` (usado pela maioria dos sistemas, incluindo D&D5e).
Se o seu sistema guardar quantidade em outro campo, ajuste esse valor.
Sistemas onde itens não têm quantidade funcionam normalmente — o
módulo trata a ausência do campo como quantidade 1 por item.

## Adicionando um novo idioma

Isso foi pensado para ser bem simples:

1. Copie `lang/en.json` (ou `lang/pt-BR.json`) para um novo arquivo,
   por exemplo `lang/es.json`.
2. Traduza os valores (a parte à direita de cada `:`). **Não altere as
   chaves** à esquerda (ex.: `"RECIPE-BOOK.App.Title"`), apenas o
   texto traduzido.
3. Abra `module.json` e adicione uma entrada em `"languages"`:

```json
{ "lang": "es", "name": "Español", "path": "lang/es.json" }
```

4. Reinicie o Foundry (ou recarregue o mundo). O novo idioma aparecerá
   nas opções de idioma do Foundry.

Não é necessário mexer em nenhum arquivo `.js` ou `.hbs` para traduzir
— todo o texto da interface vem dos arquivos em `lang/`.

## Estrutura do módulo

```
recipe-book/
├── module.json                     Manifesto do módulo
├── scripts/
│   ├── constants.js                ID do módulo
│   ├── main.js                     Hooks, settings, botão na barra de ferramentas, controle na lista de jogadores
│   ├── recipe-data.js              CRUD das receitas (armazenadas em um world setting)
│   ├── crafting-logic.js           Checagem/consumo de ingredientes e criação de itens
│   ├── actor-groups.js             Agrupa personagens de jogadores pelo dono (usado no editor e no livro)
│   └── apps/
│       ├── recipe-book-app.js      Janela do livro (GM + jogadores)
│       └── recipe-editor-app.js    Janela de criar/editar receita (GM)
├── templates/                      Templates Handlebars das janelas acima
├── styles/recipe-book.css          Estilos
└── lang/
    ├── pt-BR.json                  Português (idioma principal)
    └── en.json                     Inglês (referência para novas traduções)
```

## Notas técnicas

- As receitas ficam salvas em um *world setting* (`recipe-book.recipes`),
  então são as mesmas para todos os usuários e persistem com o mundo.
- A correspondência entre um ingrediente da receita e os itens que o
  personagem possui é feita, em ordem de prioridade: (1) mesmo UUID
  exato, (2) mesmo UUID de origem (item veio de um compêndio/item via
  `flags.core.sourceId`), (3) mesmo nome do item, como último recurso.
  Por isso, para maior confiabilidade, prefira criar receitas
  arrastando itens de um compêndio ou do diretório de itens do mundo
  (não de fichas individuais), garantindo que os personagens tenham
  itens realmente originados dali.
- Uma API simples é exposta em
  `game.modules.get("recipe-book").api` (`RecipeBookApp`,
  `RecipeEditorApp`), caso queira abrir o livro por uma macro, por
  exemplo:

```js
new (game.modules.get("recipe-book").api.RecipeBookApp)().render(true);
```
