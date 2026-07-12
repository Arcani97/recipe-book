import { MODULE_ID } from "./constants.js";

/** Caminho (path) do campo de quantidade dentro do item, configurável nas configurações do módulo para funcionar com qualquer sistema. */
function getQuantityPath() {
  return game.settings.get(MODULE_ID, "quantityPath");
}

function getQuantity(item) {
  const path = getQuantityPath();
  const val = foundry.utils.getProperty(item, path);
  const num = Number(val);
  return Number.isFinite(num) ? num : 1;
}

async function setQuantity(item, value) {
  const path = getQuantityPath();
  return item.update({ [path]: value });
}

/** Verifica se um item do ator corresponde a uma referência de receita (ingrediente ou produto). Tenta casar por UUID de origem e, como último recurso, pelo nome do item. */
function itemMatchesRef(item, ref) {
  if (item.uuid === ref.uuid) return true;
  const sourceId = item.getFlag?.("core", "sourceId") ?? item._stats?.compendiumSource;
  if (sourceId && sourceId === ref.uuid) return true;
  if (ref.name && item.name?.trim().toLowerCase() === ref.name.trim().toLowerCase()) return true;
  return false;
}

function getMatchingItems(actor, ref) {
  return actor.items.filter(i => itemMatchesRef(i, ref));
}

/** Verifica (sem consumir nada) se o ator possui todos os ingredientes necessários para a receita. */
export function actorHasIngredients(actor, recipe) {
  return recipe.ingredients.every(ing => {
    const total = getMatchingItems(actor, ing).reduce((sum, i) => sum + getQuantity(i), 0);
    return total >= ing.quantity;
  });
}

/**
 * Executa o craft: valida a janela de tempo, valida ingredientes, consome-os e cria os itens de resultado no ator.
 * @returns {Promise<boolean>} sucesso ou falha
 */
export async function craftRecipe(actor, recipe) {
  if (!game.settings.get(MODULE_ID, "craftingWindowOpen")) {
    ui.notifications.warn(game.i18n.localize("RECIPE-BOOK.Errors.WindowClosed"));
    return false;
  }

  for (const ing of recipe.ingredients) {
    const total = getMatchingItems(actor, ing).reduce((sum, i) => sum + getQuantity(i), 0);
    if (total < ing.quantity) {
      ui.notifications.error(
        game.i18n.format("RECIPE-BOOK.Errors.MissingIngredient", { item: ing.name, actor: actor.name })
      );
      return false;
    }
  }

  for (const ing of recipe.ingredients) {
    let remaining = ing.quantity;
    const matches = getMatchingItems(actor, ing);
    for (const item of matches) {
      if (remaining <= 0) break;
      const qty = getQuantity(item);
      if (qty <= remaining) {
        remaining -= qty;
        await item.delete();
      } else {
        await setQuantity(item, qty - remaining);
        remaining = 0;
      }
    }
  }

  for (const res of recipe.results) {
    const existingMatches = getMatchingItems(actor, res);
    if (existingMatches.length) {
      // Já existe um item correspondente no inventário: soma na pilha existente em vez de criar uma cópia nova.
      const existing = existingMatches[0];
      await setQuantity(existing, getQuantity(existing) + res.quantity);
      continue;
    }

    const source = await fromUuid(res.uuid);
    if (!source) {
      ui.notifications.warn(game.i18n.format("RECIPE-BOOK.Errors.MissingSourceItem", { item: res.name }));
      continue;
    }
    const itemData = source.toObject();
    delete itemData._id;
    const path = getQuantityPath();
    if (foundry.utils.hasProperty(itemData, path)) {
      foundry.utils.setProperty(itemData, path, res.quantity);
    }
    await actor.createEmbeddedDocuments("Item", [itemData]);
  }

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<p>${game.i18n.format("RECIPE-BOOK.Chat.Crafted", { actor: actor.name, recipe: recipe.name })}</p>`
  });

  ui.notifications.info(game.i18n.format("RECIPE-BOOK.Notifications.CraftSuccess", { recipe: recipe.name }));
  return true;
}
