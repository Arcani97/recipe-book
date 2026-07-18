<div align="center">

<a href="https://github.com/Arcani97/recipe-book"><img src="https://img.shields.io/badge/Home-242526?logo=googlehome" alt="home"></a>
<a href="https://github.com/Arcani97/recipe-book/blob/main/README-en.md"><img src="https://img.shields.io/badge/README-EN-00247d?style=flat&labelColor=242526" alt="en"></a>
<a href="https://github.com/Arcani97/recipe-book/blob/main/README-ptbr.md"><img src="https://img.shields.io/badge/README-PT--BR-004f1e?style=flat&labelColor=7c7e7e" alt="ptbr"></a>

<h1>Livro de Receitas</h1>

</div>

<br>

<h2>Como usar</h2>

<h3>Mestre</h3>

<ol>
  <li>Um botão <strong>Livro de Receitas</strong> aparece no topo da aba <strong>Itens</strong> da barra lateral, acima de "Criar Item"/"Criar Pasta". Clique para abrir o livro.</li>
  <li>Clique em <strong>Nova Receita</strong>: dê um nome, tags (separadas por vírgula, opcional) e descrição.</li>
  <li>Arraste itens (de um compêndio ou do diretório de itens do mundo) para a caixa <strong>Ingredientes</strong> e para a caixa <strong>Produtos</strong>. Ajuste as quantidades nos campos numéricos, ou arraste novamente um mesmo item para aumentar a quantidade necessária.</li>
  <li>Marque quais personagens recebem essa receita, em <strong>Atribuir a personagens</strong> (agrupado por jogador dono).</li>
  <li>Salve. A receita passa a aparecer no livro dos jogadores donos desses personagens, agrupada pelas tags que você definiu.</li>
  <li>A <strong>Janela de Criação</strong> pode ser aberta/fechada de duas formas:
    <ol>
      <li>Clicando no ícone de cadeado no canto superior da lista de receitas, dentro do próprio livro.</li>
      <li>Pelo controle integrado à lista de jogadores do Foundry (o painel no canto inferior esquerdo que mostra quem está online).</li>
    </ol>
  </li>
</ol>

<h3>Jogador</h3>

<ol>
  <li>Abra o <strong>Livro de Receitas</strong> pela aba de Itens. Se o jogador não tiver nenhum personagem próprio, o livro não abre — aparece um aviso pedindo para o Mestre atribuir um personagem a ele.</li>
  <li>No topo da lista, um botão mostra o personagem atualmente selecionado. Se o jogador tiver mais de um personagem, clicar nele abre uma lista para trocar. O livro mostra as receitas atribuídas ao personagem selecionado.</li>
  <li>Se a Janela de Criação estiver aberta e o personagem selecionado tiver os ingredientes necessários, o botão <strong>Criar</strong> fica disponível. Ao clicar, os ingredientes são consumidos e o(s) produto(s) aparece(m) no inventário do personagem, com uma mensagem no chat registrando o craft.</li>
  <li>Se faltar ingrediente ou a janela estiver fechada, o jogo avisa o motivo e nada é consumido.</li>
</ol>

<br>

<h2>Gerenciando atribuições</h2>

<p>O botão <strong>Gerenciar Atribuições</strong> (ícone de duas pessoas, ao lado do cadeado da Janela de Criação, só Mestre) abre uma janela listando todas as receitas agrupadas por jogador, em vez de por receita:</p>

<ul>
  <li>Uma receita com personagens de mais de um jogador aparece uma vez em cada um desses jogadores.</li>
  <li>Receitas sem nenhum personagem atribuído ficam agrupadas em <strong>Não Atribuídos</strong>, no final da lista.</li>
  <li>Clicar no nome de uma receita expande o mesmo checklist de personagens usado no editor de receita, permitindo ao Mestre atribuir ou remover personagens direto por essa janela.</li>
  <li><strong>Marcar Tudo</strong> / <strong>Desmarcar Tudo</strong>, no topo da janela, afetam todas as receitas de uma vez — você escolhe um personagem específico ou "Todos os personagens" quando perguntado.</li>
</ul>

<br>

<h2>Compatibilidade com sistemas de jogo</h2>

<p>O módulo é agnóstico de sistema. A única configuração específica de sistema é o <strong>campo de quantidade do item</strong> (<code>Configurar Módulos &gt; Recipe Book</code>), que por padrão é <code>system.quantity</code> (usado pela maioria dos sistemas, incluindo <strong><em>D&amp;D5e</em></strong>).
Se o seu sistema guardar quantidade em outro campo, ajuste esse valor. (O sistema <strong><em>Symbaroum</em></strong>, por exemplo, usa o campo <code>system.number</code>.)
Sistemas onde itens não têm quantidade funcionam normalmente — o módulo trata a ausência do campo como quantidade 1 por item.</p>

