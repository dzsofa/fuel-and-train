import { ALLOWED_MODELS, type AllowedModel } from './model/models';

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

export function model(name: string): AllowedModel {
  const v = required(name);
  if (!ALLOWED_MODELS.includes(v as AllowedModel)) {
    throw new Error(`Invalid ${name}: ${v}`);
  }
  return v as AllowedModel;
}

export const config = {
  anthropicModel: model('ANTHROPIC_MODEL'),
  maxOutputTokens: int('CLAUDE_CODE_MAX_OUTPUT_TOKENS', 1024),

  // M6 — Batch API
  batchPollIntervalMs: int('BATCH_POLL_INTERVAL_MS', 5_000),
  batchTimeoutMs: int('BATCH_TIMEOUT_MS', 600_000),
  batchOutputPath: process.env['BATCH_OUTPUT_PATH'] ?? 'output/batch-results.jsonl',
} as const;
