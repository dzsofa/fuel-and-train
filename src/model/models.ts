export const Model = {
  Haiku:  'claude-haiku-4-5',
  Sonnet: 'claude-sonnet-5',
  Opus:   'claude-opus-5',
} as const;

export type AllowedModel = (typeof Model)[keyof typeof Model];

export const ALLOWED_MODELS = Object.values(Model) as AllowedModel[];
