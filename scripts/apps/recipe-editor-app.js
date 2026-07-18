import { MODULE_ID } from "../constants.js";
import { createRecipe, updateRecipe, getRecipe } from "../recipe-data.js";
import { getPlayerCharacterGroups } from "../actor-groups.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

function commitProseMirror(proseMirror) {
  const saveButton = proseMirror?.querySelector('.editor-menu [data-action="save"]');
  if (saveButton) {
    saveButton.click();
  } else {
    proseMirror?.save?.();
  }
}

export class RecipeEditorApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static openInstances = new Set();

  static DEFAULT_OPTIONS = {
    id: "recipe-editor-app",
    tag: "div",
    classes: ["recipe-book", "recipe-editor-app"],
    window: {
      title: "RECIPE-BOOK.Editor.Title",
      icon: "fa-solid fa-flask",
      resizable: true
    },
    position: { width: 600, height: "auto" }
  };

  static PARTS = {
    content: { template: `modules/${MODULE_ID}/templates/recipe-editor.hbs` }
  };

  constructor({ recipeId = null, parentApp = null } = {}, options = {}) {
    super(options);
    this.parentApp = parentApp;
    this.recipeId = recipeId;
    const existing = recipeId ? getRecipe(recipeId) : null;
    this.data = existing
      ? foundry.utils.deepClone(existing)
      : {
          name: "",
          img: "icons/svg/book.svg",
          description: "",
          ingredients: [],
          results: [],
          assignedActorIds: [],
          tags: []
        };
    this._closeAfterSave = false;
  }

  async _prepareContext(_options) {
    const playerGroups = getPlayerCharacterGroups().map(group => ({
      ...group,
      actors: group.actors.map(a => ({ ...a, assigned: this.data.assignedActorIds.includes(a.id) }))
    }));
    const descriptionEnriched = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
      this.data.description ?? "",
      { secrets: true }
    );
    const recipe = { ...this.data, tagsInput: this.data.tags.join(", "), descriptionEnriched };
    return { recipe, playerGroups };
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    RecipeEditorApp.openInstances.add(this);

    const form = this.element.querySelector("form");
    form?.addEventListener("submit", ev => this._onFormSubmit(ev));

    this.element.querySelector(".recipe-img-picker")?.addEventListener("click", () => this._onPickImage());

    this.element.querySelectorAll("[data-drop]").forEach(zone => {
      zone.addEventListener("dragover", ev => ev.preventDefault());
      zone.addEventListener("dragenter", ev => ev.preventDefault());
      zone.addEventListener("drop", ev => this._onDropItem(ev, zone.dataset.drop));
    });

    this.element.querySelectorAll(".entry-quantity").forEach(input => {
      input.addEventListener("change", ev => {
        const list = ev.currentTarget.dataset.list;
        const idx = Number(ev.currentTarget.dataset.index);
        const val = Math.max(1, Number(ev.currentTarget.value) || 1);
        this.data[list][idx].quantity = val;
      });
    });

    this.element.querySelectorAll(".remove-entry").forEach(link => {
      link.addEventListener("click", ev => this._onRemoveEntry(ev));
    });

    const proseMirror = this.element.querySelector("prose-mirror[name='description']");
    proseMirror?.addEventListener("close", () => {
      if (proseMirror.value !== undefined) this.data.description = proseMirror.value;
      setTimeout(() => this.render(false), 0);
    });

    const submitButton = this.element.querySelector("button[type='submit']");
    submitButton?.addEventListener("click", () => {
      this._closeAfterSave = true;
    });
  }

  async close(options) {
    RecipeEditorApp.openInstances.delete(this);
    return super.close(options);
  }

  _commitDescriptionEditor() {
    const proseMirror = this.element.querySelector("prose-mirror[name='description']");
    if (!proseMirror) return;
    if (document.activeElement instanceof HTMLElement && proseMirror.contains(document.activeElement)) {
      document.activeElement.blur();
    }
    commitProseMirror(proseMirror);
    if (proseMirror.value !== undefined) this.data.description = proseMirror.value;
  }

  _syncSimpleFields() {
    const nameInput = this.element.querySelector("[name='name']");
    if (nameInput) this.data.name = nameInput.value;
    const tagsInput = this.element.querySelector("[name='tags']");
    if (tagsInput) {
      this.data.tags = [...new Set(tagsInput.value.split(",").map(t => t.trim()).filter(Boolean))];
    }
    const actorCheckboxes = this.element.querySelectorAll("input[type='checkbox'][name^='actor-']");
    if (actorCheckboxes.length) {
      this.data.assignedActorIds = Array.from(actorCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.name.replace(/^actor-/, ""));
    }
    this._commitDescriptionEditor();
  }

  async _onDropItem(event, list) {
    event.preventDefault();
    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData("text/plain"));
    } catch (e) {
      return;
    }
    if (!data?.uuid || data.type !== "Item") return;

    const existingEntry = this.data[list].find(entry => entry.uuid === data.uuid);
    if (existingEntry) {
      existingEntry.quantity += 1;
    } else {
      const item = await fromUuid(data.uuid);
      if (!item) return;
      this.data[list].push({
        uuid: data.uuid,
        name: item.name,
        img: item.img,
        quantity: 1
      });
    }
    this._syncSimpleFields();
    this.render();
  }

  _onRemoveEntry(event) {
    const target = event.currentTarget;
    const list = target.dataset.list;
    const idx = Number(target.dataset.index);
    this.data[list].splice(idx, 1);
    this._syncSimpleFields();
    this.render();
  }

  _onPickImage() {
    const FilePickerImpl = foundry.applications?.apps?.FilePicker?.implementation
      ?? foundry.applications?.apps?.FilePicker
      ?? FilePicker;
    const fp = new FilePickerImpl({
      type: "image",
      current: this.data.img,
      callback: path => {
        this.data.img = path;
        this._syncSimpleFields();
        this.render();
      }
    });
    fp.render(true);
  }

  async _onFormSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;

    if (document.activeElement instanceof HTMLElement && form.contains(document.activeElement)) {
      document.activeElement.blur();
    }
    form.querySelectorAll("prose-mirror").forEach(el => el.save?.());

    const FormDataExtendedImpl = foundry.applications?.ux?.FormDataExtended ?? FormDataExtended;
    const formData = new FormDataExtendedImpl(form);
    const data = foundry.utils.expandObject(formData.object);

    this.data.name = data.name?.trim() || game.i18n.localize("RECIPE-BOOK.Editor.DefaultName");
    if (data.description !== undefined) this.data.description = data.description;
    this.data.tags = [...new Set(
      (data.tags ?? "")
        .split(",")
        .map(t => t.trim())
        .filter(Boolean)
    )];
    this.data.assignedActorIds = game.actors
      .filter(a => data[`actor-${a.id}`])
      .map(a => a.id);

    if (this.recipeId) {
      const updated = await updateRecipe(this.recipeId, this.data);
      if (!updated) {
        ui.notifications.error(game.i18n.localize("RECIPE-BOOK.Errors.RecipeNoLongerExists"));
        this.close();
        return;
      }
    } else {
      const created = await createRecipe(this.data);
      this.recipeId = created.id;
    }
    this.parentApp?.render(false);

    if (this._closeAfterSave) {
      this._closeAfterSave = false;
      this.close();
    } else {
      this.render(false);
    }
  }
}
