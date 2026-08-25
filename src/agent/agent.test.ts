/**
 * M5 Agent unit tests
 *
 * Covers:
 *  - handlePlannerToolCall  (planner-tools.ts)
 *  - handleCritiqueToolCall (critique-tools.ts)
 *  - stripCodeFences        (orchestrator.ts)
 *
 * No API calls; all handlers use mock data from config.ts.
 */

import { describe, it, expect } from 'vitest';
import { handlePlannerToolCall } from './planner-tools';
import { handleCritiqueToolCall } from './critique-tools';
import { stripCodeFences } from './orchestrator';
import { EXERCISE_DATABASE, SAMPLE_USER_PROFILE } from './config';
import type { ExerciseMetadata } from './types';

// ---------------------------------------------------------------------------
// handlePlannerToolCall
// ---------------------------------------------------------------------------

describe('handlePlannerToolCall — get_user_profile', () => {
  it('returns a valid UserProfile with required fields', () => {
    const result = handlePlannerToolCall('get_user_profile', { userId: 'user-alex-001' }) as any;

    expect(result.success).toBe(true);
    expect(result.profile.userId).toBe('user-alex-001');
    expect(result.profile.fitnessLevel).toBe('intermediate');
    expect(Array.isArray(result.profile.goals)).toBe(true);
    expect(result.profile.goals.length).toBeGreaterThan(0);
  });

  it('returns the same profile regardless of userId (mock data)', () => {
    // Stub always returns SAMPLE_USER_PROFILE — asserting the contract, not the lookup
    const result = handlePlannerToolCall('get_user_profile', { userId: 'nonexistent-user' }) as any;
    expect(result.success).toBe(true);
    expect(result.profile).toMatchObject(SAMPLE_USER_PROFILE);
  });
});

describe('handlePlannerToolCall — get_exercise_database', () => {
  it('returns the full database when no filters are provided', () => {
    const result = handlePlannerToolCall('get_exercise_database', {}) as any;

    expect(result.success).toBe(true);
    expect(result.count).toBe(EXERCISE_DATABASE.length);
    expect(result.exercises.length).toBe(EXERCISE_DATABASE.length);
  });

  it('filters by difficulty', () => {
    const result = handlePlannerToolCall('get_exercise_database', {
      filters: { difficulty: 'beginner' }
    }) as any;

    expect(result.exercises.every((e: ExerciseMetadata) => e.difficulty === 'beginner')).toBe(true);
    expect(result.count).toBe(result.exercises.length);
  });

  it('excludes exercises by name', () => {
    const result = handlePlannerToolCall('get_exercise_database', {
      filters: { excludeByName: ['Barbell Bench Press', 'Conventional Deadlift'] }
    }) as any;

    const names = result.exercises.map((e: ExerciseMetadata) => e.name);
    expect(names).not.toContain('Barbell Bench Press');
    expect(names).not.toContain('Conventional Deadlift');
    expect(result.count).toBe(result.exercises.length);
  });

  it('applies difficulty and excludeByName filters together', () => {
    const result = handlePlannerToolCall('get_exercise_database', {
      filters: {
        difficulty: 'intermediate',
        excludeByName: ['Barbell Bench Press']
      }
    }) as any;

    const names = result.exercises.map((e: ExerciseMetadata) => e.name);
    expect(names).not.toContain('Barbell Bench Press');
    expect(result.exercises.every((e: ExerciseMetadata) => e.difficulty === 'intermediate')).toBe(true);
    expect(result.count).toBe(result.exercises.length);
  });

  it('returns empty array when equipment filter matches nothing', () => {
    const result = handlePlannerToolCall('get_exercise_database', {
      filters: { equipment: ['nonexistent_machine'] }
    }) as any;

    expect(result.success).toBe(true);
    expect(result.exercises).toEqual([]);
    expect(result.count).toBe(0);
  });

  it('returns full array when excludeByName contains a name not in the database', () => {
    const result = handlePlannerToolCall('get_exercise_database', {
      filters: { excludeByName: ['Invented Exercise That Does Not Exist'] }
    }) as any;

    expect(result.count).toBe(EXERCISE_DATABASE.length);
  });
});

