/**
 * M5 Agent types — Planner and Critique workflows
 * Domain 1: Agents & Workflows
 *
 * Key distinctions:
 * - UserProfile: user config (fetched via get_user_profile() tool)
 * - Exercise: exercise in a specific workout session (with reps/sets/rest)
 * - WorkoutSession: one day's workout (contains Exercise[])
 * - WorkoutPlan: full week plan (Planner agent OUTPUT)
 * - ExerciseMetadata: reference database entry (Critique agent's get_exercise_database() returns these)
 * - CritiqueFeedback: Critique agent OUTPUT
 */

export interface UserProfile {
  userId: string; 
  name: string;
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  goals: Array<'strength' | 'endurance' | 'flexibility' | 'weight_loss'>;
  availableEquipment: string[]; // e.g., ['dumbbells', 'barbell', 'pull_up_bar']
  hoursPerWeek: number;
  injuryHistory?: string[];
}

export interface Exercise {
  name: string;
  muscleGroups: string[]; // e.g., ['chest', 'triceps', 'shoulders']
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  reps?: number;
  sets?: number;
  durationMinutes?: number;
  restSeconds?: number;
  notes?: string;
}

export interface WorkoutSession {
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  focus: string; // e.g., 'Upper Body Push', 'Cardio', 'Rest Day'
  exercises: Exercise[];
  durationMinutes: number;
  restDayFlag?: boolean;
}

export interface WorkoutPlan {
  userId: string;
  weekStartDate: string; // ISO 8601 format
  fitnessLevel: string;
  goals: string[];
  sessions: WorkoutSession[];
  notes: string;
  progressionStrategy?: string;
}

export interface ExerciseMetadata {
  name: string;
  muscleGroups: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  equipment?: string[];
  notes?: string; // e.g., 'Avoid if lower_back injury present'
}

export type ActivityType =
  | 'Running'
  | 'Cycling'
  | 'Strength'
  | 'Swimming'
  | 'HIIT'
  | 'Aerobics'
  | 'Other';

export interface TrainingSession {
  timestamp: string; // ISO 8601 with timezone offset
  activity: ActivityType;
  duration_min: number;
  distance_km?: number;
  notes?: string;
}

export interface CritiqueFeedback {
  planId: string;
  status: 'approved' | 'revision_suggested' | 'rejected';
  muscleGroupBalance: {
    assessment: string;
    issues: string[];
  };
  recoveryAnalysis: {
    assessment: string;
    issues: string[];
  };
  progressionAnalysis: {
    assessment: string;
    issues: string[];
  };
  injuryRiskAnalysis: {
    assessment: string;
    riskFactors: string[];
  };
  suggestions: string[];
  revisedPlan?: WorkoutPlan;
}
