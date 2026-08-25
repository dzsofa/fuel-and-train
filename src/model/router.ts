import { Model, type AllowedModel } from './models';
import type { TaskType } from './types';

export interface RouteConfig {
  modelId: AllowedModel;
  maxTokens: number;
  enableCaching: boolean;
  label: string;
  effort: 'low' | 'medium' | 'high';
}

const ROUTES: Record<TaskType, RouteConfig> = {
  macro_lookup: {
    modelId: Model.Haiku,
    maxTokens: 512,
    enableCaching: false,
    label: 'Haiku / fast path',
    effort: 'low'
  },
  meal_chat: {
    modelId: Model.Sonnet,
    maxTokens: 1024,
    enableCaching: true,
    label: 'Sonnet / conversational',
    effort: 'low'
  },
  weekly_review: {
    modelId: Model.Opus,
    maxTokens: 2048,
    enableCaching: true,
    label: 'Opus / deep analysis',
    effort: 'medium'
  },
  workout_planning: {
    modelId: Model.Sonnet,
    maxTokens: 6000,
    enableCaching: true,
    label: 'Sonnet / workout planner agent',
    effort: 'medium'
  },
  plan_critique: {
    modelId: Model.Opus,
    maxTokens: 3000,
    enableCaching: true,
    label: 'Opus / critique agent (safety-critical)',
    effort: 'medium'
  }
};

const DEFAULT_ROUTE: RouteConfig = ROUTES.meal_chat;

export function route(task: TaskType): RouteConfig {
  return ROUTES[task] ?? DEFAULT_ROUTE;
}
