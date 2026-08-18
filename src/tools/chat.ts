import Anthropic from '@anthropic-ai/sdk';
import { MessageParam } from '@anthropic-ai/sdk/resources';
import { runToolLoop } from './loop';
import { TOOL_DEFINITIONS } from './definitions';
import { dispatch } from './handlers';

const SYSTEM_PROMPT = `You are a nutrition and recipe assistant. You help users scale recipes to different serving sizes and estimate the macronutrient content of meals.

You have access to two tools:
1. scale_recipe – call this when the user asks to scale, double, halve, or adjust a recipe to a different number of servings.
2. estimate_macros – call this when the user asks about nutritional content, protein, carbs, fat, or calories of a meal or ingredient list.

All measurements use SI units (grams, millilitres, Celsius). Provide clear, helpful guidance on nutrition and recipes.`;

export async function chat(): Promise<void> {
  const client = new Anthropic();
  const messages: MessageParam[] = [
    {
      role: 'user',
      content: `I have a recipe for Pancakes that currently serves 2 people. It contains 100g all-purpose flour and 60ml whole milk, with macros per serving of 5g protein, 40g carbs, 3g fat, and 210 kcal. 

Please:
1. Scale this recipe to 4 servings
2. Estimate the macronutrient content (protein, carbs, fat, calories) of the scaled recipe`
    }
  ];

  const result = await runToolLoop(
    client,
    messages,
    TOOL_DEFINITIONS,
    dispatch,
    SYSTEM_PROMPT
  );
  console.log(result);
}


const isMain = process.argv[1]?.endsWith('chat.ts');
if (isMain) chat().catch(console.error);
