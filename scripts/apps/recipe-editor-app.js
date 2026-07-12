import { MODULE_ID } from "../constants.js";
import { createRecipe, updateRecipe, getRecipe } from "../recipe-data.js";
import { getPlayerCharacterGroups } from "../actor-groups.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Log de diagnóstico padronizado. Remover/comentar depois de terminar
 * de investigar o comportamento do editor de texto rico.
 */
function logAction(label, data) {
  if (data !== undefined) {
    console.log(`${MODULE_ID} | [log] ${label}`, data);
  } else {
    console.log(`${MODULE_ID} | [log] ${label}`);
  }
}

/**
 * Confirma no editor de texto rico o conteúdo digitado. Em vez de
 * chamar o método .save() diretamente (que nem sempre disparava o
 * mesmo caminho interno que um clique real), simula um clique de
 * verdade no botão de salvar (disquete) da barra de ferramentas do
 * próprio editor — a mesma ação que confirmamos funcionar sempre.
 */
function commitProseMirror(proseMirror) {
  const saveButton = proseMirror?.querySelector('.editor-menu [data-action="save"]');
  if (saveButton) {
    logAction("commitProseMirror: clicando no botão salvar interno do editor");
    saveButton.click();
  } else {
    logAction("commitProseMirror: botão salvar interno não encontrado, chamando .save() como alternativa");
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
    this.data.tags = this.data.tags ?? []; // compatibilidade com receitas antigas
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

  /**
   * Toda a interatividade desta janela (formulário, arrastar itens,
   * seletor de imagem, remover entradas) é conectada aqui na mão, com
   * addEventListener puro — em vez de usar a configuração "form" /
   * "actions" do ApplicationV2. Isso é deliberado: é mais código, mas
   * não depende de nenhum mecanismo interno do framework que não
   * conseguimos testar diretamente.
   */
  async _onRender(context, options) {
    await super._onRender(context, options);
    RecipeEditorApp.openInstances.add(this);
    logAction("_onRender executado, this.data.description atual:", this.data.description);

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
        logAction(`quantidade alterada (${list}[${idx}]):`, val);
      });
    });

    this.element.querySelectorAll(".remove-entry").forEach(link => {
      link.addEventListener("click", ev => this._onRemoveEntry(ev));
    });

    this.element.querySelector("[name='name']")?.addEventListener("input", ev => {
      logAction("campo Nome alterado (input):", ev.currentTarget.value);
    });

    this.element.querySelector("[name='tags']")?.addEventListener("input", ev => {
      logAction("campo Tags alterado (input):", ev.currentTarget.value);
    });

    this.element.querySelectorAll("input[type='checkbox'][name^='actor-']").forEach(cb => {
      cb.addEventListener("change", ev => {
        logAction(`checkbox ${ev.currentTarget.name} alterado:`, ev.currentTarget.checked);
      });
    });

    // Eventos nativos do próprio elemento <prose-mirror>. "save" é o
    // mais importante: dispara quando o botão de salvar (disquete) da
    // barra de ferramentas interna do editor é clicado.
    const proseMirror = this.element.querySelector("prose-mirror[name='description']");
    if (proseMirror) {
      proseMirror.addEventListener("open", () => {
        logAction("evento 'open' do <prose-mirror> disparado (editor ativado)");
      });
      proseMirror.addEventListener("close", () => {
        logAction("evento 'close' do <prose-mirror> disparado (editor fechado). .value agora:", proseMirror.value);
        // O elemento, ao fechar, mostra o conteúdo que veio do template
        // original (calculado quando a janela abriu) — não o texto que
        // acabou de ser salvo internamente. Sincronizamos e
        // re-renderizamos a janela pra visualização "fechada" refletir
        // o texto novo, mesmo que a receita em si ainda não tenha sido
        // salva (isso só acontece ao clicar em Salvar, lá embaixo).
        if (proseMirror.value !== undefined) this.data.description = proseMirror.value;
        setTimeout(() => this.render(false), 0);
      });
      proseMirror.addEventListener("save", () => {
        logAction("evento 'save' do <prose-mirror> disparado (botão salvar interno). .value agora:", proseMirror.value);
      });
    } else {
      logAction("ATENÇÃO: elemento <prose-mirror name='description'> não encontrado no render.");
    }

    // O botão de salvar principal fecha a janela ao terminar; qualquer
    // outro jeito de disparar o envio do formulário (ex.: apertar
    // Enter num campo) não deve fechar a janela toda, só persistir.
    const submitButton = this.element.querySelector("button[type='submit']");
    submitButton?.addEventListener("click", () => {
      logAction("botão Save principal clicado");
      this._closeAfterSave = true;
    });
  }

  async close(options) {
    RecipeEditorApp.openInstances.delete(this);
    return super.close(options);
  }

  /**
   * Força o campo em foco a perder o foco, e chama .save() no editor
   * de texto rico para garantir que a última alteração digitada seja
   * sincronizada com o valor "oficial" do elemento antes de lermos.
   */
  _commitDescriptionEditor() {
    const proseMirror = this.element.querySelector("prose-mirror[name='description']");
    if (!proseMirror) {
      logAction("_commitDescriptionEditor: <prose-mirror> não encontrado");
      return;
    }
    if (document.activeElement instanceof HTMLElement && proseMirror.contains(document.activeElement)) {
      logAction("_commitDescriptionEditor: havia foco dentro do editor, forçando blur()");
      document.activeElement.blur();
    }
    commitProseMirror(proseMirror);
    if (proseMirror.value !== undefined) this.data.description = proseMirror.value;
    logAction("_commitDescriptionEditor: this.data.description final:", this.data.description);
  }

  /**
   * Lê os campos de Nome, Tags e os personagens marcados diretamente
   * do formulário atual e grava em this.data. Necessário porque ações
   * como arrastar um ingrediente, remover uma entrada ou trocar a
   * imagem re-renderizam a janela para atualizar a lista — e como
   * esses campos só são gravados em this.data no envio do formulário,
   * qualquer edição ainda não salva (incluindo checkboxes marcados)
   * se perderia nesse re-render sem essa sincronização.
   */
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
    logAction(`item arrastado para ${list}:`, data.uuid);

    // Se esse item já está na lista, só incrementa a quantidade em vez
    // de criar uma entrada duplicada.
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
    logAction("depois do drop, this.data.description:", this.data.description);
    this.render();
  }

  _onRemoveEntry(event) {
    const target = event.currentTarget;
    const list = target.dataset.list;
    const idx = Number(target.dataset.index);
    logAction(`removendo entrada ${list}[${idx}]`);
    this.data[list].splice(idx, 1);
    this._syncSimpleFields();
    logAction("depois de remover, this.data.description:", this.data.description);
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
        logAction("imagem selecionada:", path);
        this.data.img = path;
        this._syncSimpleFields();
        logAction("depois de trocar imagem, this.data.description:", this.data.description);
        this.render();
      }
    });
    fp.render(true);
  }

  async _onFormSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    logAction("_onFormSubmit iniciado. this.data.description no início:", this.data.description);

    // Se o cursor ainda estiver dentro do editor de texto (ou qualquer
    // outro campo) no momento do clique em Salvar, a última coisa
    // digitada pode não ter sido sincronizada com o estado interno do
    // editor ainda. Forçar a perda de foco garante essa sincronização
    // antes de chamarmos .save().
    if (document.activeElement instanceof HTMLElement && form.contains(document.activeElement)) {
      logAction("_onFormSubmit: havia foco em um campo do formulário, forçando blur()", document.activeElement.tagName);
      document.activeElement.blur();
    }

    // O editor de texto rico só grava o que foi digitado no seu valor
    // "oficial" (usado pelo formulário) quando .save() é chamado nele —
    // digitar sozinho não é suficiente.
    form.querySelectorAll("prose-mirror").forEach(el => {
      el.save?.();
      logAction("_onFormSubmit: .save() chamado no <prose-mirror>. .value agora:", el.value);
    });

    const FormDataExtendedImpl = foundry.applications?.ux?.FormDataExtended ?? FormDataExtended;
    const formData = new FormDataExtendedImpl(form);
    const data = foundry.utils.expandObject(formData.object);
    logAction("_onFormSubmit: data.description lido do FormData:", data.description);

    this.data.name = data.name?.trim() || game.i18n.localize("RECIPE-BOOK.Editor.DefaultName");
    if (data.description !== undefined) this.data.description = data.description;
    logAction("_onFormSubmit: this.data.description após combinar com FormData:", this.data.description);
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
      logAction("_onFormSubmit: chamando updateRecipe com this.data:", foundry.utils.deepClone(this.data));
      const updated = await updateRecipe(this.recipeId, this.data);
      logAction("_onFormSubmit: updateRecipe retornou:", updated);
      if (!updated) {
        // A receita foi excluída (por esta ou outra janela) enquanto
        // este editor estava aberto — avisa em vez de falhar em
        // silêncio, e fecha a janela já que não há mais o que editar.
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
