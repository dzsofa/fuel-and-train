import { NUTRITION_DB } from './nutrition';
import type { Recipe, Ingredient, MacrosPerServing } from './types';

export function scaleRecipe(recipe: Recipe, targetServings: number): Recipe {
  if (targetServings <= 0) {
    throw new Error('Target serving size should be larger than 0');
  }

  const scaleFactor = targetServings / recipe.servings;

  return {
    name: recipe.name,
    servings: targetServings,
    ingredients: recipe.ingredients.map((ingredient) => ({
      name: ingredient.name,
      amount_g: ingredient.amount_g * scaleFactor
    })),
    steps: recipe.steps,
    macros_per_serving: { ...recipe.macros_per_serving }
  };
}

export function estimateMacros(
  ingredients: Ingredient[],
  servings: number
): MacrosPerServing {
  if (servings <= 0) {
    throw new Error('Servings should be larger than 0');
  }

  const totals = ingredients.reduce(
    (acc, { name, amount_g }) => {
      const entry = NUTRITION_DB[name];
      if (!entry) return acc;

      const factor = amount_g / 100;
      return {
        protein_g: acc.protein_g + entry.protein_g * factor,
        carbs_g: acc.carbs_g + entry.carbs_g * factor,
        fat_g: acc.fat_g + entry.fat_g * factor,
        calories_kcal: acc.calories_kcal + entry.calories_kcal * factor
      };
    },
    { protein_g: 0, carbs_g: 0, fat_g: 0, calories_kcal: 0 }
  );

  return {
    protein_g: totals.protein_g / servings,
    carbs_g: totals.carbs_g / servings,
    fat_g: totals.fat_g / servings,
    calories_kcal: totals.calories_kcal / servings
  };
}

export function dispatch(
  toolName: string,
  input:
    | { recipe: Recipe; target_servings: number }
    | {
        ingredients: Ingredient[];
        servings: number;
      }
): Recipe | MacrosPerServing {
  if (toolName === 'scale_recipe') {
    const { recipe, target_servings } = input as {
      recipe: Recipe;
      target_servings: number;
    };
    return scaleRecipe(recipe, target_servings);
  }

  if (toolName === 'estimate_macros') {
    const { ingredients, servings } = input as {
      ingredients: Ingredient[];
      servings: number;
    };
    return estimateMacros(ingredients, servings);
  }

  throw new Error(`Unknown tool: "${toolName}"`);
}
