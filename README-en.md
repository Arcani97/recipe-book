<div align="center">

<a href="https://github.com/Arcani97/recipe-book"><img src="https://img.shields.io/badge/Home-242526?logo=googlehome" alt="home"></a>
<a href="https://github.com/Arcani97/recipe-book/blob/main/README-en.md"><img src="https://img.shields.io/badge/README-EN-00247d?style=flat&labelColor=7c7e7e" alt="en"></a>
<a href="https://github.com/Arcani97/recipe-book/blob/main/README-ptbr.md"><img src="https://img.shields.io/badge/README-PT--BR-004f1e?style=flat&labelColor=242526" alt="ptbr"></a>

<h1>Recipe Book</h1>

</div>

<br>

<h2>How to use</h2>

<h3>Game Master</h3>

<ol>
  <li>A <strong>Recipe Book</strong> button appears at the top of the sidebar's <strong>Items</strong> tab, above "Create Item"/"Create Folder". Click it to open the book.</li>
  <li>Click <strong>New Recipe</strong>: give it a name, tags (comma-separated, optional), and a description.</li>
  <li>Drag items (from a compendium or the world's item directory) into the <strong>Ingredients</strong> box and the <strong>Products</strong> box. Adjust quantities in the number fields, or drag the same item again to increase the required amount.</li>
  <li>Check which characters receive this recipe, under <strong>Assign to characters</strong> (grouped by owning player).</li>
  <li>Save. The recipe now appears in the book of the players who own those characters, grouped by the tags you defined.</li>
  <li>The <strong>Crafting Window</strong> can be opened/closed in two ways:
    <ol>
      <li>Clicking the lock icon at the top of the recipe list, inside the book itself.</li>
      <li>Through the control integrated into Foundry's player list (the panel in the bottom-left corner showing who's online).</li>
    </ol>
  </li>
</ol>

<h3>Player</h3>

<ol>
  <li>Open the <strong>Recipe Book</strong> from the Items tab. If the player has no character of their own, the book won't open — a warning appears asking the GM to assign a character to them.</li>
  <li>At the top of the list, a button shows the currently selected character. If the player has more than one character, clicking it opens a list to switch. The book shows the recipes assigned to the selected character.</li>
  <li>If the Crafting Window is open and the selected character has the required ingredients, the <strong>Craft</strong> button becomes available. Clicking it consumes the ingredients and the product(s) appear in the character's inventory, with a chat message logging the craft.</li>
  <li>If an ingredient is missing or the window is closed, the game explains why and nothing is consumed.</li>
</ol>

<br>

<h2>Managing assignments</h2>

<p>The <strong>Manage Assignments</strong> button (icon of two people, next to the Crafting Window lock icon, GM only) opens a window listing every recipe grouped by player instead of by recipe:</p>

<ul>
  <li>A recipe with characters from more than one player appears once under each of those players.</li>
  <li>Recipes with no character assigned at all are grouped under <strong>Unassigned</strong>, at the end of the list.</li>
  <li>Clicking a recipe's name expands the same character checklist used in the recipe editor, letting the GM assign or unassign characters directly from this window.</li>
  <li><strong>Assign All</strong> / <strong>Unassign All</strong>, at the top of the window, apply to every recipe at once — you pick a specific character or "All characters" when prompted.</li>
</ul>

<br>

<h2>Game system compatibility</h2>

<p>The module is system-agnostic. The only system-specific setting is the <strong>item quantity field</strong> (<code>Configure Settings &gt; Recipe Book</code>), which defaults to <code>system.quantity</code> (used by most systems, including <strong><em>D&amp;D5e</em></strong>).
If your system stores quantity in a different field, adjust this value. (The <strong><em>Symbaroum</em></strong> system, for example, uses the <code>system.number</code> field.)
Systems where items have no quantity work normally — the module treats a missing field as a quantity of 1 per item.</p>

<br>

<h2>Importing, exporting, and deleting recipes</h2>

<p>Meant to separate the crafting engine (this module) from content specific to each game system (items and recipes), avoiding broken items/recipes caused by system incompatibility. The idea: each game system gets its own content module, with an Item Compendium Pack (or world items) and a recipes file pointing to those items via UUID.</p>

<p>Three buttons are available under <strong>Configure Settings &gt; Recipe Book</strong>, GM only:</p>

