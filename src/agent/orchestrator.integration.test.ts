/**
 * M5 Integration tests — real Claude API calls
 *
 * Guard: only runs when INTEGRATION=1 is set in the environment.
 * Usage:  INTEGRATION=1 pnpm test src/agent/orchestrator.integration.test.ts
 *
 * These tests verify the full planner → critique flow end-to-end.
 * They cost real tokens (~$0.05–0.10 per run), so they are excluded
 * from the default `pnpm test` suite.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import Anthropic from '@anthropic-ai/sdk';
import { runPlanner, runCritique, orchestrate } from './orchestrator';
import type { WorkoutPlan } from './types';

const RUN = process.env.INTEGRATION === '1';

// ---------------------------------------------------------------------------
// Shared client — created once for the whole suite
// ---------------------------------------------------------------------------

let client: Anthropic;

beforeAll(() => {
  if (!RUN) return;
  client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal but valid WorkoutPlan the critique agent can review */
function makeGoodPlan(): WorkoutPlan {
  return {
    userId: 'user-alex-001',
    weekStartDate: '2026-09-01',
    fitnessLevel: 'intermediate',
    goals: ['strength', 'endurance'],
    notes: '',
    sessions: [
      {
        dayOfWeek: 'Monday',
        timeOfDay: 'morning',
        focus: 'Upper Push',
        durationMinutes: 60,
        exercises: [
          {
            name: 'Barbell Bench Press',
            muscleGroups: ['chest', 'triceps'],
            difficulty: 'intermediate',
            sets: 3,
            reps: 5,
            restSeconds: 150
          },
          {
            name: 'Standing Overhead Press',
            muscleGroups: ['shoulders', 'triceps'],
            difficulty: 'intermediate',
            sets: 3,
            reps: 5,
            restSeconds: 150
          },
          {
            name: 'Planks',
            muscleGroups: ['core'],
            difficulty: 'beginner',
            sets: 3,
            reps: 1,
            restSeconds: 60
          }
        ]
      },
      {
        dayOfWeek: 'Wednesday',
        timeOfDay: 'morning',
        focus: 'Pull',
        durationMinutes: 60,
        exercises: [
          {
            name: 'Pull-ups',
            muscleGroups: ['lats', 'biceps'],
            difficulty: 'intermediate',
            sets: 3,
            reps: 5,
            restSeconds: 150
          },
          {
            name: 'Barbell Bent-Over Rows',
            muscleGroups: ['back', 'biceps'],
            difficulty: 'intermediate',
            sets: 3,
            reps: 5,
            restSeconds: 150
          }
        ]
      },
      {
        dayOfWeek: 'Friday',
        timeOfDay: 'morning',
        focus: 'Endurance',
        durationMinutes: 45,
        exercises: [
          {
            name: 'Running',
            muscleGroups: ['legs', 'cardiovascular'],
            difficulty: 'beginner',
            sets: 1,
            reps: 1,
            restSeconds: 0
          }
        ]
      }
    ],
    progressionStrategy:
      'Increase weight by 5% when all sets are completed with good form.'
  };
}

/** Plan with a critical injury-risk violation: Conventional Deadlift included
 *  despite the user's lower_back_strain_2024 history */
function makeBadPlan(): WorkoutPlan {
  return {
    ...makeGoodPlan(),
    sessions: [
      {
        dayOfWeek: 'Monday',
        timeOfDay: 'morning',
        focus: 'Lower Body',
        durationMinutes: 60,
        exercises: [
          {
            name: 'Conventional Deadlift',
            muscleGroups: ['hamstrings', 'lower_back'],
            difficulty: 'advanced',
            sets: 5,
            reps: 5,
            restSeconds: 180
          },
          {
            name: 'Barbell Back Squat',
            muscleGroups: ['quadriceps', 'glutes'],
            difficulty: 'intermediate',
            sets: 5,
            reps: 5,
            restSeconds: 180
          },
          {
            name: 'Barbell Back Squat',
            muscleGroups: ['quadriceps', 'glutes'],
            difficulty: 'intermediate',
            sets: 5,
            reps: 5,
            restSeconds: 180
          }
        ]
      },
      // Same muscle group on consecutive days — balance issue
      {
        dayOfWeek: 'Tuesday',
        timeOfDay: 'morning',
        focus: 'Lower Body',
        durationMinutes: 60,
        exercises: [
          {
            name: 'Barbell Back Squat',
            muscleGroups: ['quadriceps', 'glutes'],
            difficulty: 'intermediate',
            sets: 5,
            reps: 5,
            restSeconds: 180
          },
          {
            name: 'Conventional Deadlift',
            muscleGroups: ['hamstrings', 'lower_back'],
            difficulty: 'advanced',
            sets: 5,
            reps: 5,
            restSeconds: 180
          }
        ]
      }
    ]
  };
}

