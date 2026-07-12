import { MODULE_ID } from "../constants.js";

export class CraftingHud extends Application {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "recipe-book-crafting-hud",
      title: game.i18n.localize("RECIPE-BOOK.Hud.Title"),
      template: `modules/${MODULE_ID}/templates/crafting-hud.hbs`,
      width: 260,
      height: "auto",
      resizable: false,
      minimizable: true,
      popOut: true,
      classes: ["recipe-book", "crafting-hud"]
    });
  }

  getData() {
    return {
      windowOpen: game.settings.get(MODULE_ID, "craftingWindowOpen")
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find("[data-action='toggle']").on("click", async () => {
      const current = game.settings.get(MODULE_ID, "craftingWindowOpen");
      await game.settings.set(MODULE_ID, "craftingWindowOpen", !current);
      this.render(false);
    });
  }

  /** Mantém a posição no canto inferior direito na primeira abertura. */
  setPosition(options = {}) {
    if (this._hasSetInitialPosition) return super.setPosition(options);
    this._hasSetInitialPosition = true;
    const margin = 16;
    options.left = options.left ?? window.innerWidth - 260 - margin;
    options.top = options.top ?? window.innerHeight - 200 - margin;
    return super.setPosition(options);
  }
}
