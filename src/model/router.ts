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
  }
};

const DEFAULT_ROUTE: RouteConfig = ROUTES.meal_chat;

export function route(task: TaskType): RouteConfig {
  return ROUTES[task] ?? DEFAULT_ROUTE;
}
