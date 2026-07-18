import { MODULE_ID } from "../constants.js";
import { getRecipes, deleteRecipe } from "../recipe-data.js";
import { craftRecipe, actorHasIngredients } from "../crafting-logic.js";
import { getPlayerCharacterGroups } from "../actor-groups.js";
import { RecipeEditorApp } from "./recipe-editor-app.js";
import { RecipeAssignmentsApp } from "./recipe-assignments-app.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class RecipeBookApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static openInstances = new Set();

  static DEFAULT_OPTIONS = {
    id: "recipe-book-app",
    tag: "div",
    classes: ["recipe-book", "recipe-book-app"],
    window: {
      title: "RECIPE-BOOK.App.Title",
      icon: "fa-solid fa-book-open-cover",
      resizable: true
    },
    position: { width: 760, height: 620 },
    actions: {
      "select-recipe": function (event, target) { return RecipeBookApp._onSelectRecipe.call(this, event, target); },
      "new-recipe": function (event, target) { return RecipeBookApp._onNewRecipe.call(this, event, target); },
      "edit-recipe": function (event, target) { return RecipeBookApp._onEditRecipe.call(this, event, target); },
      "delete-recipe": function (event, target) { return RecipeBookApp._onDeleteRecipe.call(this, event, target); },
      craft: function (event, target) { return RecipeBookApp._onCraft.call(this, event, target); },
      "select-actor": function (event, target) { return RecipeBookApp._onSelectActor.call(this, event, target); },
      "open-actor-sheet": function (event, target) { return RecipeBookApp._onOpenActorSheet.call(this, event, target); },
      "collapse-all": function (event, target) { return RecipeBookApp._onCollapseAll.call(this, event, target); },
      "expand-all": function (event, target) { return RecipeBookApp._onExpandAll.call(this, event, target); },
      "toggle-crafting-window": function (event, target) { return RecipeBookApp._onToggleCraftingWindow.call(this, event, target); },
      "open-assignments": function (event, target) { return RecipeBookApp._onOpenAssignments.call(this, event, target); }
    }
  };

  static PARTS = {
    content: { template: `modules/${MODULE_ID}/templates/recipe-book.hbs` }
  };

  selectedRecipeId = null;
  selectedActorId = null;

  async _prepareContext(_options) {
    const isGM = game.user.isGM;
    const windowOpen = game.settings.get(MODULE_ID, "craftingWindowOpen");
    const allRecipes = getRecipes();
    const myActors = game.actors.filter(a => a.isOwner);

    let recipes;
    let selectedActor = null;
    let myActorsForSwitcher = [];

    if (isGM) {
      recipes = allRecipes.map(r => ({
        ...r,
        assignedGroups: getPlayerCharacterGroups(r.assignedActorIds)
      }));
    } else {
      if (!this.selectedActorId || !myActors.some(a => a.id === this.selectedActorId)) {
        const lastActorId = game.user.getFlag(MODULE_ID, "lastSelectedActorId");
        this.selectedActorId = myActors.some(a => a.id === lastActorId) ? lastActorId : myActors[0]?.id ?? null;
      }
      selectedActor = myActors.find(a => a.id === this.selectedActorId) ?? null;
      myActorsForSwitcher = myActors.map(a => ({
        id: a.id,
        name: a.name,
        selected: a.id === this.selectedActorId
      }));

      recipes = selectedActor
        ? allRecipes
            .filter(r => r.assignedActorIds.includes(selectedActor.id))
            .map(r => ({ ...r, canCraft: actorHasIngredients(selectedActor, r) }))
        : [];
    }

    if (this.selectedRecipeId && !recipes.some(r => r.id === this.selectedRecipeId)) {
      this.selectedRecipeId = null;
    }
    if (!this.selectedRecipeId && recipes.length) this.selectedRecipeId = recipes[0].id;
    const selected = recipes.find(r => r.id === this.selectedRecipeId) ?? null;

    const recipesWithFlag = recipes.map(r => ({ ...r, active: r.id === this.selectedRecipeId }));
    const groups = this._groupByTag(recipesWithFlag);

    return {
      isGM,
      windowOpen,
      groups,
      selected,
      selectedActor,
      myActorsForSwitcher,
      hasMultipleActors: myActorsForSwitcher.length > 1
    };
  }

  _groupByTag(recipes) {
    const byTag = new Map();
    const untagged = [];

    for (const r of recipes) {
      if (!r.tags?.length) {
        untagged.push(r);
        continue;
      }
      for (const tag of r.tags) {
        if (!byTag.has(tag)) byTag.set(tag, []);
        byTag.get(tag).push(r);
      }
    }

    const groups = [...byTag.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([tag, list]) => ({ tag, recipes: list }));

    if (untagged.length) groups.push({ tag: null, recipes: untagged });
    return groups;
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    RecipeBookApp.openInstances.add(this);
  }

  async close(options) {
    RecipeBookApp.openInstances.delete(this);
    return super.close(options);
  }

  static _onSelectRecipe(_event, target) {
    this.selectedRecipeId = target.dataset.id;
    this.render(false);
  }

  static _onNewRecipe() {
    new RecipeEditorApp({ recipeId: null, parentApp: this }).render(true);
  }

  static _onEditRecipe(event, target) {
    event.stopPropagation();
    new RecipeEditorApp({ recipeId: target.dataset.id, parentApp: this }).render(true);
  }

  static async _onDeleteRecipe(event, target) {
    event.stopPropagation();
    const id = target.dataset.id;
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: game.i18n.localize("RECIPE-BOOK.Dialogs.DeleteTitle") },
      content: `<p>${game.i18n.localize("RECIPE-BOOK.Dialogs.DeleteContent")}</p>`
    });
    if (!confirmed) return;
    await deleteRecipe(id);

    for (const editor of RecipeEditorApp.openInstances) {
      if (editor.recipeId === id) {
        ui.notifications.warn(game.i18n.localize("RECIPE-BOOK.Errors.RecipeNoLongerExists"));
        editor.close();
      }
    }

    this.selectedRecipeId = null;
    this.render(false);
  }

  static async _onCraft(_event, target) {
    target.disabled = true;
    const actor = game.actors.get(this.selectedActorId);
    const recipe = getRecipes().find(r => r.id === target.dataset.recipeId);
    if (actor && recipe) await craftRecipe(actor, recipe);
    this.render(false);
  }

  static async _onSelectActor(_event, target) {
    this.selectedActorId = target.dataset.actorId;
    await game.user.setFlag(MODULE_ID, "lastSelectedActorId", this.selectedActorId);
    this.render(false);
  }

  static _onOpenActorSheet(_event, target) {
    const actor = game.actors.get(target.dataset.actorId);
    actor?.sheet?.render(true);
  }

  static _onCollapseAll() {
    this.element.querySelectorAll("details.tag-group").forEach(el => (el.open = false));
  }

  static _onExpandAll() {
    this.element.querySelectorAll("details.tag-group").forEach(el => (el.open = true));
  }

  static async _onToggleCraftingWindow() {
    if (!game.user.isGM) return;
    const current = game.settings.get(MODULE_ID, "craftingWindowOpen");
    await game.settings.set(MODULE_ID, "craftingWindowOpen", !current);
  }

  static _onOpenAssignments() {
    new RecipeAssignmentsApp({ parentApp: this }).render(true);
  }
}
