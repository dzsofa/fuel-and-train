# M6 — Batch API: Overnight Weekly-Plan Job

Demonstrates the **Message Batches API** (Domain 2, 33.1%).

## What this module does

Submits workout-plan generation requests for multiple users in a single batch call, polls until the batch ends, then writes structured results to `output/batch-results.jsonl`.

## Exam concepts covered

| Domain | Concept | Demonstrated |
|--------|---------|--------------|
| 2 (33.1%) | Message Batches API | `batches.create()`, `batches.retrieve()`, `batches.results()` |
| 2 | Async processing model | Polling loop with configurable interval and timeout |
| 2 | Per-item error handling | Each result has its own `.result.type`; batch-level `ended` ≠ all succeeded |
| 2 | Cost optimisation | Batch pricing is 50% of normal — know when/why to use it |
| 5 (16.8%) | Single-turn structured output | Planner prompt without agentic tool loop (batches are single-turn) |

## Design decisions

### Single-turn requests (no tool loop inside a batch)
Each batch item is one Messages API call: the planner system prompt + a user message with the user profile inlined as context. The full agentic tool loop from M5 cannot run inside a batch item because batches don't support multi-turn interactions. This is a deliberate constraint worth understanding for the exam.

### User profiles from fixture file
Mock user profiles live in `src/batch/fixtures/users.json` (3–5 `UserProfile` objects reusing the type from M5 `src/agent/types.ts`). This follows the M3 seed-data convention and keeps the batch script runnable without a real database.

### Polling strategy
Polls `batches.retrieve(batchId)` on a configurable interval until `processing_status === 'ended'`. Both the poll interval and max-wait timeout come from `config.ts` — no hardcoded values. Default: poll every 5 seconds, give up after 10 minutes.

### Result file format
The Batches API streams JSONL back. Results are written to `output/batch-results.jsonl`, one object per line, matching production usage patterns.

### Batch lifecycle — exam trap
`processing_status: 'ended'` means the batch stopped processing. It does **not** mean every item succeeded. Always iterate items and check each item's `.result.type`:
- `'succeeded'` — `result.message` holds the full Message object
- `'errored'` — `result.error` holds the error; do not attempt to read `.message`
- `'canceled'` — item was not processed

## File structure

```
src/batch/
  batch.ts                  ← Core module: build requests, submit, poll, parse results
  batch.test.ts             ← Unit tests: request builder and result parser (no API calls)
  fixtures/
    users.json              ← Mock UserProfile array (seed data)

scripts/
  batch.ts                  ← CLI entry: --users flag, --dry-run flag, summary output

output/
  batch-results.jsonl       ← Written at runtime; gitignored
```

## Public API of `batch.ts`

```ts
buildBatchRequests(users: UserProfile[]): MessageCreateParamsNonStreaming[]
// Pure function — testable without API

submitBatch(client: Anthropic, requests: ...): Promise<string>
// Returns batchId

pollUntilEnded(client: Anthropic, batchId: string): Promise<MessageBatch>
// Polls on BATCH_POLL_INTERVAL_MS, rejects after BATCH_TIMEOUT_MS

streamResults(client: Anthropic, batchId: string, outPath: string): Promise<BatchSummary>
// Writes JSONL, returns { succeeded, errored, canceled } counts
```

## Running

```sh
# Submit a real batch and wait for results
pnpm batch

# Preview request payload without submitting
pnpm batch --dry-run

# Use a custom user file
pnpm batch --users path/to/users.json
```

## Config keys to add to `config.ts`

| Key | Default | Purpose |
|-----|---------|---------|
| `BATCH_POLL_INTERVAL_MS` | `5000` | How often to poll batch status |
| `BATCH_TIMEOUT_MS` | `600000` | Max wait time (10 min) before giving up |
| `BATCH_OUTPUT_PATH` | `output/batch-results.jsonl` | Where results are written |
