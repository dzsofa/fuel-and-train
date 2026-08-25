/**
 * Planner Agent Tool Definitions & Schemas
 *
 * Domain 8 exam: tool definitions (JSON schemas), input validation, handler stubs
 */

import { Tool } from '@anthropic-ai/sdk/resources';
import type { ExerciseMetadata, UserProfile } from './types';
import {
  SAMPLE_USER_PROFILE,
  EXERCISE_DATABASE,
  getRecentTrainingHistory
} from './config';

/**
 * Tool 1: get_user_profile
 * Planner fetches user configuration to personalize plan
 */
export const PLANNER_TOOL_GET_USER_PROFILE: Tool = {
  name: 'get_user_profile',
  description:
    "Fetch the user's fitness profile including level, goals, equipment, injury history, and session preferences. Call this first to understand constraints.",
  input_schema: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'User ID to fetch profile for (e.g., "user-001")'
      }
    },
    required: ['userId']
  }
};

/**
 * Tool 2: get_exercise_database
 * Planner looks up exercise metadata (muscle groups, difficulty, equipment, safety notes)
 */
export const PLANNER_TOOL_GET_EXERCISE_DATABASE: Tool = {
  name: 'get_exercise_database',
  description:
    'Fetch the exercise database with muscle groups, difficulty, equipment requirements, and safety notes. Use to select exercises matching user profile.',
  input_schema: {
    type: 'object',
    properties: {
      filters: {
        type: 'object',
        description: 'Optional filters to narrow results',
        properties: {
          muscleGroup: {
            type: 'string',
            description:
              'Filter by muscle group (e.g., "chest", "legs", "back")'
          },
          difficulty: {
            type: 'string',
            enum: ['beginner', 'intermediate', 'advanced'],
            description: 'Filter by difficulty'
          },
          equipment: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter by equipment (e.g., ["barbell", "dumbbells"])'
          },
          excludeByName: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Exclude specific exercises (e.g., ["deadlift"] for injury contraindications) based on name'
          }
        }
      }
    },
    required: []
  }
};

/**
 * Tool 3: get_training_history
 * Planner checks recent sessions to inform progression decisions
 */
export const PLANNER_TOOL_GET_TRAINING_HISTORY: Tool = {
  name: 'get_training_history',
  description:
    "Fetch user's recent training history (past sessions, exercises, dates) to inform progression and avoid overloading.",
  input_schema: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'User ID'
      },
      daysBack: {
        type: 'number',
        description: 'How many days back to fetch (default 14)',
        default: 14
      }
    },
    required: ['userId']
  }
};

/**
 * Tool 4: validate_user_profile
 * Planner flags incomplete or conflicting profile data
 */
export const PLANNER_TOOL_VALIDATE_USER_PROFILE: Tool = {
  name: 'validate_user_profile',
  description:
    'Validate user profile completeness. Returns any missing or conflicting fields that would affect plan quality.',
  input_schema: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'User ID to validate'
      }
    },
    required: ['userId']
  }
};

/**
 * PLANNER TOOL HANDLERS
 * These are called by the tool-use loop; in real code, they'd read from JSON files
 */

export function handlePlannerToolCall(
  toolName: string,
  input: unknown
): unknown {
  const params = input as Record<string, any>;

  switch (toolName) {
    case 'get_user_profile':
      return {
        success: true,
        profile: SAMPLE_USER_PROFILE,
        note: 'Profile loaded from config'
      };

    case 'get_exercise_database':
      // Apply filters if provided
      let exercises: ExerciseMetadata[] = [...EXERCISE_DATABASE];
      if (params.filters?.excludeByName) {
        const excluded = params.filters.excludeByName as string[];
        exercises = exercises.filter((ex: any) => !excluded.includes(ex.name));
      }
      if (params.filters?.difficulty) {
        exercises = exercises.filter(
          (ex: any) => ex.difficulty === params.filters.difficulty
        );
      }
      if (params.filters?.equipment) {
        const required = params.filters.equipment as string[];
        exercises = exercises.filter((ex: any) =>
          required.some((eq) => ex.equipment?.includes(eq))
        );
      }
      return {
        success: true,
        count: exercises.length,
        exercises
      };

    case 'get_training_history':
      return {
        success: true,
        ...getRecentTrainingHistory(params.userId, params.daysBack ?? 14)
      };

    case 'validate_user_profile':
      // Stub: would check all required fields
      return {
        success: true,
        isValid: true,
        missingFields: [],
        conflicts: []
      };

    default:
      throw new Error(`Unknown planner tool: ${toolName}`);
  }
}

/**
 * Export planner tools as array (for runToolLoop)
 */
export const PLANNER_TOOLS: Tool[] = [
  PLANNER_TOOL_GET_USER_PROFILE,
  PLANNER_TOOL_GET_EXERCISE_DATABASE,
  PLANNER_TOOL_GET_TRAINING_HISTORY,
  PLANNER_TOOL_VALIDATE_USER_PROFILE
];
