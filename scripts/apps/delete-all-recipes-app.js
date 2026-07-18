import { MODULE_ID } from "../constants.js";
import { getRecipes, saveRecipes } from "../recipe-data.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class DeleteAllRecipesApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "recipe-book-delete-all-app",
    tag: "div",
    classes: ["recipe-book-delete-all-app"],
    window: {
      title: "RECIPE-BOOK.DeleteAll.Title",
      icon: "fa-solid fa-trash",
      resizable: false
    },
    position: { width: 420, height: "auto" },
    actions: {
      "delete-all": function (event, target) { return DeleteAllRecipesApp._onDeleteAll.call(this, event, target); }
    }
  };

  static PARTS = {
    content: { template: `modules/${MODULE_ID}/templates/delete-all-recipes.hbs` }
  };

  async _prepareContext(_options) {
    return { count: getRecipes().length };
  }

  static async _onDeleteAll() {
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: game.i18n.localize("RECIPE-BOOK.DeleteAll.ConfirmTitle") },
      content: `<p>${game.i18n.localize("RECIPE-BOOK.DeleteAll.ConfirmContent")}</p>`
    });
    if (!confirmed) return;

    await saveRecipes([]);
    ui.notifications.info(game.i18n.localize("RECIPE-BOOK.DeleteAll.Success"));
    this.close();
  }
}
