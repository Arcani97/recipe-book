import { MODULE_ID } from "../constants.js";
import { exportRecipes } from "../recipe-data.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

function downloadFile(content, filename, mimeType) {
  const saveFn = foundry.utils?.saveDataToFile ?? globalThis.saveDataToFile;
  if (typeof saveFn === "function") {
    saveFn(content, mimeType, filename);
    return;
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export class ExportRecipesApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "recipe-book-export-app",
    tag: "div",
    classes: ["recipe-book-export-app"],
    window: {
      title: "RECIPE-BOOK.Export.Title",
      icon: "fa-solid fa-file-export",
      resizable: false
    },
    position: { width: 420, height: "auto" },
    actions: {
      export: function (event, target) { return ExportRecipesApp._onExport.call(this, event, target); }
    }
  };

  static PARTS = {
    content: { template: `modules/${MODULE_ID}/templates/export-recipes.hbs` }
  };

  async _prepareContext(_options) {
    return { count: exportRecipes().length };
  }

  static _onExport() {
    try {
      const recipes = exportRecipes();
      const content = JSON.stringify(recipes, null, 2);
      downloadFile(content, "recipe-book-recipes.json", "application/json");
      ui.notifications.info(game.i18n.format("RECIPE-BOOK.Export.Success", { count: recipes.length }));
    } catch (err) {
      console.error(`${MODULE_ID} | Falha ao exportar`, err);
      ui.notifications.error(`${MODULE_ID}: falha ao exportar receitas — veja o console (F12).`);
    }
  }
}
