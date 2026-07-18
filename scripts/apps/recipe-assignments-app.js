import { MODULE_ID } from "../constants.js";
import { getRecipes, updateRecipe } from "../recipe-data.js";
import { getPlayerCharacterGroups } from "../actor-groups.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

async function promptForActor(title) {
  const allPlayerGroups = getPlayerCharacterGroups();
  const options = allPlayerGroups
    .flatMap(pg => pg.actors.map(a => `<option value="${a.id}">${a.name} (${pg.userName})</option>`))
    .join("");

  return foundry.applications.api.DialogV2.prompt({
    window: { title },
    content: `
      <div class="form-group">
        <select name="actorId">
          <option value="">${game.i18n.localize("RECIPE-BOOK.Assignments.AllCharacters")}</option>
          ${options}
        </select>
      </div>
    `,
    ok: {
      label: game.i18n.localize("RECIPE-BOOK.Assignments.Confirm"),
      callback: (event, button) => button.form.elements.actorId.value
    },
    rejectClose: false
  });
}

async function bulkAssign(actorId, add) {
  const allPlayerGroups = getPlayerCharacterGroups();
  const allActorIds = allPlayerGroups.flatMap(pg => pg.actors.map(a => a.id));
  const targets = actorId ? [actorId] : allActorIds;
  const recipes = getRecipes();

  for (const recipe of recipes) {
    const assignedActorIds = add
      ? [...new Set([...recipe.assignedActorIds, ...targets])]
      : recipe.assignedActorIds.filter(id => !targets.includes(id));
    await updateRecipe(recipe.id, { assignedActorIds });
  }
}

export class RecipeAssignmentsApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "recipe-assignments-app",
    tag: "div",
    classes: ["recipe-book", "recipe-assignments-app"],
    window: {
      title: "RECIPE-BOOK.Assignments.Title",
      icon: "fa-solid fa-users",
      resizable: true
    },
    position: { width: 480, height: 600 },
    actions: {
      "assign-all": function (event, target) { return RecipeAssignmentsApp._onAssignAll.call(this, event, target); },
      "unassign-all": function (event, target) { return RecipeAssignmentsApp._onUnassignAll.call(this, event, target); }
    }
  };

  static PARTS = {
    content: { template: `modules/${MODULE_ID}/templates/recipe-assignments.hbs` }
  };

  constructor({ parentApp = null } = {}, options = {}) {
    super(options);
    this.parentApp = parentApp;
    this._openState = null;
  }

  async _prepareContext(_options) {
    const allRecipes = getRecipes();
    const allPlayerGroups = getPlayerCharacterGroups();

    const buildRecipeRow = recipe => ({
      id: recipe.id,
      name: recipe.name,
      playerGroups: allPlayerGroups.map(pg => ({
        userId: pg.userId,
        userName: pg.userName,
        actors: pg.actors.map(a => ({
          id: a.id,
          name: a.name,
          assigned: recipe.assignedActorIds.includes(a.id)
        }))
      }))
    });

    const sections = allPlayerGroups
      .map(pg => ({
        label: pg.userName,
        recipes: allRecipes
          .filter(r => pg.actors.some(a => r.assignedActorIds.includes(a.id)))
          .map(buildRecipeRow)
      }))
      .filter(section => section.recipes.length)
      .sort((a, b) => a.label.localeCompare(b.label));

    const unassignedRecipes = allRecipes
      .filter(r => !allPlayerGroups.some(pg => pg.actors.some(a => r.assignedActorIds.includes(a.id))))
      .map(buildRecipeRow);

    if (unassignedRecipes.length) {
      sections.push({
        label: game.i18n.localize("RECIPE-BOOK.Assignments.Unassigned"),
        recipes: unassignedRecipes
      });
    }

    return { sections };
  }

  _captureOpenState() {
    const state = { sections: {}, recipes: {} };
    this.element.querySelectorAll("details.player-section").forEach(el => {
      const label = el.querySelector(":scope > summary")?.textContent?.trim();
      if (label) state.sections[label] = el.open;
    });
    this.element.querySelectorAll("details.recipe-row").forEach(el => {
      const id = el.querySelector("input[type='checkbox']")?.dataset.recipeId;
      if (id) state.recipes[id] = el.open;
    });
    return state;
  }

  _restoreOpenState(state) {
    this.element.querySelectorAll("details.player-section").forEach(el => {
      const label = el.querySelector(":scope > summary")?.textContent?.trim();
      if (label && label in state.sections) el.open = state.sections[label];
    });
    this.element.querySelectorAll("details.recipe-row").forEach(el => {
      const id = el.querySelector("input[type='checkbox']")?.dataset.recipeId;
      if (id && id in state.recipes) el.open = state.recipes[id];
    });
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    this.element.querySelectorAll("input[type='checkbox'][data-recipe-id]").forEach(cb => {
      cb.addEventListener("change", ev => this._onToggleAssignment(ev));
    });
    if (this._openState) {
      this._restoreOpenState(this._openState);
      this._openState = null;
    }
  }

  async _onToggleAssignment(event) {
    const recipeId = event.currentTarget.dataset.recipeId;
    const actorId = event.currentTarget.dataset.actorId;
    const recipe = getRecipes().find(r => r.id === recipeId);
    if (!recipe) return;

    const assignedActorIds = event.currentTarget.checked
      ? [...new Set([...recipe.assignedActorIds, actorId])]
      : recipe.assignedActorIds.filter(id => id !== actorId);

    this._openState = this._captureOpenState();
    await updateRecipe(recipeId, { assignedActorIds });
    this.parentApp?.render(false);
    this.render(false);
  }

  static async _onAssignAll() {
    const actorId = await promptForActor(game.i18n.localize("RECIPE-BOOK.Assignments.AssignAllTitle"));
    if (actorId === null || actorId === undefined) return;
    await bulkAssign(actorId, true);
    this.parentApp?.render(false);
    this.render(false);
  }

  static async _onUnassignAll() {
    const actorId = await promptForActor(game.i18n.localize("RECIPE-BOOK.Assignments.UnassignAllTitle"));
    if (actorId === null || actorId === undefined) return;
    await bulkAssign(actorId, false);
    this.parentApp?.render(false);
    this.render(false);
  }
}
