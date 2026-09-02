/**
 * M6 — Batch API: Overnight Weekly-Plan Job
 * Domain 2: Applications & Integration
 *
 * Submits one workout-plan request per user as a Message Batch, polls until
 * ended, then streams results to a JSONL file.
 *
 * Key exam concept: batch `processing_status: 'ended'` does NOT mean every
 * item succeeded — always check each item's `.result.type` individually.
 *
 * Batches are billed at 50% of normal cost and are ideal for async,
 * non-time-sensitive workloads.
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  MessageCreateParamsNonStreaming,
} from '@anthropic-ai/sdk/resources/messages';
import fs from 'node:fs';
import path from 'node:path';

import { config } from '@/config';
import { Model } from '@/model/models';
import type { UserProfile } from '@/agent/types';
import { getPlannerSystemPrompt } from '@/agent/planner.system';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BatchRequest {
  custom_id: string;
  params: MessageCreateParamsNonStreaming;
}

export interface BatchSummary {
  batchId: string;
  succeeded: number;
  errored: number;
  canceled: number;
  outputPath: string;
}

// ─── Build requests ───────────────────────────────────────────────────────────

/**
 * Pure function — no API call, fully testable.
 *
 * Builds one BatchRequest per user. The user profile is inlined into the user
 * message as JSON context because batches are single-turn: the agentic tool
 * loop cannot run inside a batch item.
 */
export function buildBatchRequests(users: UserProfile[]): BatchRequest[] {
  return users.map((user) => ({
    custom_id: user.userId,
    params: {
      model: Model.Haiku, // Cost-efficient for batch; single-turn structured output
      max_tokens: 1024,
      system: getPlannerSystemPrompt(),
      messages: [
        {
          role: 'user',
          content: `Generate a weekly workout plan for the following user. Return ONLY valid JSON — no markdown, no prose.

User profile:
${JSON.stringify(user, null, 2)}`,
        },
      ],
    } satisfies MessageCreateParamsNonStreaming,
  }));
}

// ─── Submit ───────────────────────────────────────────────────────────────────

/**
 * Submits the batch to the Batches API.
 * Returns the batchId for use in polling and result retrieval.
 */
export async function submitBatch(
  client: Anthropic,
  requests: BatchRequest[]
): Promise<string> {
  console.log(`[BATCH] Submitting ${requests.length} requests...`);

  const batch = await client.messages.batches.create({
    requests: requests.map((r) => ({
      custom_id: r.custom_id,
      params: r.params,
    })),
  });

  console.log(`[BATCH] Submitted — id: ${batch.id}, status: ${batch.processing_status}`);
  console.log(
    `[BATCH] Request counts: ${JSON.stringify(batch.request_counts)}`
  );

  return batch.id;
}

// ─── Poll ─────────────────────────────────────────────────────────────────────

/**
 * Polls batches.retrieve() until processing_status === 'ended'.
 *
 * Exam note: 'ended' is the only terminal status. There is no 'succeeded'
 * at the batch level. The batch ends regardless of per-item errors.
 *
 * Rejects with a timeout error if BATCH_TIMEOUT_MS is exceeded.
 */
export async function pollUntilEnded(
  client: Anthropic,
  batchId: string
): Promise<Anthropic.Messages.MessageBatch> {
  const deadline = Date.now() + config.batchTimeoutMs;

  while (true) {
    const batch = await client.messages.batches.retrieve(batchId);

    console.log(
      `[BATCH] Status: ${batch.processing_status} | ` +
        `counts: ${JSON.stringify(batch.request_counts)}`
    );

    if (batch.processing_status === 'ended') {
      console.log('[BATCH] Processing ended.');
      return batch;
    }

    if (Date.now() + config.batchPollIntervalMs > deadline) {
      throw new Error(
        `[BATCH] Timed out after ${config.batchTimeoutMs}ms waiting for batch ${batchId}`
      );
    }

    await sleep(config.batchPollIntervalMs);
  }
}

// ─── Stream results ───────────────────────────────────────────────────────────

/**
 * Streams batch results to a JSONL file and returns a summary.
 *
 * Each line in the output file is one JSON object:
 *   { custom_id, result_type, content | error }
 *
 * Per-item result types:
 *   'succeeded' — result.message holds the full Message
 *   'errored'   — result.error holds the error; no .message
 *   'canceled'  — item was not processed
 */
export async function streamResults(
  client: Anthropic,
  batchId: string,
  outPath: string = config.batchOutputPath
): Promise<BatchSummary> {
  // Ensure output directory exists
  const dir = path.dirname(outPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const stream = fs.createWriteStream(outPath, { encoding: 'utf8' });

  const summary: BatchSummary = {
    batchId,
    succeeded: 0,
    errored: 0,
    canceled: 0,
    outputPath: outPath,
  };

  console.log(`[BATCH] Streaming results to ${outPath}...`);

  for await (const result of await client.messages.batches.results(batchId)) {
    const type = result.result.type;

    let record: Record<string, unknown>;

    if (type === 'succeeded') {
      summary.succeeded++;
      record = {
        custom_id: result.custom_id,
        result_type: 'succeeded',
        content: result.result.message.content,
        usage: result.result.message.usage,
      };
    } else if (type === 'errored') {
      summary.errored++;
      record = {
        custom_id: result.custom_id,
        result_type: 'errored',
        error: result.result.error,
      };
    } else {
      // 'canceled'
      summary.canceled++;
      record = {
        custom_id: result.custom_id,
        result_type: 'canceled',
      };
    }

    stream.write(JSON.stringify(record) + '\n');
  }

  await new Promise<void>((resolve, reject) => {
    stream.end((err: Error | null | undefined) => (err ? reject(err) : resolve()));
  });

  console.log(
    `[BATCH] Results written — succeeded: ${summary.succeeded}, ` +
      `errored: ${summary.errored}, canceled: ${summary.canceled}`
  );

  return summary;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
