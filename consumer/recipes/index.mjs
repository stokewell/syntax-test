import { appRecipe } from './app.mjs';
import { blankRecipe } from './blank.mjs';
import { portfolioRecipe } from './portfolio.mjs';
import { productRecipe } from './product.mjs';

const recipes = new Map([
  [blankRecipe.id, blankRecipe],
  [portfolioRecipe.id, portfolioRecipe],
  [productRecipe.id, productRecipe],
  [appRecipe.id, appRecipe],
]);

export const PUBLIC_RECIPE_IDS = Object.freeze([...recipes.keys()]);

export function getRecipe(id) {
  const recipe = recipes.get(id);
  if (!recipe) throw new Error(`Public recipe ${String(id)} is not implemented yet.`);
  return recipe;
}

export function listRecipes() {
  return [...recipes.values()].map((recipe) => ({
    id: recipe.id,
    version: recipe.version,
    label: recipe.label,
    description: recipe.description,
    visualDirections: [...recipe.visualDirections],
    compatibleFeatures: [...recipe.compatibleFeatures],
  }));
}

export { appRecipe, blankRecipe, portfolioRecipe, productRecipe };
