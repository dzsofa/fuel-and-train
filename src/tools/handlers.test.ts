import { describe, expect, it } from 'vitest';
import { scaleRecipe, estimateMacros, dispatch } from './handlers';
import type { Recipe, MacrosPerServing } from './types';

const recipe = {
  name: 'Pancakes',
  servings: 2,
  ingredients: [
    { name: 'All-purpose flour', amount_g: 100 },
    { name: 'Whole milk', amount_g: 60 }
  ],
  steps: ['Mix ingredients', 'Cook on pan'],
  macros_per_serving: {
    protein_g: 5,
    carbs_g: 40,
    fat_g: 3,
    calories_kcal: 210
  }
};

describe('scaleRecipe', () => {
  it('should scale ingredient amounts up correctly', () => {
    const result = scaleRecipe(recipe, 4);

    expect(result.servings).toBe(4);
    expect(result.ingredients[0].amount_g).toBeCloseTo(200);
    expect(result.ingredients[1].amount_g).toBeCloseTo(120);
    expect(result.macros_per_serving).toEqual(recipe.macros_per_serving);
  });

  it('should scale ingredient amounts down correctly', () => {
    const result = scaleRecipe(recipe, 1);

    expect(result.servings).toBe(1);
    expect(result.ingredients[0].amount_g).toBeCloseTo(50);
    expect(result.ingredients[1].amount_g).toBeCloseTo(30);
    expect(result.macros_per_serving).toEqual(recipe.macros_per_serving);
  });

  it('should not change ingredient amounts when target serving size is the same as original', () => {
    const result = scaleRecipe(recipe, 2);

    expect(result.servings).toBe(2);
    expect(result.ingredients[0].amount_g).toBeCloseTo(100);
    expect(result.ingredients[1].amount_g).toBeCloseTo(60);
    expect(result.macros_per_serving).toEqual(recipe.macros_per_serving);
  });

  it('should throw an error when "target_servings" === 0', () => {
    expect(() => scaleRecipe(recipe, 0)).toThrow(
      'Target serving size should be larger than 0'
    );
  });

  it('should throw an error when "target_servings" === -2', () => {
    expect(() => scaleRecipe(recipe, -2)).toThrow(
      'Target serving size should be larger than 0'
    );
  });
});

describe('estimateMacros', () => {
  it('should compute macros for a known ingredient divided by servings', () => {
    const result = estimateMacros(
      [{ name: 'Chicken breast (raw)', amount_g: 100 }],
      1
    );

    expect(result.protein_g).toBeCloseTo(31.0);
    expect(result.carbs_g).toBeCloseTo(0);
    expect(result.fat_g).toBeCloseTo(3.6);
    expect(result.calories_kcal).toBeCloseTo(165);
  });

  it('should sum macros across multiple known ingredients before dividing by servings', () => {
    // 100g chicken: 31g protein | 100g whole milk: 3.2g protein → total 34.2 / 2 servings = 17.1
    const result = estimateMacros(
      [
        { name: 'Chicken breast (raw)', amount_g: 100 },
        { name: 'Whole milk', amount_g: 100 }
      ],
      2
    );

    expect(result.protein_g).toBeCloseTo(17.1);
  });

  it('should contribute zero for an unknown ingredient', () => {
    const result = estimateMacros(
      [{ name: 'Mystery powder', amount_g: 100 }],
      1
    );

    expect(result.protein_g).toBe(0);
    expect(result.carbs_g).toBe(0);
    expect(result.fat_g).toBe(0);
    expect(result.calories_kcal).toBe(0);
  });

  it('should only count known ingredients when mixing known and unknown', () => {
    const knownOnly = estimateMacros([{ name: 'Olive oil', amount_g: 100 }], 1);
    const mixed = estimateMacros(
      [
        { name: 'Olive oil', amount_g: 100 },
        { name: 'Mystery powder', amount_g: 999 }
      ],
      1
    );

    expect(mixed.calories_kcal).toBeCloseTo(knownOnly.calories_kcal);
  });

  it('should throw when servings is 0', () => {
    expect(() =>
      estimateMacros([{ name: 'Olive oil', amount_g: 100 }], 0)
    ).toThrow('Servings should be larger than 0');
  });

  it('should return all zeros for an empty ingredients array', () => {
    const result = estimateMacros([], 1);

    expect(result.protein_g).toBe(0);
    expect(result.carbs_g).toBe(0);
    expect(result.fat_g).toBe(0);
    expect(result.calories_kcal).toBe(0);
  });
});

describe('dispatch', () => {
  it('should route scale_recipe to the scaleRecipe handler', () => {
    const input = {
      recipe: recipe,
      target_servings: 4
    };

    const result = dispatch('scale_recipe', input) as Recipe;

    expect(result.servings).toBe(4);
  });

  it('should route estimate_macros to the estimateMacros handler', () => {
    const input = {
      ingredients: [{ name: 'Olive oil', amount_g: 100 }],
      servings: 1
    };

    const result = dispatch('estimate_macros', input) as MacrosPerServing;

    expect(result.calories_kcal).toBeCloseTo(884);
  });

  it('should throw for an unknown tool name', () => {
    expect(() => dispatch('nonexistent_tool', {} as any)).toThrow();
  });
});
