import { config } from "@/config";
import Anthropic from '@anthropic-ai/sdk';
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function intake(fileName: string) {
  const client = new Anthropic();
  const response = await client.messages.create({
    max_tokens: config.maxOutputTokens,
    model: config.anthropicModel,
    system: `All quantities must be in SI units. Use grams (g) for amounts/macros and kilocalories (kcal) for calories. Do not output other units.`,
    output_config: {
      format: {
        type: 'json_schema',
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            servings: { type: 'number' },

            ingredients: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  amount_g: { type: 'number' }
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
                protein_g: { type: 'number' },
                carbs_g: { type: 'number' },
                fat_g: { type: 'number' },
                calories_kcal: { type: 'number' }
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
        }
      }
    },
    messages: [
      {
        role: 'user',
        content: [
          readImageBlock(path.resolve(__dirname, `../../assets/${fileName}`)),
          { type: 'text', text: 'Identify this food and return a recipe.' }
        ]
      }
    ]
  });

  const recipe = response.content.find((b) => b.type === 'text')?.text ?? '';

  console.log(recipe);
  console.log(response.usage);
}

function readImageBlock(filePath: string) {
  const buffer = fs.readFileSync(filePath);
  return {
    type: 'image' as const,
    source: {
      type: 'base64' as const,
      media_type: mediaTypeFromPath(filePath),
      data: buffer.toString('base64')
    }
  };
}

type AllowedMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

export function mediaTypeFromPath(filePath: string): AllowedMediaType {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    default:
      throw new Error(`Unsupported image extension: ${ext}`);
  }
}

const isMain = process.argv[1]?.endsWith('intake.ts');
if (isMain) intake(process.argv[2]);
