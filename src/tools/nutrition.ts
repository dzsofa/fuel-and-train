/**
 * Macronutrient data per 100g for common pantry ingredients.
 * Source: USDA FoodData Central (reasonable approximations for education/demo purposes)
 * SI units: protein_g, carbs_g, fat_g, calories_kcal per 100g
 */
export const NUTRITION_DB: Record<
  string,
  { protein_g: number; carbs_g: number; fat_g: number; calories_kcal: number }
> = {
  'All-purpose flour': {
    protein_g: 10.3,
    carbs_g: 76.3,
    fat_g: 1.0,
    calories_kcal: 364
  },
  'Granulated sugar': {
    protein_g: 0,
    carbs_g: 100,
    fat_g: 0,
    calories_kcal: 387
  },
  'Unsalted butter': {
    protein_g: 0.9,
    carbs_g: 0.1,
    fat_g: 81.7,
    calories_kcal: 717
  },
  'Whole milk': {
    protein_g: 3.2,
    carbs_g: 4.8,
    fat_g: 3.3,
    calories_kcal: 61
  },
  'Egg': {
    protein_g: 13.0,
    carbs_g: 1.1,
    fat_g: 11.0,
    calories_kcal: 155
  },
  'Baking powder': {
    protein_g: 0,
    carbs_g: 27.8,
    fat_g: 0,
    calories_kcal: 104
  },
  'Fine sea salt': {
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    calories_kcal: 0
  },
  'Olive oil': {
    protein_g: 0,
    carbs_g: 0,
    fat_g: 100,
    calories_kcal: 884
  },
  'Garlic': {
    protein_g: 6.4,
    carbs_g: 33.1,
    fat_g: 0.5,
    calories_kcal: 149
  },
  'Onion': {
    protein_g: 1.1,
    carbs_g: 9.3,
    fat_g: 0.1,
    calories_kcal: 40
  },
  'Chicken breast (raw)': {
    protein_g: 31.0,
    carbs_g: 0,
    fat_g: 3.6,
    calories_kcal: 165
  },
  'Tomato paste': {
    protein_g: 3.3,
    carbs_g: 17.9,
    fat_g: 0.3,
    calories_kcal: 82
  }
};
