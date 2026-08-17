export interface Recipe {
  name: string;
  servings: number;
  ingredients: Array<Ingredient>;
  steps: Array<string>;
  macros_per_serving: MacrosPerServing;
}

export interface Ingredient {
  name: string;
  amount_g: number;
}

export interface MacrosPerServing {
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  calories_kcal: number;
}
