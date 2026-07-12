import { MODULE_ID } from "./constants.js";

/**
 * Retorna uma cópia de todas as receitas salvas no mundo.
 * @returns {object[]}
 */
export function getRecipes() {
  return foundry.utils.deepClone(game.settings.get(MODULE_ID, "recipes"));
}

/**
 * Persiste a lista completa de receitas.
 * @param {object[]} recipes
 */
export async function saveRecipes(recipes) {
  return game.settings.set(MODULE_ID, "recipes", recipes);
}

/**
 * Busca uma receita pelo id.
 * @param {string} id
 */
export function getRecipe(id) {
  return getRecipes().find(r => r.id === id) ?? null;
}

/**
 * Cria uma nova receita.
 * @param {object} data
 */
export async function createRecipe(data) {
  const recipes = getRecipes();
  const recipe = {
    id: foundry.utils.randomID(),
    name: data.name ?? game.i18n.localize("RECIPE-BOOK.Editor.DefaultName"),
    img: data.img ?? "icons/svg/book.svg",
    description: data.description ?? "",
    ingredients: data.ingredients ?? [],
    results: data.results ?? [],
    assignedActorIds: data.assignedActorIds ?? [],
    tags: data.tags ?? []
  };
  recipes.push(recipe);
  await saveRecipes(recipes);
  return recipe;
}

/**
 * Atualiza uma receita existente.
 * @param {string} id
 * @param {object} changes
 */
export async function updateRecipe(id, changes) {
  const recipes = getRecipes();
  const idx = recipes.findIndex(r => r.id === id);
  if (idx === -1) return null;
  recipes[idx] = foundry.utils.mergeObject(recipes[idx], changes, { inplace: false });
  await saveRecipes(recipes);
  return recipes[idx];
}

/**
 * Remove uma receita.
 * @param {string} id
 */
export async function deleteRecipe(id) {
  const recipes = getRecipes().filter(r => r.id !== id);
  await saveRecipes(recipes);
}

/**
 * Retorna as receitas atribuídas a um ator específico.
 * @param {string} actorId
 */
export function getRecipesForActor(actorId) {
  return getRecipes().filter(r => r.assignedActorIds.includes(actorId));
}
