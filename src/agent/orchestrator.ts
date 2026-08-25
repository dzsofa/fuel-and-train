/**
 * M5 Agent Orchestrator
 * Domain 1: Agents & Workflows
 *
 * Runs the two-agent workflow:
 *   1. Planner agent  → generates WorkoutPlan  (Sonnet)
 *   2. Critique agent → generates CritiqueFeedback (Opus)
 *
 * Usage:
 *   const result = await orchestrate();
 *   console.log(result.plan, result.feedback);
 */

import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam } from '@anthropic-ai/sdk/resources';

import { runToolLoop } from '@/tools/loop';
import { route } from '@/model/router';

import { getPlannerSystemPrompt } from './planner.system';
import { PLANNER_TOOLS, handlePlannerToolCall } from './planner-tools';

import { getCritiqueSystemPrompt } from './critique.system';
import { CRITIQUE_TOOLS, handleCritiqueToolCall } from './critique-tools';

import type { WorkoutPlan, CritiqueFeedback } from './types';

// Strip markdown code fences if the model wraps JSON in ```json ... ```
// Handles both complete (closing ```) and truncated (no closing ```) output.
export function stripCodeFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, '')  // strip opening fence + optional language tag
    .replace(/\s*```\s*$/, '')         // strip closing fence if present
    .trim();
}

// ============================================================================
// PLANNER
// ============================================================================

export async function runPlanner(client: Anthropic): Promise<WorkoutPlan> {
  const messages: MessageParam[] = [
    {
      role: 'user',
      content:
        'Generate a compact weekly workout plan for user user-alex-001. Training sessions only (max 5), max 3 exercises each.'
    }
  ];

  console.log('\n[PLANNER] Starting planner agent (Sonnet)...');

  const raw = await runToolLoop(
    client,
    messages,
    PLANNER_TOOLS,
    handlePlannerToolCall,
    getPlannerSystemPrompt(),
    route('workout_planning')
  );

  try {
    const plan = JSON.parse(stripCodeFences(raw)) as WorkoutPlan;
    console.log(
      `[PLANNER] Done — ${plan.sessions.length} sessions, userId: ${plan.userId}`
    );
    return plan;
  } catch {
    throw new Error(
      `[PLANNER] Failed to parse WorkoutPlan JSON.\nRaw output:\n${raw}`
    );
  }
}

// ============================================================================
// CRITIQUE
// ============================================================================

export async function runCritique(
  client: Anthropic,
  plan: WorkoutPlan
): Promise<CritiqueFeedback> {
  const messages: MessageParam[] = [
    {
      role: 'user',
      content: `Review this workout plan and return a CritiqueFeedback JSON:\n\n${JSON.stringify(plan, null, 2)}`
    }
  ];

  console.log('\n[CRITIQUE] Starting critique agent (Opus)...');

  const raw = await runToolLoop(
    client,
    messages,
    CRITIQUE_TOOLS,
    handleCritiqueToolCall,
    getCritiqueSystemPrompt(),
    route('plan_critique')
  );

  try {
    const feedback = JSON.parse(stripCodeFences(raw)) as CritiqueFeedback;
    console.log(`[CRITIQUE] Done — status: ${feedback.status}`);
    return feedback;
  } catch {
    throw new Error(
      `[CRITIQUE] Failed to parse CritiqueFeedback JSON.\nRaw output:\n${raw}`
    );
  }
}

// ============================================================================
// ORCHESTRATOR
// ============================================================================

export interface OrchestratorResult {
  plan: WorkoutPlan;
  feedback: CritiqueFeedback;
}

export async function orchestrate(): Promise<OrchestratorResult> {
  const client = new Anthropic();

  // Step 1: Generate plan
  const plan = await runPlanner(client);

  // Step 2: Critique plan
  const feedback = await runCritique(client, plan);

  // Step 3: Log outcome
  console.log('\n[ORCHESTRATOR] ─────────────────────────────');
  console.log(`  Status   : ${feedback.status}`);
  console.log(`  Plan ID  : ${feedback.planId}`);
  console.log(`  Sessions : ${plan.sessions.length}`);

  if (feedback.status === 'approved') {
    console.log('  ✓ Plan approved — ready to use.');
  } else if (feedback.status === 'revision_suggested') {
    console.log('  ℹ Suggestions:');
    feedback.suggestions.forEach((s) => console.log(`    • ${s}`));
  } else {
    console.log('  ✗ Plan rejected:');
    console.log(`    Balance  : ${feedback.muscleGroupBalance.assessment}`);
    console.log(`    Recovery : ${feedback.recoveryAnalysis.assessment}`);
    console.log(`    Injury   : ${feedback.injuryRiskAnalysis.assessment}`);
  }
  console.log('[ORCHESTRATOR] ─────────────────────────────\n');

  return { plan, feedback };
}