<br>

<h2>Importando, exportando e apagando receitas</h2>

<p>Pensado para separar o motor de crafting (este módulo) do conteúdo específico de cada sistema de jogo (itens e receitas), evitando o problema de itens/receitas quebrados por incompatibilidade entre sistemas. A ideia: cada sistema de jogo tem seu próprio módulo de conteúdo, com um Compendium Pack de Itens (ou itens de mundo) e um arquivo de receitas que aponta pra esses itens via UUID.</p>

<p>Existem três botões em <strong>Configurar Módulos &gt; Recipe Book</strong>, restritos ao Mestre:</p>

<ul>
  <li><strong>Exportar</strong>: gera um arquivo <code>recipe-book-recipes.json</code> com todas as receitas deste mundo, pronto para importar em outro mundo, mesclar com outro arquivo, ou servir de base para um módulo de conteúdo.</li>
  <li><strong>Importar</strong>: pede o caminho de um arquivo JSON (com um botão para navegar/escolher o arquivo, igual ao seletor de imagem do editor de receitas) e importa as receitas dele. Pode ser um arquivo que alguém te mandou, um que você mesmo exportou antes, ou um dentro de um módulo instalado — o módulo não faz nenhuma busca automática em lugar nenhum, só olha o caminho que você informar.</li>
  <li><strong>Apagar Tudo</strong>: remove permanentemente todas as receitas deste mundo, depois de uma etapa de confirmação. Não pode ser desfeito.</li>
</ul>

<p><strong>Formato do arquivo</strong> (o mesmo tanto para o que o botão Exportar gera quanto para o que o botão Importar espera encontrar):</p>

<pre><code>[
  {
    "id": "barrvalgs-cauldron",
    "name": "Barrvalg's Cauldron",
    "tags": ["Poções"],
    "description": "&lt;p&gt;Descrição da receita, em HTML.&lt;/p&gt;",
    "ingredients": [
      { "uuid": "Compendium.meu-modulo-de-conteudo.meus-itens.XXXXXXXX", "name": "Blue Drops", "quantity": 1 }
    ],
    "results": [
      { "uuid": "Compendium.meu-modulo-de-conteudo.meus-itens.YYYYYYYY", "name": "Barrvalg's Cauldron", "quantity": 1 }
    ]
  }
]</code></pre>

<ul>
  <li>Um array simples de receitas — nenhum campo "wrapper" ao redor, o que facilita mesclar duas exportações diferentes num arquivo só (basta juntar os itens dos dois arrays).</li>
  <li><code>id</code> é opcional na importação, mas recomendado — usado para reconhecer a receita em importações futuras e evitar duplicar. Se omitido, é derivado do <code>name</code>. O botão Exportar sempre inclui um <code>id</code> estável.</li>
  <li><code>name</code> dentro de <code>ingredients</code>/<code>results</code> existe só para facilitar a leitura humana e a fusão manual de dois arquivos — na importação, o nome e a imagem reais são sempre lidos de novo a partir do item de verdade (via <code>uuid</code>); o que estiver escrito em <code>name</code> no arquivo nunca é usado para valer.</li>
  <li><code>assignedActorIds</code> não faz parte do formato — atribuir personagens é sempre feito pelo Mestre, dentro do mundo, depois da importação.</li>
  <li>Se um ingrediente/produto referenciar um <code>uuid</code> que não existe (pack não instalado, ou instalado para o sistema errado), aquela receita inteira é ignorada — nunca é criada uma receita com menos ingredientes/produtos do que o originalmente definido.</li>
</ul>

<p><strong>Para desenvolvedores de módulos de conteúdo</strong>: o botão Importar das configurações é pensado para uso manual e ocasional (uma pessoa importando um arquivo avulso). Um módulo de conteúdo que distribui suas próprias receitas deve chamar a API diretamente, em vez de depender do botão manual das configurações do Recipe Book. <strong>Recomendado</strong>: registre seu próprio menu de configurações (com um botão "Importar"/"Atualizar"), em vez de importar automaticamente no <code>Hooks.once("ready")</code> — assim quem joga não paga o custo dessa checagem toda vez que o mundo carrega, e você decide quando uma atualização de conteúdo deve ser aplicada. Veja <code>recipe-book-content-template</code> (módulo de exemplo) para um modelo pronto desse padrão, com dois botões: um que só adiciona o que falta, e outro que restaura tudo (sobrescrevendo o que já existe no mundo).</p>

<pre><code>const recipeBook = game.modules.get("recipe-book");
if (!recipeBook?.active) return;

const response = await fetch("modules/meu-modulo-de-conteudo/recipe-book-recipes.json");
const recipes = await response.json();

