/**
 * M6 Batch CLI entry point
 * Run with: pnpm batch
 *
 * Flags:
 *   --dry-run          Print the batch payload without submitting to the API
 *   --users <path>     Path to a JSON file containing UserProfile[]
 *                      (defaults to src/batch/fixtures/users.json)
 *
 * Domain 2: Applications & Integration — Message Batches API
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';

import { buildBatchRequests, submitBatch, pollUntilEnded, streamResults } from './batch';
import { config } from '@/config';
import type { UserProfile } from '@/agent/types';

// ─── Parse CLI flags ──────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const usersFlag = args.indexOf('--users');

const defaultFixtures = resolve(
  dirname(fileURLToPath(import.meta.url)),
  'fixtures/users.json'
);

const usersPath =
  usersFlag !== -1 && args[usersFlag + 1]
    ? resolve(args[usersFlag + 1])
    : defaultFixtures;

// ─── Load users ───────────────────────────────────────────────────────────────

const users: UserProfile[] = JSON.parse(readFileSync(usersPath, 'utf8'));
console.log(`[BATCH CLI] Loaded ${users.length} user(s) from ${usersPath}`);

// ─── Build requests ───────────────────────────────────────────────────────────

const requests = buildBatchRequests(users);

if (dryRun) {
  console.log('\n[BATCH CLI] --dry-run: printing payload (not submitting)\n');
  console.log(JSON.stringify(requests, null, 2));
  process.exit(0);
}

// ─── Submit → Poll → Stream ───────────────────────────────────────────────────

const client = new Anthropic();

const batchId = await submitBatch(client, requests);

console.log(`\n[BATCH CLI] Polling every ${config.batchPollIntervalMs}ms (timeout: ${config.batchTimeoutMs}ms)...`);
await pollUntilEnded(client, batchId);

const summary = await streamResults(client, batchId);

// ─── Summary table ────────────────────────────────────────────────────────────

console.log('\n[BATCH CLI] ─────────────────────────────────');
console.log(`  Batch ID  : ${summary.batchId}`);
console.log(`  Succeeded : ${summary.succeeded}`);
console.log(`  Errored   : ${summary.errored}`);
console.log(`  Canceled  : ${summary.canceled}`);
console.log(`  Output    : ${summary.outputPath}`);
console.log('[BATCH CLI] ─────────────────────────────────\n');
