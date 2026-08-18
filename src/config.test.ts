import { describe, expect, it, vi } from 'vitest';
import { int, model, required } from './config';
import { Model } from './model/models';

const ANTHROPIC_MODEL = 'ANTHROPIC_MODEL';
const CLAUDE_CODE_MAX_OUTPUT_TOKENS = 'CLAUDE_CODE_MAX_OUTPUT_TOKENS';

describe('required()', () => {
  it('should return the correct value when environment variable is present', () => {
    vi.stubEnv(ANTHROPIC_MODEL, Model.Haiku);

    expect(required(ANTHROPIC_MODEL)).toBe(Model.Haiku);
  });

  it('should throw when environment variable is absent', () => {
    vi.stubEnv(ANTHROPIC_MODEL, undefined);

    expect(() => required(ANTHROPIC_MODEL)).toThrow(
      'Missing env var: ANTHROPIC_MODEL'
    );
  });
});

describe('int()', () => {
  it('should return the value from environment variable when present', () => {
    vi.stubEnv(CLAUDE_CODE_MAX_OUTPUT_TOKENS, '25');

    expect(int(CLAUDE_CODE_MAX_OUTPUT_TOKENS)).toBe(25);
  });

  it('should use the fallback when environment variable is absent', () => {
    vi.stubEnv(CLAUDE_CODE_MAX_OUTPUT_TOKENS, undefined);

    expect(int(CLAUDE_CODE_MAX_OUTPUT_TOKENS, 258)).toBe(258);
  });

  it('should throw when environment variable is absent AND there is no fallback provided', () => {
    vi.stubEnv(CLAUDE_CODE_MAX_OUTPUT_TOKENS, undefined);

    expect(() => int(CLAUDE_CODE_MAX_OUTPUT_TOKENS)).toThrow(
      'Missing env var: CLAUDE_CODE_MAX_OUTPUT_TOKENS'
    );
  });

  it('should throw when non-numeric value is set as environment variable', () => {
    vi.stubEnv(CLAUDE_CODE_MAX_OUTPUT_TOKENS, 'no max tokens');

    expect(() => int(CLAUDE_CODE_MAX_OUTPUT_TOKENS)).toThrow(
      'CLAUDE_CODE_MAX_OUTPUT_TOKENS must be a number, got "no max tokens"'
    );
  });
});

describe('model()', () => {
  it('should return the model ID if it is an allowed model', () => {
    vi.stubEnv(ANTHROPIC_MODEL, Model.Haiku);

    expect(model(ANTHROPIC_MODEL)).toBe(Model.Haiku);
  });

  it('should throw an error if the specified model ID is not in the allowed models list', () => {
    vi.stubEnv(ANTHROPIC_MODEL, 'claude-haiku-4');

    expect(() => model(ANTHROPIC_MODEL)).toThrow(
      'Invalid ANTHROPIC_MODEL: claude-haiku-4'
    );
  });
});
