import { MODULE_ID } from "./constants.js";
import { RecipeBookApp } from "./apps/recipe-book-app.js";
import { RecipeEditorApp } from "./apps/recipe-editor-app.js";
import { ImportRecipesApp } from "./apps/import-recipes-app.js";
import { ExportRecipesApp } from "./apps/export-recipes-app.js";
import { DeleteAllRecipesApp } from "./apps/delete-all-recipes-app.js";
import { importRecipes, exportRecipes } from "./recipe-data.js";

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | v${game.modules.get(MODULE_ID)?.version}`);

  game.settings.register(MODULE_ID, "recipes", {
    scope: "world",
    config: false,
    type: Array,
    default: []
  });

  game.settings.register(MODULE_ID, "craftingWindowOpen", {
    scope: "world",
    config: false,
    type: Boolean,
    default: false,
    onChange: () => {
      for (const app of RecipeBookApp.openInstances) app.render(false);
      ui.players?.render();
    }
  });

  game.settings.register(MODULE_ID, "quantityPath", {
    name: "RECIPE-BOOK.Settings.QuantityPath.Name",
    hint: "RECIPE-BOOK.Settings.QuantityPath.Hint",
    scope: "world",
    config: true,
    type: String,
    default: "system.quantity"
  });

  game.settings.registerMenu(MODULE_ID, "importRecipesMenu", {
    name: "RECIPE-BOOK.Settings.ImportMenu.Name",
    label: "RECIPE-BOOK.Settings.ImportMenu.Label",
    hint: "RECIPE-BOOK.Settings.ImportMenu.Hint",
    icon: "fa-solid fa-file-import",
    type: ImportRecipesApp,
    restricted: true
  });

  game.settings.registerMenu(MODULE_ID, "exportRecipesMenu", {
    name: "RECIPE-BOOK.Settings.ExportMenu.Name",
    label: "RECIPE-BOOK.Settings.ExportMenu.Label",
    hint: "RECIPE-BOOK.Settings.ExportMenu.Hint",
    icon: "fa-solid fa-file-export",
    type: ExportRecipesApp,
    restricted: true
  });

  game.settings.registerMenu(MODULE_ID, "deleteAllRecipesMenu", {
    name: "RECIPE-BOOK.Settings.DeleteAllMenu.Name",
    label: "RECIPE-BOOK.Settings.DeleteAllMenu.Label",
    hint: "RECIPE-BOOK.Settings.DeleteAllMenu.Hint",
    icon: "fa-solid fa-trash",
    type: DeleteAllRecipesApp,
    restricted: true
  });
});

Hooks.on("updateSetting", setting => {
  if (setting?.key !== `${MODULE_ID}.recipes`) return;
  for (const app of RecipeBookApp.openInstances) app.render(false);
});

Hooks.once("ready", () => {
  game.modules.get(MODULE_ID).api = { RecipeBookApp, RecipeEditorApp, importRecipes, exportRecipes };
});

async function openRecipeBook() {
  if (!game.user.isGM) {
    const myActors = game.actors.filter(a => a.isOwner);
    if (!myActors.length) {
      await foundry.applications.api.DialogV2.prompt({
        window: { title: game.i18n.localize("RECIPE-BOOK.Errors.NoCharacterTitle") },
        content: `<p>${game.i18n.localize("RECIPE-BOOK.Errors.NoCharacterMessage")}</p>`,
        ok: { label: game.i18n.localize("RECIPE-BOOK.Errors.NoCharacterOk") }
      });
      return;
    }
  }
  new RecipeBookApp().render(true);
}

Hooks.on("renderItemDirectory", (app, html) => {
  try {
    const $html = html?.jquery ? html : $(html);
    $html.find(".recipe-book-directory-button").remove();

    const button = $(`
      <button type="button" class="recipe-book-directory-button">
        <i class="fa-solid fa-book-open-cover"></i> ${game.i18n.localize("RECIPE-BOOK.Controls.OpenBook")}
      </button>
    `);
    button.on("click", () => openRecipeBook());

    const header = $html.find(".directory-header").first();
    if (header.length) header.prepend(button);
    else $html.prepend(button);
  } catch (err) {
    console.error(`${MODULE_ID} | Falha ao injetar o botão na aba de Itens`, err);
  }
});

Hooks.on("renderPlayers", (app, html) => {
  if (!game.user.isGM) return;

  try {
    $(".recipe-book-player-control", html).remove();

    const windowOpen = game.settings.get(MODULE_ID, "craftingWindowOpen");
    const statusLabel = game.i18n.localize(
      windowOpen ? "RECIPE-BOOK.Hud.StatusOpen" : "RECIPE-BOOK.Hud.StatusClosed"
    );

    const control = $(`
      <div class="recipe-book-player-control ${windowOpen ? "open" : "closed"}"
           title="${game.i18n.localize("RECIPE-BOOK.Controls.GroupTitle")}">
        <i class="fa-solid ${windowOpen ? "fa-lock-open" : "fa-lock"}"></i>
        <span>${game.i18n.localize("RECIPE-BOOK.Hud.Title")}: ${statusLabel}</span>
      </div>
    `);

    control.on("click", async event => {
      event.preventDefault();
      const current = game.settings.get(MODULE_ID, "craftingWindowOpen");
      await game.settings.set(MODULE_ID, "craftingWindowOpen", !current);
    });

    const anchor = $("#players-active .players-list", html);
    if (anchor.length) control.insertAfter(anchor);
    else $(html).append(control);
  } catch (err) {
    console.error(`${MODULE_ID} | Falha ao injetar o controle na lista de jogadores`, err);
  }
});