const result = await recipeBook.api.importRecipes(recipes, { source: "meu-modulo-de-conteudo", overwrite: false });
console.log(`Recipe Book: ${result.imported} importadas, ${result.updated} atualizadas, ${result.skipped} já existiam.`, result.errors);</code></pre>

<ul>
  <li><code>source</code> deve ser um identificador estável do módulo de conteúdo (o próprio <code>id</code> do módulo funciona bem). É combinado com o <code>id</code> de cada receita para formar o identificador de importação — reimportar sem <code>overwrite</code> não duplica nem sobrescreve receitas já importadas antes. Os motivos de qualquer receita ignorada ficam em <code>result.errors</code>.</li>
  <li><code>overwrite: false</code> (padrão) pula receitas já importadas antes, sem tocar nelas. <code>overwrite: true</code> atualiza receitas já importadas com os dados do arquivo (nome, tags, descrição, ingredientes, produtos), mas nunca mexe em <code>assignedActorIds</code> — isso é sempre escolha do Mestre, feita dentro do mundo.</li>
</ul>

<br>

<h2>Adicionando um novo idioma</h2>

<p>Isso foi pensado para ser bem simples:</p>

<ol>
  <li>Copie <code>lang/en.json</code> (ou <code>lang/pt-BR.json</code>) para um novo arquivo, por exemplo <code>lang/es.json</code>.</li>
  <li>Traduza os valores (a parte à direita de cada <code>:</code>). <strong>Não altere as chaves</strong> à esquerda (ex.: <code>"RECIPE-BOOK.App.Title"</code>), apenas o texto traduzido.</li>
  <li>Abra <code>module.json</code> e adicione uma entrada em <code>"languages"</code>:</li>
</ol>

<pre><code>{ "lang": "es", "name": "Español", "path": "lang/es.json" }</code></pre>

<ol start="4">
  <li>Reinicie o Foundry (ou recarregue o mundo). O novo idioma aparecerá nas opções de idioma do Foundry.</li>
</ol>

<p>Não é necessário mexer em nenhum outro arquivo para traduzir — todo o texto da interface vem dos arquivos em <code>lang/</code>.</p>

<br>

<h2>Estrutura do módulo</h2>

<pre><code>recipe-book/
├── module.json                     Manifesto do módulo
├── scripts/
│   ├── constants.js                ID do módulo
│   ├── debug.js                    Log padronizado no console
│   ├── main.js                     Hooks, settings, menus de configuração, botão na aba de Itens, controle na lista de jogadores
│   ├── recipe-data.js              CRUD, importação e exportação de receitas
│   ├── crafting-logic.js           Checagem/consumo de ingredientes e criação de itens
│   ├── actor-groups.js             Agrupa personagens de jogadores pelo dono (usado no editor e no livro)
│   └── apps/
│       ├── recipe-book-app.js          Janela do livro (GM + jogadores)
│       ├── recipe-editor-app.js        Janela de criar/editar receita (GM)
│       ├── recipe-assignments-app.js   Janela de Gerenciar Atribuições (GM)
│       ├── import-recipes-app.js       Janela de Importar Receitas (menu de configurações)
│       ├── export-recipes-app.js       Janela de Exportar Receitas (menu de configurações)
│       └── delete-all-recipes-app.js   Janela de Apagar Todas as Receitas (menu de configurações)
├── templates/                      Templates Handlebars das janelas acima
├── styles/recipe-book.css          Estilos
└── lang/
    ├── pt-BR.json                  Português (idioma principal)
    └── en.json                     Inglês (referência para novas traduções)
</code></pre>

<br>

<h2>Notas técnicas</h2>

<ul>
  <li>As receitas ficam salvas em um <em>world setting</em> (<code>recipe-book.recipes</code>), então são as mesmas para todos os usuários e persistem com o mundo.</li>
  <li>A correspondência entre um ingrediente da receita e os itens que o personagem possui é feita, em ordem de prioridade: (1) mesmo UUID exato, (2) mesmo UUID de origem (item veio de um compêndio/item via <code>flags.core.sourceId</code>), (3) mesmo nome do item, como último recurso. Por isso, para maior confiabilidade, prefira criar receitas arrastando itens de um compêndio ou do diretório de itens do mundo (não de fichas individuais), garantindo que os personagens tenham itens realmente originados dali.</li>
  <li>Uma API simples é exposta em <code>game.modules.get("recipe-book").api</code>: <code>RecipeBookApp</code>, <code>RecipeEditorApp</code>, <code>importRecipes</code>, <code>exportRecipes</code> (veja a seção de importação/exportação acima). Para abrir o livro por uma macro, use:</li>
</ul>

<pre><code>new (game.modules.get("recipe-book").api.RecipeBookApp)().render(true);</code></pre>