describe('handlePlannerToolCall — get_training_history', () => {
  it('returns success and history shape for a known userId', () => {
    const result = handlePlannerToolCall('get_training_history', {
      userId: 'user-alex-001',
      daysBack: 14
    }) as any;

    expect(result.success).toBe(true);
    expect(result.userId).toBe('user-alex-001');
    expect(typeof result.sessionsCompleted).toBe('number');
  });

  it('uses default daysBack when not provided', () => {
    const result = handlePlannerToolCall('get_training_history', {
      userId: 'user-alex-001'
    }) as any;

    expect(result.success).toBe(true);
    expect(result.period).toContain('14');
  });

  it('returns a consistent shape for an unrecognised userId (mock always returns data)', () => {
    const result = handlePlannerToolCall('get_training_history', {
      userId: 'unknown-user-999'
    }) as any;

    // Stub returns data regardless — shape must still be valid so the planner can continue
    expect(result.success).toBe(true);
    expect(result.userId).toBe('unknown-user-999');
    expect(typeof result.sessionsCompleted).toBe('number');
  });
});

describe('handlePlannerToolCall — validate_user_profile', () => {
  it('returns isValid: true with no missing fields for the sample profile', () => {
    const result = handlePlannerToolCall('validate_user_profile', {
      userId: 'user-alex-001'
    }) as any;

    expect(result.success).toBe(true);
    expect(result.isValid).toBe(true);
    expect(result.missingFields).toEqual([]);
    expect(result.conflicts).toEqual([]);
  });
});

describe('handlePlannerToolCall — unknown tool', () => {
  it('throws for an unknown tool name', () => {
    expect(() => handlePlannerToolCall('nonexistent_tool', {})).toThrow(
      'Unknown planner tool: nonexistent_tool'
    );
  });
});

// ---------------------------------------------------------------------------
// handleCritiqueToolCall
// ---------------------------------------------------------------------------

describe('handleCritiqueToolCall — get_user_profile', () => {
  it('returns the sample user profile', () => {
    const result = handleCritiqueToolCall('get_user_profile', { userId: 'user-alex-001' }) as any;

    expect(result.success).toBe(true);
    expect(result.profile.userId).toBe('user-alex-001');
    expect(result.profile.injuryHistory).toContain('lower_back_strain_2024');
  });
});

describe('handleCritiqueToolCall — get_exercise_database', () => {
  it('returns the full database when exerciseNames is omitted', () => {
    const result = handleCritiqueToolCall('get_exercise_database', {}) as any;

    expect(result.success).toBe(true);
    expect(result.count).toBe(EXERCISE_DATABASE.length);
  });

  it('returns only the named exercises when exerciseNames is provided', () => {
    const result = handleCritiqueToolCall('get_exercise_database', {
      exerciseNames: ['Planks', 'Pull-ups']
    }) as any;

    expect(result.exercises).toHaveLength(2);
    const names = result.exercises.map((e: ExerciseMetadata) => e.name);
    expect(names).toContain('Planks');
    expect(names).toContain('Pull-ups');
  });

  it('returns only matched items when some names in the list do not exist', () => {
    const result = handleCritiqueToolCall('get_exercise_database', {
      exerciseNames: ['Planks', 'Made Up Exercise']
    }) as any;

    expect(result.exercises).toHaveLength(1);
    expect(result.exercises[0].name).toBe('Planks');
    expect(result.count).toBe(1);
  });

  it('returns empty array when no names match', () => {
    const result = handleCritiqueToolCall('get_exercise_database', {
      exerciseNames: ['Exercise A', 'Exercise B']
    }) as any;

    expect(result.success).toBe(true);
    expect(result.exercises).toEqual([]);
    expect(result.count).toBe(0);
  });
});

