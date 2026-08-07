import Anthropic from '@anthropic-ai/sdk';
import { JSONSchema } from '@anthropic-ai/sdk/lib/transform-json-schema.mjs';

interface Tool {
  name: string;
  description: string;
  input_schema: JSONSchema;
}

export const TOOL_DEFINITIONS: Anthropic.Messages.Tool[] = [
  {
    name: 'scale_recipe',
    description:
      'Use this tool to adjust a recipe to a different number of servings. Takes a recipe and a target serving count, returns the recipe with ingredient amounts and macros recomputed. Call this when the user asks to scale, double, halve, or change the yield of a recipe. Do not use this when the user asks about calories, macronutrient content',
    input_schema: {
      type: 'object',
      properties: {
        recipe: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            servings: { type: 'number', description: 'Serving size' },
            ingredients: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  amount_g: { type: 'number', description: 'Amount in grams' }
                },
                required: ['name', 'amount_g'],
                additionalProperties: false
              }
            },
            steps: {
              type: 'array',
              items: { type: 'string' }
            },
            macros_per_serving: {
              type: 'object',
              properties: {
                protein_g: { type: 'number', description: 'Protein in grams' },
                carbs_g: {
                  type: 'number',
                  description: 'Carbohydrates in grams'
                },
                fat_g: { type: 'number', description: 'Fat in grams' },
                calories_kcal: {
                  type: 'number',
                  description: 'Calories in kilocalories'
                }
              },
              required: ['protein_g', 'carbs_g', 'fat_g', 'calories_kcal'],
              additionalProperties: false
            }
          },
          required: [
            'name',
            'servings',
            'ingredients',
            'steps',
            'macros_per_serving'
          ],
          additionalProperties: false
        },
        target_servings: { type: 'number', description: 'Target serving size' }
      },
      required: ['recipe', 'target_servings'],
      additionalProperties: false
    }
  },
  {
    name: 'estimate_macros',
    description:
      'Use this tool to estimate macronutrient content (protein, carbs, fat, calories) from a list of ingredients. Takes ingredient names with amounts in grams and a serving count. Returns macros per serving. Call this when the user asks about nutritional content or macros of a meal or ingredient list. Do not use when user asks to change the yield of a recipe',
    input_schema: {
      type: 'object',
      properties: {
        ingredients: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: '...' },
              amount_g: { type: 'number', description: '...' }
            },
            required: ['name', 'amount_g'],
            additionalProperties: false
          }
        },
        servings: { type: 'number', description: '...' }
      },
      required: ['ingredients', 'servings'],
      additionalProperties: false
    }
  }
];
