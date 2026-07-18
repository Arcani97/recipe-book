import { MODULE_ID } from "./constants.js";
import { log } from "./debug.js";

export function getRecipes() {
  return foundry.utils.deepClone(game.settings.get(MODULE_ID, "recipes"));
}

export async function saveRecipes(recipes) {
  return game.settings.set(MODULE_ID, "recipes", recipes);
}

export function getRecipe(id) {
  return getRecipes().find(r => r.id === id) ?? null;
}

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
    tags: data.tags ?? [],
    importId: data.importId ?? null
  };
  recipes.push(recipe);
  await saveRecipes(recipes);
  return recipe;
}

export async function updateRecipe(id, changes) {
  const recipes = getRecipes();
  const idx = recipes.findIndex(r => r.id === id);
  if (idx === -1) return null;
  recipes[idx] = foundry.utils.mergeObject(recipes[idx], changes, { inplace: false });
  await saveRecipes(recipes);
  return recipes[idx];
}

export async function deleteRecipe(id) {
  const recipes = getRecipes().filter(r => r.id !== id);
  await saveRecipes(recipes);
}

export function getRecipesForActor(actorId) {
  return getRecipes().filter(r => r.assignedActorIds.includes(actorId));
}

export async function importRecipes(entries, { source, overwrite = false } = {}) {
  if (!game.user.isGM) {
    return { imported: 0, updated: 0, skipped: 0, errors: ["Apenas o Mestre pode importar receitas."] };
  }
  if (!source) {
    return { imported: 0, updated: 0, skipped: 0, errors: ['É necessário informar "source".'] };
  }

  const existingByImportId = new Map(
    getRecipes().filter(r => r.importId).map(r => [r.importId, r])
  );

  let imported = 0;
  let updated = 0;
  let skipped = 0;
  const errors = [];

  for (const entry of Array.isArray(entries) ? entries : []) {
    if (!entry?.name) {
      errors.push('Uma entrada sem "name" foi ignorada.');
      continue;
    }

    const importId = `${source}::${entry.id ?? _slugify(entry.name)}`;
    const existing = existingByImportId.get(importId);
    if (existing && !overwrite) {
      skipped++;
      continue;
    }

    const ingredients = await _resolveImportRefs(entry.ingredients, entry.name, "ingrediente", errors);
    const results = await _resolveImportRefs(entry.results, entry.name, "produto", errors);
    if (!ingredients || !results || !ingredients.length || !results.length) continue;

    const recipeData = {
      name: entry.name,
      img: results[0].img,
      description: entry.description ?? "",
      tags: entry.tags ?? [],
      ingredients,
      results,
      importId
    };

    if (existing) {
      await updateRecipe(existing.id, recipeData);
      updated++;
    } else {
      await createRecipe(recipeData);
      imported++;
    }
  }

  const summary = { imported, updated, skipped, errors };
  log(`importRecipes: ${imported} importadas, ${updated} atualizadas, ${skipped} já existiam, ${errors.length} erro(s)`);
  return summary;
}

async function _resolveImportRefs(refs, recipeName, kind, errors) {
  const resolved = [];
  for (const ref of Array.isArray(refs) ? refs : []) {
    if (!ref?.uuid) {
      errors.push(`Receita "${recipeName}": um ${kind} sem "uuid" impediu a importação.`);
      return null;
    }
    const doc = await fromUuid(ref.uuid);
    if (!doc || doc.documentName !== "Item") {
      errors.push(`Receita "${recipeName}": não foi possível encontrar o item "${ref.name ?? ref.uuid}" (${kind}).`);
      return null;
    }
    resolved.push({
      uuid: ref.uuid,
      name: doc.name,
      img: doc.img,
      quantity: Math.max(1, Number(ref.quantity) || 1)
    });
  }
  return resolved;
}

function _slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function exportRecipes() {
  const exported = getRecipes().map(r => ({
    id: r.importId ? r.importId.split("::").slice(1).join("::") : _slugify(r.name),
    name: r.name,
    tags: r.tags ?? [],
    description: r.description ?? "",
    ingredients: (r.ingredients ?? []).map(i => ({ uuid: i.uuid, name: i.name, quantity: i.quantity })),
    results: (r.results ?? []).map(i => ({ uuid: i.uuid, name: i.name, quantity: i.quantity }))
  }));
  log(`exportRecipes: ${exported.length} receitas exportadas`);
  return exported;
}
