/**
 * Critique Agent Tool Definitions & Schemas
 *
 * Domain 8 exam: tool definitions, handler stubs.
 * Critique agent has fewer tools than planner; focuses on review & decision.
 */

import { Tool } from '@anthropic-ai/sdk/resources';
import { SAMPLE_USER_PROFILE, EXERCISE_DATABASE, getRecentTrainingHistory } from './config';
import type { WorkoutPlan, CritiqueFeedback } from './types';

/**
 * Tool 1: get_user_profile
 * Critique agent re-fetches user profile to cross-check constraints
 */
export const CRITIQUE_TOOL_GET_USER_PROFILE: Tool = {
  name: 'get_user_profile',
  description: 'Fetch user profile to verify plan compliance with constraints (equipment, injury history, session limits).',
  input_schema: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'User ID'
      }
    },
    required: ['userId']
  }
};

/**
 * Tool 2: get_exercise_database
 * Critique agent checks exercise metadata for safety & appropriateness
 */
export const CRITIQUE_TOOL_GET_EXERCISE_DATABASE: Tool = {
  name: 'get_exercise_database',
  description: 'Fetch exercise database to verify selected exercises match user level, equipment, and safety constraints.',
  input_schema: {
    type: 'object',
    properties: {
      exerciseNames: {
        type: 'array',
        items: { type: 'string' },
        description: 'Filter by exercise names to look up (e.g., ["Barbell Back Squat", "Pull-ups"]). Omit to return the full database.'
      }
    },
    required: []
  }
};

/**
 * Tool 3: parse_plan
 * Critique agent validates the planner's JSON output structure
 */
export const CRITIQUE_TOOL_PARSE_PLAN: Tool = {
  name: 'parse_plan',
  description: 'Parse and validate the workout plan JSON structure. Returns validation errors if schema is malformed.',
  input_schema: {
    type: 'object',
    properties: {
      planJson: {
        type: 'string',
        description: 'The workout plan as a JSON string (or object if already parsed)'
      }
    },
    required: ['planJson']
  }
};

/**
 * Tool 4: reject_plan
 * Critique agent explicitly rejects a plan with reasons (for structured output)
 */
export const CRITIQUE_TOOL_REJECT_PLAN: Tool = {
  name: 'reject_plan',
  description: 'Formally reject the plan. Use when critical issues are detected (injury risk, constraint violations, imbalance). Call this to structure rejection feedback.',
  input_schema: {
    type: 'object',
    properties: {
      reason: {
        type: 'string',
        description: 'Primary reason for rejection'
      },
      details: {
        type: 'string',
        description: 'Detailed explanation'
      },
      suggestions: {
        type: 'array',
        items: { type: 'string' },
        description: 'Revision suggestions (at least 2)'
      }
    },
    required: ['reason', 'details', 'suggestions']
  }
};

/**
 * Tool 5: approve_plan
 * Critique agent explicitly approves a plan (for structured output)
 */
export const CRITIQUE_TOOL_APPROVE_PLAN: Tool = {
  name: 'approve_plan',
  description: 'Formally approve the plan. Use when all checks pass. Call this to structure approval feedback.',
  input_schema: {
    type: 'object',
    properties: {
      summary: {
        type: 'string',
        description: 'Brief summary of plan strengths'
      },
      minorSuggestions: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional minor refinements (not blockers)'
      }
    },
    required: ['summary']
  }
};

/**
 * CRITIQUE TOOL HANDLERS
 */

export function handleCritiqueToolCall(toolName: string, input: unknown): unknown {
  const params = input as Record<string, any>;

  switch (toolName) {
    case 'get_user_profile':
      return {
        success: true,
        profile: SAMPLE_USER_PROFILE
      };

    case 'get_exercise_database':
      if (params.exerciseNames && Array.isArray(params.exerciseNames)) {
        const exercises = EXERCISE_DATABASE.filter(
          (ex) => params.exerciseNames.includes(ex.name)
        );
        return {
          success: true,
          count: exercises.length,
          exercises
        };
      }
      return {
        success: true,
        count: EXERCISE_DATABASE.length,
        exercises: EXERCISE_DATABASE
      };

    case 'parse_plan':
      try {
        const plan = typeof params.planJson === 'string'
          ? JSON.parse(params.planJson)
          : params.planJson;
        // Basic schema validation
        const hasRequiredFields = plan.userId && plan.weekStartDate && plan.sessions;
        return {
          success: true,
          isValid: !!hasRequiredFields,
          errors: hasRequiredFields ? [] : ['Missing userId, weekStartDate, or sessions'],
          parsedPlan: plan
        };
      } catch (e) {
        return {
          success: false,
          isValid: false,
          errors: [`JSON parse error: ${e}`]
        };
      }

    case 'reject_plan':
      // Log rejection and return structured feedback
      console.log(`[CRITIQUE] Plan REJECTED: ${params.reason}`);
      console.log(`Details: ${params.details}`);
      console.log(`Suggestions: ${(params.suggestions || []).join('; ')}`);
      return {
        success: true,
        action: 'reject',
        reason: params.reason,
        details: params.details,
        suggestions: params.suggestions || []
      };

    case 'approve_plan':
      console.log(`[CRITIQUE] Plan APPROVED: ${params.summary}`);
      return {
        success: true,
        action: 'approve',
        summary: params.summary,
        minorSuggestions: params.minorSuggestions || []
      };

    default:
      throw new Error(`Unknown critique tool: ${toolName}`);
  }
}

/**
 * Export critique tools as array
 */
export const CRITIQUE_TOOLS: Tool[] = [
  CRITIQUE_TOOL_GET_USER_PROFILE,
  CRITIQUE_TOOL_GET_EXERCISE_DATABASE,
  CRITIQUE_TOOL_PARSE_PLAN,
  CRITIQUE_TOOL_REJECT_PLAN,
  CRITIQUE_TOOL_APPROVE_PLAN
];
