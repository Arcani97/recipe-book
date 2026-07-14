### Idiomas Disponiveis

<img alt="README-EN" src="https://img.shields.io/badge/README-EN-00247d?style=flat&link=https://github.com/Arcani97/recipe-book/blob/main/README.md">  <img alt="README-EN" src="https://img.shields.io/badge/README-PT--BR-004f1e?style=flat&labelColor=ffffff&link=https://github.com/Arcani97/recipe-book/blob/main/README-PTBR.md">

<br/>

# Recipe Book (Livro de Receitas)

Módulo para Foundry VTT que adiciona um livro de receitas para facilitar a criação de itens automaticamente.

Este projeto é desenvolvido de forma independente e durante o tempo livre. Sugestões, correções e relatos de erros são sempre bem-vindos.

<br/>

## Instalação

**Manifest URL**

```text
https://raw.githubusercontent.com/Arcani97/recipe-book/refs/heads/main/module.json
```

<br/>

## Como usar

### Mestre
1. Um botão **Livro de Receitas** aparece no topo da aba **Itens** da barra lateral, acima de "Criar Item"/"Criar Pasta". Clique para abrir o livro.
2. Clique em **Nova Receita**: dê um nome, tags (separadas por vírgula, opcional) e descrição.
3. Arraste itens (de um compêndio ou do diretório de itens do mundo) para a caixa **Ingredientes** e para a caixa **Produtos**. Ajuste as quantidades nos campos numéricos ou araste novamente um mesmo item para aumentar a quantidade nescessária.
4. Marque quais personagens recebem essa receita, em **Atribuir a personagens** (agrupado por jogador dono).
5. Salve. A receita passa a aparecer no livro dos jogadores donos desses personagens, agrupada pelas tags que você definiu.
6. A **Janela de Criação** pode ser aberta/fechada de duas formas:
   1. Clicando no ícone de cadeado no canto superior da lista de receitas, dentro do próprio livro.
   2. Pelo controle integrado à lista de jogadores do Foundry (o painel no canto inferior esquerdo que mostra quem está online).

### Jogador
1. Abra o **Livro de Receitas** pela aba de Itens. Se o jogador não tiver nenhum personagem próprio, o livro não abre — aparece um aviso pedindo para o Mestre atribuir um personagem a ele.
2. No topo da lista, um botão mostra o personagem atualmente
   selecionado. Se o jogador tiver mais de um personagem, clicar nele abre uma lista para trocar. O livro mostra as receitas atribuídas ao personagem selecionado.
3. Se a Janela de Criação estiver aberta e o personagem selecionado tiver os ingredientes necessários, o botão **Criar** fica disponível. Ao clicar, os ingredientes são consumidos e o(s) produto(s) aparece(m) no inventário do personagem, com uma mensagem no chat registrando o craft.
4. Se faltar ingrediente ou a janela estiver fechada, o jogo avisa o motivo e nada é consumido.

<br/>

## Compatibilidade com sistemas de jogo

O módulo é agnóstico de sistema. A única configuração específica-de-sistema é o **campo de quantidade do item** (`Configurar Módulos > Recipe Book`), que por padrão é `system.quantity` (usado pela maioria dos sistemas, incluindo _**D&D5e**_).
Se o seu sistema guardar quantidade em outro campo, ajuste esse valor. (O Sistema _**Symbaroum**_ por exemplo usa o campo `system.number`)
Sistemas onde itens não têm quantidade funcionam normalmente — o módulo trata a ausência do campo como quantidade 1 por item.

<br/>

## Adicionando um novo idioma

Isso foi pensado para ser bem simples:

1. Copie `lang/en.json` (ou `lang/pt-BR.json`) para um novo arquivo, por exemplo `lang/es.json`.
2. Traduza os valores (a parte à direita de cada `:`). **Não altere as chaves** à esquerda (ex.: `"RECIPE-BOOK.App.Title"`), apenas o texto traduzido.
3. Abra `module.json` e adicione uma entrada em `"languages"`:

```json
{ "lang": "es", "name": "Español", "path": "lang/es.json" }
```

4. Reinicie o Foundry (ou recarregue o mundo). O novo idioma aparecerá nas opções de idioma do Foundry.

Não é necessário mexer em nenhum outro arquivo para traduzir — todo o texto da interface vem dos arquivos em `lang/`.

<br/>

## Estrutura do módulo

```
recipe-book/
├── module.json                     Manifesto do módulo
├── scripts/
│   ├── constants.js                ID do módulo
│   ├── main.js                     Hooks, settings, botão na aba de Itens, controle na lista de jogadores
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

<br/>

## Notas técnicas

- As receitas ficam salvas em um *world setting* (`recipe-book.recipes`), então são as mesmas para todos os usuários e persistem com o mundo.
- A correspondência entre um ingrediente da receita e os itens que o personagem possui é feita, em ordem de prioridade: (1) mesmo UUID exato, (2) mesmo UUID de origem (item veio de um compêndio/item via `flags.core.sourceId`), (3) mesmo nome do item, como último recurso. Por isso, para maior confiabilidade, prefira criar receitas arrastando itens de um compêndio ou do diretório de itens do mundo (não de fichas individuais), garantindo que os personagens tenham itens realmente originados dali.
- Uma API simples é exposta em `game.modules.get("recipe-book").api` (`RecipeBookApp`, `RecipeEditorApp`), caso queira abrir o livro por uma macro, use:

```js
new (game.modules.get("recipe-book").api.RecipeBookApp)().render(true);
```