<ul>
  <li><strong>Export</strong>: generates a <code>recipe-book-recipes.json</code> file with every recipe in this world, ready to import into another world, merge with another file, or serve as the base for a content module.</li>
  <li><strong>Import</strong>: asks for the path to a JSON file (with a browse button, same as the recipe editor's image picker) and imports the recipes in it. Can be a file someone sent you, one you exported yourself, or one inside an installed module — the module never scans anywhere automatically, it only looks at the path you give it.</li>
  <li><strong>Delete All</strong>: permanently removes every recipe in this world, after a confirmation step. Cannot be undone.</li>
</ul>

<p><strong>File format</strong> (the same one both Export produces and Import expects):</p>

<pre><code>[
  {
    "id": "barrvalgs-cauldron",
    "name": "Barrvalg's Cauldron",
    "tags": ["Potions"],
    "description": "&lt;p&gt;Recipe description, in HTML.&lt;/p&gt;",
    "ingredients": [
      { "uuid": "Compendium.my-content-module.my-items.XXXXXXXX", "name": "Blue Drops", "quantity": 1 }
    ],
    "results": [
      { "uuid": "Compendium.my-content-module.my-items.YYYYYYYY", "name": "Barrvalg's Cauldron", "quantity": 1 }
    ]
  }
]</code></pre>

<ul>
  <li>A plain array of recipes — no wrapper object, which makes it easy to merge two exports into a single file (just combine the arrays).</li>
  <li><code>id</code> is optional on import, but recommended — used to recognize the recipe on future imports and avoid duplicates. If omitted, it's derived from <code>name</code>. The Export button always includes a stable <code>id</code>.</li>
  <li><code>name</code> inside <code>ingredients</code>/<code>results</code> exists only to make the file human-readable and easier to merge by hand — on import, the real name and image are always re-read from the actual item (via <code>uuid</code>); whatever is written in <code>name</code> in the file is never trusted.</li>
  <li><code>assignedActorIds</code> is not part of the format — assigning characters is always done by the GM, inside the world, after importing.</li>
  <li>If an ingredient/product references a <code>uuid</code> that doesn't exist (pack not installed, or installed for the wrong system), that entire recipe is skipped — a recipe is never created with fewer ingredients/products than originally defined.</li>
</ul>

<p><strong>For content module developers</strong>: the settings Import button is meant for occasional, manual use (one person importing a standalone file). A content module distributing its own recipes should call the API directly, instead of relying on the GM clicking anything in Recipe Book's settings. <strong>Recommended</strong>: register your own settings menu (with an "Import"/"Update" button) instead of importing automatically on <code>Hooks.once("ready")</code> — that way players don't pay the cost of that check every time the world loads, and you control when a content update is applied. See <code>recipe-book-content-template</code> (example module) for a ready-made model of this pattern, with two buttons: one that only adds what's missing, and one that restores everything (overwriting what already exists in the world).</p>

<pre><code>const recipeBook = game.modules.get("recipe-book");
if (!recipeBook?.active) return;

const response = await fetch("modules/my-content-module/recipe-book-recipes.json");
const recipes = await response.json();

const result = await recipeBook.api.importRecipes(recipes, { source: "my-content-module", overwrite: false });
console.log(`Recipe Book: ${result.imported} imported, ${result.updated} updated, ${result.skipped} already existed.`, result.errors);</code></pre>

<ul>
  <li><code>source</code> should be a stable identifier for the content module (the module's own <code>id</code> works well). It's combined with each recipe's <code>id</code> to form the import identifier — reimporting without <code>overwrite</code> won't duplicate or overwrite recipes already imported before. The reasons for any skipped recipe end up in <code>result.errors</code>.</li>
  <li><code>overwrite: false</code> (default) skips recipes already imported before, without touching them. <code>overwrite: true</code> updates already-imported recipes with the file's data (name, tags, description, ingredients, products), but never touches <code>assignedActorIds</code> — that's always the GM's choice, made inside the world.</li>
</ul>

<br>

<h2>Adding a new language</h2>

<p>This was designed to be quite simple:</p>

<ol>
  <li>Copy <code>lang/en.json</code> (or <code>lang/pt-BR.json</code>) to a new file, e.g. <code>lang/es.json</code>.</li>
  <li>Translate the values (the part to the right of each <code>:</code>). <strong>Do not change the keys</strong> on the left (e.g. <code>"RECIPE-BOOK.App.Title"</code>) — only the translated text.</li>
  <li>Open <code>module.json</code> and add an entry under <code>"languages"</code>:</li>
</ol>

<pre><code>{ "lang": "es", "name": "Español", "path": "lang/es.json" }</code></pre>

<ol start="4">
  <li>Restart Foundry (or reload the world). The new language will appear in Foundry's language options.</li>
</ol>

<p>No other file needs to be touched to translate the module — all interface text comes from the files in <code>lang/</code>.</p>

<br>

<h2>Module structure</h2>

<pre><code>recipe-book/
├── module.json                     Module manifest
├── scripts/
│   ├── constants.js                Module ID
│   ├── debug.js                    Standardized console logging
│   ├── main.js                     Hooks, settings, settings menus, Items-tab button, player-list control
│   ├── recipe-data.js              Recipe CRUD, import, and export
│   ├── crafting-logic.js           Ingredient checking/consumption and item creation
│   ├── actor-groups.js             Groups player characters by owner
│   └── apps/
│       ├── recipe-book-app.js          Book window (GM + players)
│       ├── recipe-editor-app.js        Recipe create/edit window (GM)
│       ├── recipe-assignments-app.js   Manage Assignments window (GM)
│       ├── import-recipes-app.js       Import Recipes window (settings menu)
│       ├── export-recipes-app.js       Export Recipes window (settings menu)
│       └── delete-all-recipes-app.js   Delete All Recipes window (settings menu)
├── templates/                      Handlebars templates for the windows above
├── styles/recipe-book.css          Styles
└── lang/
    ├── pt-BR.json                  Portuguese
    └── en.json                     English
</code></pre>

<br>

<h2>Technical notes</h2>

<ul>
  <li>Recipes are saved in a <em>world setting</em> (<code>recipe-book.recipes</code>), so they're the same for all users and persist with the world.</li>
  <li>Matching between a recipe's ingredient and the items a character owns is done in priority order: (1) exact same UUID, (2) same source UUID (item originated from a compendium/item via <code>flags.core.sourceId</code>), (3) same item name, as a last resort. For greater reliability, prefer creating recipes by dragging items from a compendium or the world's item directory (not from individual character sheets), ensuring characters truly have items originating from there.</li>
  <li>A simple API is exposed at <code>game.modules.get("recipe-book").api</code>: <code>RecipeBookApp</code>, <code>RecipeEditorApp</code>, <code>importRecipes</code>, <code>exportRecipes</code> (see the import/export section above). To open the book from a macro, use:</li>
</ul>

<pre><code>new (game.modules.get("recipe-book").api.RecipeBookApp)().render(true);</code></pre>
