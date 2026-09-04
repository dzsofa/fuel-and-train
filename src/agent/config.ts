/**
 * User profile configuration — tool-accessible
 * Passed to planner agent via get_user_profile() tool
 *
 * Domain 1 exam concept: agents access external config via tools,
 * not hard-coded system prompts — demonstrates tool-driven personalization
 */

import type { UserProfile, ExerciseMetadata, TrainingSession, ActivityType } from './types';

export const SAMPLE_USER_PROFILE: UserProfile = {
  userId: 'user-alex-001',
  name: 'Alex',
  fitnessLevel: 'intermediate',
  goals: ['strength', 'endurance'],
  availableEquipment: ['barbell', 'dumbbells', 'pull_up_bar', 'resistance_bands', 'bench'],
  hoursPerWeek: 5,
  injuryHistory: ['lower_back_strain_2024']
};

/**
 * Exercise database — fetched by agents via get_exercise_database() tool
 * SI units: duration in minutes/seconds, weights in kg implied from context
 */
export const EXERCISE_DATABASE: ExerciseMetadata[] = [
  {
    name: 'Barbell Back Squat',
    muscleGroups: ['quadriceps', 'glutes', 'hamstrings', 'core'],
    difficulty: 'intermediate',
    equipment: ['barbell', 'rack'],
    notes: 'Compound; avoid if lower_back injury present'
  },
  {
    name: 'Barbell Bench Press',
    muscleGroups: ['chest', 'triceps', 'shoulders', 'core'],
    difficulty: 'intermediate',
    equipment: ['barbell', 'bench'],
    notes: 'Foundational compound lift'
  },
  {
    name: 'Conventional Deadlift',
    muscleGroups: ['hamstrings', 'glutes', 'lower_back', 'traps', 'core'],
    difficulty: 'advanced',
    equipment: ['barbell'],
    notes: 'CAUTION: contraindicated with lower_back injury'
  },
  {
    name: 'Pull-ups',
    muscleGroups: ['lats', 'biceps', 'back', 'core'],
    difficulty: 'intermediate',
    equipment: ['pull_up_bar'],
    notes: 'Bodyweight; scalable with assistance bands'
  },
  {
    name: 'Barbell Bent-Over Rows',
    muscleGroups: ['back', 'biceps', 'lats', 'core'],
    difficulty: 'intermediate',
    equipment: ['barbell'],
    notes: 'Safe lower_back neutral variant available'
  },
  {
    name: 'Standing Overhead Press',
    muscleGroups: ['shoulders', 'triceps', 'chest', 'core'],
    difficulty: 'intermediate',
    equipment: ['barbell', 'dumbbells'],
    notes: 'Core stability required'
  },
  {
    name: 'Leg Press',
    muscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
    difficulty: 'beginner',
    equipment: ['leg_press_machine'],
    notes: 'Lower back–friendly squat alternative'
  },
  {
    name: 'Dumbbell Bench Press',
    muscleGroups: ['chest', 'triceps', 'shoulders', 'core'],
    difficulty: 'intermediate',
    equipment: ['dumbbells', 'bench'],
    notes: 'Greater range of motion than barbell'
  },
  {
    name: 'Planks',
    muscleGroups: ['core', 'shoulders', 'back'],
    difficulty: 'beginner',
    equipment: [],
    notes: 'Isometric; no dynamic spinal loading'
  },
  {
    name: 'Running',
    muscleGroups: ['legs', 'cardiovascular'],
    difficulty: 'beginner',
    equipment: [],
    notes: 'Duration-based, not reps/sets'
  }
];

/**
 * Past training history — fetched from training-log.json via tool
 * Informs progression decisions
 */
export function getRecentTrainingHistory(
  userId: string,
  days: number = 14
): { userId: string; sessions: TrainingSession[] } {
  // Stub: in real implementation, this reads training-log.json and filters
  // by timestamp >= (now - days). Returns entries shaped like the file.
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const sessions: TrainingSession[] = [
    {
      timestamp: '2026-08-05T06:30:00+02:00',
      activity: 'Running' as ActivityType,
      duration_min: 45,
      distance_km: 8.0,
      notes: 'easy pace, zone 2'
    },
    {
      timestamp: '2026-08-06T17:00:00+02:00',
      activity: 'Strength' as ActivityType,
      duration_min: 60,
      notes: 'upper body — bench, rows, shoulder press'
    },
    {
      timestamp: '2026-08-07T07:00:00+02:00',
      activity: 'HIIT' as ActivityType,
      duration_min: 30,
      notes: '4 rounds tabata, kettlebell'
    },
    {
      timestamp: '2026-08-09T09:15:00+02:00',
      activity: 'Cycling' as ActivityType,
      duration_min: 75,
      distance_km: 28.5,
      notes: 'outdoor, hilly route'
    },
    {
      timestamp: '2026-08-10T18:00:00+02:00',
      activity: 'Aerobics' as ActivityType,
      duration_min: 45,
      notes: 'dance aerobics class'
    }
  ].filter(s => new Date(s.timestamp) >= cutoff);

  return { userId, sessions };
}
