export function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export function int(name: string, fallback?: number): number {
  const raw = process.env[name];
  if (raw == null || raw === '') {
    if (fallback != null) return fallback;
    throw new Error(`Missing env var: ${name}`);
  }
  const n = Number(raw);
  if (!Number.isFinite(n))
    throw new Error(`${name} must be a number, got "${raw}"`);
  return n;
}

const ALLOWED_MODELS = ['claude-haiku-4-5-20251001'] as const;

type AllowedModel = (typeof ALLOWED_MODELS)[number];

export function model(name: string): AllowedModel {
  const v = required(name);
  if (!ALLOWED_MODELS.includes(v as AllowedModel)) {
    throw new Error(`Invalid ${name}: ${v}`);
  }
  return v as AllowedModel;
}

export const config = {
  anthropicModel: model('ANTHROPIC_MODEL'),
  maxOutputTokens: int('CLAUDE_CODE_MAX_OUTPUT_TOKENS', 1024)
} as const;
