
[![home](https://img.shields.io/badge/Home-242526?logo=googlehome
)](https://github.com/Arcani97/recipe-book)
[![en](https://img.shields.io/badge/README-EN-00247d?style=flat&labelColor=7c7e7e)](https://github.com/Arcani97/recipe-book/blob/main/README-en.md)
[![ptbr](https://img.shields.io/badge/README-PT--BR-004f1e?style=flat&labelColor=242526)](https://github.com/Arcani97/recipe-book/blob/main/README-ptbr.md)

# Recipe Book


## How to use

### Game Master

1. A **Recipe Book** button appears at the top of the sidebar's **Items** tab, above "Create Item"/"Create Folder". Click it to open the book.
2. Click **New Recipe**: give it a name, tags (comma-separated, optional), and a description.
3. Drag items (from a compendium or the world's item directory) into the **Ingredients** box and the **Products** box. Adjust quantities in the number fields, or drag the same item again to increase the required amount.
4. Check which characters receive this recipe, under **Assign to characters** (grouped by owning player).
5. Save. The recipe now appears in the book of the players who own those characters, grouped by the tags you defined.
6. The **Crafting Window** can be opened/closed in two ways:
   1. Clicking the lock icon at the top of the recipe list, inside the book itself.
   2. Through the control integrated into Foundry's player list (the panel in the bottom-left corner showing who's online).

### Player

1. Open the **Recipe Book** from the Items tab. If the player has no character of their own, the book won't open — a warning appears asking the GM to assign a character to them.
2. At the top of the list, a button shows the currently selected character. If the player has more than one character, clicking it opens a list to switch. The book shows the recipes assigned to the selected character.
3. If the Crafting Window is open and the selected character has the required ingredients, the **Craft** button becomes available. Clicking it consumes the ingredients and the product(s) appear in the character's inventory, with a chat message logging the craft.
4. If an ingredient is missing or the window is closed, the game explains why and nothing is consumed.

<br/>

## Game system compatibility

The module is system-agnostic. The only system-specific setting is the **item quantity field** (`Configure Settings > Recipe Book`), which defaults to `system.quantity` (used by most systems, including _**D&D5e**_).
If your system stores quantity in a different field, adjust this value. (The _**Symbaroum**_ system, for example, uses the `system.number` field.)
Systems where items have no quantity work normally — the module treats a missing field as a quantity of 1 per item.

<br/>

## Adding a new language


This was designed to be quite simple:

1. Copy `lang/en.json` (or `lang/pt-BR.json`) to a new file, e.g. `lang/es.json`.
2. Translate the values (the part to the right of each `:`). **Do not change the keys** on the left (e.g. `"RECIPE-BOOK.App.Title"`) — only the translated text.
3. Open `module.json` and add an entry under `"languages"`:

```json
{ "lang": "es", "name": "Español", "path": "lang/es.json" }
```

4. Restart Foundry (or reload the world). The new language will appear in Foundry's language options.

No other file needs to be touched to translate the module — all interface text comes from the files in `lang/`.

<br/>

## Module structure

```
recipe-book/
├── module.json                     Module manifest
├── scripts/
│   ├── constants.js                Module ID
│   ├── main.js                     Hooks, settings, Items-tab button, player-list control
│   ├── recipe-data.js              Recipe CRUD
│   ├── crafting-logic.js           Ingredient checking/consumption and item creation
│   ├── actor-groups.js             Groups player characters by owner
│   └── apps/
│       ├── recipe-book-app.js      Book window
│       └── recipe-editor-app.js    Recipe create/edit window
├── templates/                      Handlebars templates for the windows above
├── styles/recipe-book.css          Styles
└── lang/
    ├── pt-BR.json                  Portuguese
    └── en.json                     English
```

<br/>

##  Technical notes


- Recipes are saved in a *world setting* (`recipe-book.recipes`), so they're the same for all users and persist with the world.
- Matching between a recipe's ingredient and the items a character owns is done in priority order: (1) exact same UUID, (2) same source UUID (item originated from a compendium/item via `flags.core.sourceId`), (3) same item name, as a last resort. For greater reliability, prefer creating recipes by dragging items from a compendium or the world's item directory (not from individual character sheets), ensuring characters truly have items originating from there.
- A simple API is exposed at `game.modules.get("recipe-book").api` (`RecipeBookApp`, `RecipeEditorApp`). To open the book from a macro, use:

```js
new (game.modules.get("recipe-book").api.RecipeBookApp)().render(true);
```
