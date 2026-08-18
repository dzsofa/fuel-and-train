import { AllowedModel, Model } from '@/model/models';

export const PRICING_TABLE = {
  [Model.Opus]: {
    inputPerMtok: 5.0,
    outputPerMtok: 25.0,
    cacheWritePerMtok: 6.25,
    cacheReadPerMtok: 0.5
  },
  [Model.Sonnet]: {
    inputPerMtok: 2.0,
    outputPerMtok: 10.0,
    cacheWritePerMtok: 2.5,
    cacheReadPerMtok: 0.2
  },
  [Model.Haiku]: {
    inputPerMtok: 1.0,
    outputPerMtok: 5.0,
    cacheWritePerMtok: 1.25,
    cacheReadPerMtok: 0.1
  }
} as const satisfies Record<AllowedModel, ModelPricing>;

export interface ModelPricing {
  inputPerMtok: number;
  outputPerMtok: number;
  cacheWritePerMtok: number;
  cacheReadPerMtok: number;
}
