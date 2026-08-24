import { describe, expect, it } from 'vitest';
import { costLogger } from './logger';
import type { Usage } from '@anthropic-ai/sdk/resources';
import { AllowedModel, Model } from '@/model/models';

const baseUsage: Usage = {
  input_tokens: 1000,
  output_tokens: 500,
  cache_creation_input_tokens: null,
  cache_read_input_tokens: null,
  cache_creation: null,
  output_tokens_details: null,
  server_tool_use: null,
  service_tier: null,
  inference_geo: null
};

const cachedUsage: Usage = {
  ...baseUsage,
  cache_creation_input_tokens: 1000,
  cache_read_input_tokens: 500
};

const heavyCacheUsage: Usage = {
  ...baseUsage,
  cache_creation_input_tokens: 1000000,
  cache_read_input_tokens: 500000
};

describe('costLogger', () => {
  it.for<[AllowedModel, number]>([
    [Model.Haiku, 0.0035],
    [Model.Sonnet, 0.007],
    [Model.Opus, 0.0175]
  ])(
    'should calculate correct cost for %s without caching as %s',
    ([model, expectedCost]) => {
      expect(costLogger(model, baseUsage)).toBeCloseTo(expectedCost, 6);
    }
  );

  it.for<[AllowedModel, number]>([
    [Model.Haiku, 0.0048],
    [Model.Sonnet, 0.0096],
    [Model.Opus, 0.024]
  ])(
    'should calculate correct cost for %s with cache usage as %s',
    ([model, expectedCost]) => {
      expect(costLogger(model, cachedUsage)).toBeCloseTo(expectedCost, 6);
    }
  );

  it.for<[AllowedModel, number]>([
    [Model.Haiku, 1.3035],
    [Model.Sonnet, 2.607],
    [Model.Opus, 6.5175]
  ])(
    'should calculate correct cost for %s with heavy cache usage as %s',
    ([model, expectedCost]) => {
      expect(costLogger(model, heavyCacheUsage)).toBeCloseTo(expectedCost, 6);
    }
  );

  it('should return undefined if the model is not in the ALLOWED_MODELS array', () => {
    expect(costLogger('opus-4-8' as AllowedModel, baseUsage)).toBe(undefined)
  })
});
