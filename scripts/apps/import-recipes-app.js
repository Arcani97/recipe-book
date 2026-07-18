import { MODULE_ID } from "../constants.js";
import { importRecipes } from "../recipe-data.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class ImportRecipesApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "recipe-book-import-app",
    tag: "div",
    classes: ["recipe-book-import-app"],
    window: {
      title: "RECIPE-BOOK.Import.Title",
      icon: "fa-solid fa-file-import",
      resizable: false
    },
    position: { width: 480, height: "auto" },
    actions: {
      browse: function (event, target) { return ImportRecipesApp._onBrowse.call(this, event, target); },
      import: function (event, target) { return ImportRecipesApp._onImport.call(this, event, target); }
    }
  };

  static PARTS = {
    content: { template: `modules/${MODULE_ID}/templates/import-recipes.hbs` }
  };

  result = null;

  async _prepareContext(_options) {
    return { result: this.result };
  }

  static _onBrowse() {
    try {
      const input = this.element.querySelector("input[name='filePath']");
      const FilePickerImpl = foundry.applications?.apps?.FilePicker?.implementation
        ?? foundry.applications?.apps?.FilePicker
        ?? FilePicker;

      const fp = new FilePickerImpl({
        type: "text",
        current: input?.value ?? "",
        callback: path => {
          if (input) input.value = path;
        }
      });
      fp.render(true);
    } catch (err) {
      console.error(`${MODULE_ID} | Falha ao abrir o seletor de arquivo`, err);
      ui.notifications.error(`${MODULE_ID}: falha ao abrir o seletor de arquivo — veja o console (F12).`);
    }
  }

  static async _onImport(event, target) {
    const input = this.element.querySelector("input[name='filePath']");
    const path = input?.value?.trim();
    const overwrite = this.element.querySelector("input[name='overwrite']")?.checked ?? false;

    if (!path) {
      this.result = { imported: 0, updated: 0, skipped: 0, errors: [game.i18n.localize("RECIPE-BOOK.Import.NoPathGiven")] };
      this.render(false);
      return;
    }

    target.disabled = true;

    try {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`fetch retornou status ${response.status} para "${path}"`);
      const data = await response.json();
      this.result = await importRecipes(data, { source: path, overwrite });
    } catch (err) {
      console.error(`${MODULE_ID} | Falha ao importar`, err);
      this.result = { imported: 0, updated: 0, skipped: 0, errors: [`${game.i18n.localize("RECIPE-BOOK.Import.NoFileFound")} (${err.message})`] };
    }

    this.render(false);
  }
}
