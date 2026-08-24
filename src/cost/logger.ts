import type { Model, Usage } from '@anthropic-ai/sdk/resources';
import { PRICING_TABLE, type ModelPricing } from './pricing';
import { ALLOWED_MODELS, AllowedModel } from '@/model/models';

export function costLogger(
  model: AllowedModel,
  usage: Usage
): number | undefined {
  if (!ALLOWED_MODELS.includes(model as AllowedModel)) return undefined;
  const modelToUse = PRICING_TABLE[model];

  const cost =
    (usage.input_tokens / 1000000) * modelToUse.inputPerMtok +
    (usage.output_tokens / 1000000) * modelToUse.outputPerMtok +
    ((usage.cache_creation_input_tokens ?? 0) / 1000000) *
      modelToUse.cacheWritePerMtok +
    ((usage.cache_read_input_tokens ?? 0) / 1000000) *
      modelToUse.cacheReadPerMtok;

  return cost;
}
