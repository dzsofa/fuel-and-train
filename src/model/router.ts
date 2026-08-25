import { Model, type AllowedModel } from './models';
import type { TaskType } from './types';

export interface RouteConfig {
  modelId: AllowedModel;
  maxTokens: number;
  enableCaching: boolean;
  label: string;
}

const ROUTES: Record<TaskType, RouteConfig> = {
  macro_lookup: {
    modelId: Model.Haiku,
    maxTokens: 512,
    enableCaching: false,
    label: 'Haiku / fast path'
  },
  meal_chat: {
    modelId: Model.Sonnet,
    maxTokens: 1024,
    enableCaching: true,
    label: 'Sonnet / conversational'
  },
  weekly_review: {
    modelId: Model.Opus,
    maxTokens: 2048,
    enableCaching: true,
    label: 'Opus / deep analysis'
  },
  workout_planning: {
    modelId: Model.Sonnet,
    maxTokens: 6000, // Compact 5-session plan (3 exercises each) + thinking overhead
    enableCaching: true,
    label: 'Sonnet / workout planner agent'
  },
  plan_critique: {
    modelId: Model.Opus,
    maxTokens: 3000, // Concise critique JSON (short assessments, ≤15-word list items)
    enableCaching: true,
    label: 'Opus / critique agent (safety-critical)'
  }
};

const DEFAULT_ROUTE: RouteConfig = ROUTES.meal_chat;

export function route(task: TaskType): RouteConfig {
  return ROUTES[task] ?? DEFAULT_ROUTE;
}