describe('handleCritiqueToolCall — parse_plan', () => {
  it('parses a valid plan JSON string and returns isValid: true', () => {
    const plan = {
      userId: 'user-alex-001',
      weekStartDate: '2026-09-01',
      sessions: [{ dayOfWeek: 'Monday', focus: 'Upper Push', durationMinutes: 60, exercises: [] }]
    };

    const result = handleCritiqueToolCall('parse_plan', {
      planJson: JSON.stringify(plan)
    }) as any;

    expect(result.success).toBe(true);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.parsedPlan.userId).toBe('user-alex-001');
  });

  it('returns isValid: false for a plan missing required fields', () => {
    const incomplete = { fitnessLevel: 'intermediate' }; // no userId, weekStartDate, sessions

    const result = handleCritiqueToolCall('parse_plan', {
      planJson: JSON.stringify(incomplete)
    }) as any;

    expect(result.success).toBe(true);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('returns success: false for an invalid JSON string', () => {
    const result = handleCritiqueToolCall('parse_plan', {
      planJson: '{ this is not valid json }'
    }) as any;

    expect(result.success).toBe(false);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toMatch(/JSON parse error/i);
  });

  it('accepts a pre-parsed object (not a string) without throwing', () => {
    const plan = {
      userId: 'user-alex-001',
      weekStartDate: '2026-09-01',
      sessions: []
    };

    const result = handleCritiqueToolCall('parse_plan', { planJson: plan }) as any;

    expect(result.success).toBe(true);
  });
});

describe('handleCritiqueToolCall — approve_plan / reject_plan', () => {
  it('approve_plan returns action: approve with summary echoed back', () => {
    const result = handleCritiqueToolCall('approve_plan', {
      summary: 'Well-balanced intermediate plan'
    }) as any;

    expect(result.success).toBe(true);
    expect(result.action).toBe('approve');
    expect(result.summary).toBe('Well-balanced intermediate plan');
    expect(Array.isArray(result.minorSuggestions)).toBe(true);
  });

  it('approve_plan defaults minorSuggestions to empty array when omitted', () => {
    const result = handleCritiqueToolCall('approve_plan', {
      summary: 'Good plan'
    }) as any;

    expect(result.minorSuggestions).toEqual([]);
  });

  it('reject_plan returns action: reject with reason and suggestions echoed back', () => {
    const result = handleCritiqueToolCall('reject_plan', {
      reason: 'Injury risk',
      details: 'Deadlift included despite lower_back history',
      suggestions: ['Replace deadlift with leg press', 'Add warm-up sets']
    }) as any;

    expect(result.success).toBe(true);
    expect(result.action).toBe('reject');
    expect(result.reason).toBe('Injury risk');
    expect(result.suggestions).toHaveLength(2);
  });

  it('reject_plan defaults suggestions to empty array when omitted', () => {
    const result = handleCritiqueToolCall('reject_plan', {
      reason: 'Bad plan',
      details: 'Details here'
      // suggestions intentionally omitted
    }) as any;

    expect(result.suggestions).toEqual([]);
  });
});

describe('handleCritiqueToolCall — unknown tool', () => {
  it('throws for an unknown tool name', () => {
    expect(() => handleCritiqueToolCall('nonexistent_tool', {})).toThrow(
      'Unknown critique tool: nonexistent_tool'
    );
  });
});

// ---------------------------------------------------------------------------
// stripCodeFences
// ---------------------------------------------------------------------------

describe('stripCodeFences', () => {
  it('leaves plain JSON unchanged', () => {
    const json = '{"status":"ok","sessions":[]}';
    expect(stripCodeFences(json)).toBe(json);
  });

  it('strips ```json opening and closing fences', () => {
    const raw = '```json\n{"status":"ok"}\n```';
    expect(stripCodeFences(raw)).toBe('{"status":"ok"}');
  });

  it('strips ``` opening and closing fences (no language tag)', () => {
    const raw = '```\n{"status":"ok"}\n```';
    expect(stripCodeFences(raw)).toBe('{"status":"ok"}');
  });

  it('strips opening fence only when closing fence is absent (truncated output)', () => {
    const raw = '```json\n{"status":"ok"}';
    expect(stripCodeFences(raw)).toBe('{"status":"ok"}');
  });

  it('does not affect a fence-like string inside the JSON content', () => {
    const raw = '{"notes":"see ```docs```","status":"ok"}';
    expect(stripCodeFences(raw)).toBe(raw);
  });

  it('returns an empty string without throwing when input is empty', () => {
    expect(stripCodeFences('')).toBe('');
  });

  it('is idempotent — running twice produces the same result', () => {
    const raw = '```json\n{"status":"ok"}\n```';
    const once = stripCodeFences(raw);
    expect(stripCodeFences(once)).toBe(once);
  });
});
