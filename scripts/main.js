import { MODULE_ID } from "./constants.js";
import { RecipeBookApp } from "./apps/recipe-book-app.js";
import { RecipeEditorApp } from "./apps/recipe-editor-app.js";

Hooks.once("init", () => {
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
      // Atualiza o controle integrado à lista de jogadores (GM).
      ui.players?.render();
    }
  });

  // Configurável porque cada sistema de jogo guarda a quantidade do item
  // em um campo diferente (dnd5e e a maioria dos sistemas usam "system.quantity").
  game.settings.register(MODULE_ID, "quantityPath", {
    name: "RECIPE-BOOK.Settings.QuantityPath.Name",
    hint: "RECIPE-BOOK.Settings.QuantityPath.Hint",
    scope: "world",
    config: true,
    type: String,
    default: "system.quantity"
  });
});

Hooks.on("updateSetting", setting => {
  if (setting?.key !== `${MODULE_ID}.recipes`) return;
  for (const app of RecipeBookApp.openInstances) app.render(false);
});

Hooks.once("ready", () => {
  const mod = game.modules.get(MODULE_ID);
  // Exposto para quem quiser abrir via macro:
  // game.modules.get("recipe-book").api.RecipeBookApp
  mod.api = { RecipeBookApp, RecipeEditorApp };
});

/**
 * Abre o Livro de Receitas — mas, se quem está tentando abrir for um
 * jogador sem nenhum personagem próprio, mostra um aviso em vez de
 * abrir a janela (não faz sentido um jogador sem personagem usar o
 * livro, já que craftar sempre precisa de um personagem dono).
 */
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

/**
 * Adiciona um botão no topo da aba de Itens da barra lateral (acima de
 * "Create Item"/"Create Folder") para abrir o Livro de Receitas — no
 * mesmo estilo que o módulo Party Resources faz na aba de Atores —
 * em vez de um ícone na barra de ferramentas do canvas.
 */
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

/**
 * Integra o controle de abrir/fechar a Janela de Criação diretamente
 * na lista de jogadores nativa do Foundry (o painel que mostra quem
 * está online, no canto inferior esquerdo) — no mesmo estilo que
 * módulos como o Breaktime fazem, em vez de uma janela flutuante à
 * parte. Só aparece para o Mestre; jogadores não veem nada aqui.
 */
Hooks.on("renderPlayers", (app, html) => {
  if (!game.user.isGM) return;

  try {
    // Evita duplicar o controle em re-renderizações.
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

    // Mesmo seletor usado pelo módulo Breaktime para se inserir na
    // lista de jogadores: "#players-active .players-list".
    const anchor = $("#players-active .players-list", html);
    if (anchor.length) control.insertAfter(anchor);
    else $(html).append(control);
  } catch (err) {
    console.error(`${MODULE_ID} | Falha ao injetar o controle na lista de jogadores`, err);
  }
});