// ---------------------------------------------------------------------------
// runPlanner
// ---------------------------------------------------------------------------

describe('runPlanner (integration)', () => {
  let plan: WorkoutPlan;

  beforeAll(async () => {
    if (!RUN) return;
    plan = await runPlanner(client);
  }, 120_000);

  it.skipIf(!RUN)('returns a WorkoutPlan with correct userId and structure', () => {
    expect(plan.userId).toBe('user-alex-001');
    expect(plan.weekStartDate).toMatch(/^\d{4}-\d{2}-\d{2}$/); // ISO date
    expect(Array.isArray(plan.sessions)).toBe(true);
    expect(plan.sessions.length).toBeGreaterThanOrEqual(1);
    expect(plan.sessions.length).toBeLessThanOrEqual(5); // compact constraint
  });

  it.skipIf(!RUN)('every session has at most 3 exercises (compact constraint)', () => {
    for (const session of plan.sessions) {
      expect(session.exercises.length).toBeLessThanOrEqual(3);
    }
  });

  it.skipIf(!RUN)('every exercise has name, sets, and reps', () => {
    for (const session of plan.sessions) {
      for (const exercise of session.exercises) {
        expect(typeof exercise.name).toBe('string');
        expect(exercise.name.length).toBeGreaterThan(0);
        expect(typeof exercise.sets).toBe('number');
        expect(typeof exercise.reps).toBe('number');
      }
    }
  });
});

// ---------------------------------------------------------------------------
// runCritique — good plan
// ---------------------------------------------------------------------------

describe('runCritique with a well-formed plan (integration)', () => {
  it.skipIf(!RUN)(
    'returns a valid CritiqueFeedback shape',
    async () => {
      const feedback = await runCritique(client, makeGoodPlan());

      expect(['approved', 'revision_suggested', 'rejected']).toContain(
        feedback.status
      );
      expect(typeof feedback.planId).toBe('string');
      expect(typeof feedback.muscleGroupBalance.assessment).toBe('string');
      expect(typeof feedback.recoveryAnalysis.assessment).toBe('string');
      expect(typeof feedback.progressionAnalysis.assessment).toBe('string');
      expect(typeof feedback.injuryRiskAnalysis.assessment).toBe('string');
      expect(Array.isArray(feedback.suggestions)).toBe(true);
    },
    60_000
  );

  it.skipIf(!RUN)(
    'planId contains the userId from the plan',
    async () => {
      const feedback = await runCritique(client, makeGoodPlan());
      expect(feedback.planId).toContain('user-alex-001');
    },
    60_000
  );
});

// ---------------------------------------------------------------------------
// runCritique — bad plan (injury risk + consecutive muscle groups)
// ---------------------------------------------------------------------------

describe('runCritique with a plan that violates injury constraints (integration)', () => {
  it.skipIf(!RUN)(
    'returns revision_suggested or rejected (not approved)',
    async () => {
      const feedback = await runCritique(client, makeBadPlan());

      expect(feedback.status).not.toBe('approved');
    },
    60_000
  );

  it.skipIf(!RUN)(
    'flags injury risk in injuryRiskAnalysis',
    async () => {
      const feedback = await runCritique(client, makeBadPlan());

      // Either the assessment mentions the injury, or riskFactors is non-empty
      const hasInjurySignal =
        feedback.injuryRiskAnalysis.riskFactors.length > 0 ||
        feedback.injuryRiskAnalysis.assessment.toLowerCase().includes('back') ||
        feedback.injuryRiskAnalysis.assessment
          .toLowerCase()
          .includes('deadlift');

      expect(hasInjurySignal).toBe(true);
    },
    60_000
  );
});

// ---------------------------------------------------------------------------
// orchestrate — full flow
// ---------------------------------------------------------------------------

describe('orchestrate (integration)', () => {
  it.skipIf(!RUN)(
    'returns both plan and feedback without throwing',
    async () => {
      const result = await orchestrate();

      expect(result.plan).toBeDefined();
      expect(result.feedback).toBeDefined();
      expect(result.plan.userId).toBe('user-alex-001');
      expect(['approved', 'revision_suggested', 'rejected']).toContain(
        result.feedback.status
      );
    },
    120_000
  );
});
