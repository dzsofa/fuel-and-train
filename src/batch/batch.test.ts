/**
 * M6 Batch unit tests
 *
 * Covers:
 *  - buildBatchRequests  (pure function — no API call)
 *  - streamResults       (mocked SDK client)
 *
 * Integration test (real API) is guarded by INTEGRATION env var.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { buildBatchRequests } from './batch';
import type { UserProfile } from '@/agent/types';
import { Model } from '@/model/models';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const USERS: UserProfile[] = [
  {
    userId: 'user-alex-001',
    name: 'Alex',
    fitnessLevel: 'intermediate',
    goals: ['strength'],
    availableEquipment: ['dumbbells', 'barbell'],
    hoursPerWeek: 4,
  },
  {
    userId: 'user-morgan-002',
    name: 'Morgan',
    fitnessLevel: 'beginner',
    goals: ['weight_loss'],
    availableEquipment: ['resistance_bands'],
    hoursPerWeek: 3,
    injuryHistory: ['lower_back_strain'],
  },
];

// ─── buildBatchRequests ───────────────────────────────────────────────────────

describe('buildBatchRequests', () => {
  it('returns one request per user', () => {
    const requests = buildBatchRequests(USERS);
    expect(requests).toHaveLength(USERS.length);
  });

  it('uses userId as custom_id', () => {
    const requests = buildBatchRequests(USERS);
    expect(requests[0].custom_id).toBe('user-alex-001');
    expect(requests[1].custom_id).toBe('user-morgan-002');
  });

  it('uses Haiku model for cost efficiency', () => {
    const requests = buildBatchRequests(USERS);
    requests.forEach((r) => expect(r.params.model).toBe(Model.Haiku));
  });

  it('inlines the user profile JSON into the user message', () => {
    const requests = buildBatchRequests(USERS);
    const content = requests[1].params.messages[0].content as string;
    expect(content).toContain('user-morgan-002');
    expect(content).toContain('lower_back_strain');
  });

  it('includes a system prompt in every request', () => {
    const requests = buildBatchRequests(USERS);
    requests.forEach((r) => {
      expect(typeof r.params.system).toBe('string');
      expect((r.params.system as string).length).toBeGreaterThan(0);
    });
  });

  it('returns empty array for empty input', () => {
    expect(buildBatchRequests([])).toEqual([]);
  });

  it('each request has exactly one user message', () => {
    const requests = buildBatchRequests(USERS);
    requests.forEach((r) => {
      expect(r.params.messages).toHaveLength(1);
      expect(r.params.messages[0].role).toBe('user');
    });
  });
});

// ─── streamResults (mocked) ───────────────────────────────────────────────────

describe('streamResults', () => {
  afterEach(() => vi.restoreAllMocks());

  it('writes JSONL and returns correct summary counts', async () => {
    // Dynamically import to allow vi.mock to work with the module
    const { streamResults } = await import('./batch');

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'batch-test-'));
    const outPath = path.join(tmpDir, 'results.jsonl');

    // Mock the async iterator that batches.results() returns
    const mockResults = [
      {
        custom_id: 'user-alex-001',
        result: {
          type: 'succeeded',
          message: {
            content: [{ type: 'text', text: '{"userId":"user-alex-001","sessions":[]}' }],
            usage: { input_tokens: 100, output_tokens: 50 },
          },
        },
      },
      {
        custom_id: 'user-morgan-002',
        result: {
          type: 'errored',
          error: { type: 'server_error', message: 'Internal error' },
        },
      },
      {
        custom_id: 'user-sam-003',
        result: { type: 'canceled' },
      },
    ];

    const mockClient = {
      messages: {
        batches: {
          results: vi.fn().mockResolvedValue(mockResults),
        },
      },
    } as unknown as import('@anthropic-ai/sdk').default;

    const summary = await streamResults(mockClient, 'batch-test-id', outPath);

    expect(summary.succeeded).toBe(1);
    expect(summary.errored).toBe(1);
    expect(summary.canceled).toBe(1);
    expect(summary.batchId).toBe('batch-test-id');
    expect(summary.outputPath).toBe(outPath);

    // Verify JSONL file contents
    const lines = fs
      .readFileSync(outPath, 'utf8')
      .trim()
      .split('\n')
      .map((l) => JSON.parse(l));

    expect(lines).toHaveLength(3);
    expect(lines[0]).toMatchObject({ custom_id: 'user-alex-001', result_type: 'succeeded' });
    expect(lines[1]).toMatchObject({ custom_id: 'user-morgan-002', result_type: 'errored' });
    expect(lines[2]).toMatchObject({ custom_id: 'user-sam-003', result_type: 'canceled' });

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true });
  });
});

// ─── Integration tests ───────────────────────────────────────────────────────
//
// Split into two tests:
//   1. submit-and-cancel  — verifies the Batches API surface, returns quickly
//   2. poll-and-stream    — end-to-end but only run manually (INTEGRATION_FULL=1)
//      because real batches can take minutes to hours to reach 'ended'.
//
// Run with: INTEGRATION=1 pnpm test
// Full run:  INTEGRATION=1 INTEGRATION_FULL=1 pnpm test

describe.skipIf(!process.env['INTEGRATION'])('Batch API integration', () => {
  it('submits a batch, verifies the ID, then cancels immediately', async () => {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const { buildBatchRequests, submitBatch } = await import('./batch');

    const client = new Anthropic();
    const requests = buildBatchRequests(USERS.slice(0, 1)); // one request for cost control
    const batchId = await submitBatch(client, requests);

    expect(typeof batchId).toBe('string');
    expect(batchId.startsWith('msgbatch_')).toBe(true);

    // Cancel immediately — we verified the API surface; no need to wait
    const cancelled = await client.messages.batches.cancel(batchId);
    expect(['canceling', 'ended']).toContain(cancelled.processing_status);
  }, 30_000);

  it.skipIf(!process.env['INTEGRATION_FULL'])(
    'polls until ended and streams results (slow — may take minutes)',
    async () => {
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const { buildBatchRequests, submitBatch, pollUntilEnded, streamResults } =
        await import('./batch');

      const client = new Anthropic();
      const requests = buildBatchRequests(USERS.slice(0, 1));
      const batchId = await submitBatch(client, requests);

      const batch = await pollUntilEnded(client, batchId);
      expect(batch.processing_status).toBe('ended');

      const tmpPath = path.join(os.tmpdir(), `batch-integration-${Date.now()}.jsonl`);
      const summary = await streamResults(client, batchId, tmpPath);
      expect(summary.succeeded + summary.errored + summary.canceled).toBe(1);
      fs.unlinkSync(tmpPath);

      // Also cancel any lingering batch (safety net)
      await client.messages.batches.cancel(batchId).catch(() => {/* already ended */});
    },
    600_000 // 10-minute ceiling
  );
});
