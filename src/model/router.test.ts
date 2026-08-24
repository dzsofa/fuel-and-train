import { describe, expect, it } from 'vitest';
import { route } from './router';
import { Model } from './models';
import type { TaskType } from './types';

describe('route', () => {
  it('routes macro_lookup to Haiku with caching disabled', () => {
    const config = route('macro_lookup');
    expect(config.modelId).toBe(Model.Haiku);
    expect(config.enableCaching).toBe(false);
    expect(config.maxTokens).toBe(512);
  });

  it('routes meal_chat to Sonnet with caching enabled', () => {
    const config = route('meal_chat');
    expect(config.modelId).toBe(Model.Sonnet);
    expect(config.enableCaching).toBe(true);
    expect(config.maxTokens).toBe(1024);
  });

  it('routes weekly_review to Opus with caching enabled', () => {
    const config = route('weekly_review');
    expect(config.modelId).toBe(Model.Opus);
    expect(config.enableCaching).toBe(true);
    expect(config.maxTokens).toBe(2048);
  });

  it('falls back to Sonnet for unknown task type', () => {
    const config = route('unknown_task' as TaskType);
    expect(config.modelId).toBe(Model.Sonnet);
  });

  it('returns a label for every known task type', () => {
    const tasks: TaskType[] = ['macro_lookup', 'meal_chat', 'weekly_review'];
    for (const task of tasks) {
      expect(route(task).label).toBeTruthy();
    }
  });
});
