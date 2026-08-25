/**
 * M5 Agent CLI entry point
 * Run with: pnpm agent
 * Domain 1: Agents & Workflows
 */

import { orchestrate } from './orchestrator';

const result = await orchestrate();

console.log('\n── WORKOUT PLAN ──────────────────────────────');
console.log(JSON.stringify(result.plan, null, 2));

console.log('\n── CRITIQUE FEEDBACK ─────────────────────────');
console.log(JSON.stringify(result.feedback, null, 2));
