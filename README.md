# Fuel & Train

Personal nutrition and training assistant — built as a hands-on study project for the **Claude Certified Developer – Foundations** exam (CCDV-F, v1.0).

Covers all eight exam domains across ten incremental milestones. Primary language: TypeScript. MCP server: Python (M7).

## Prerequisites

- Node v22
- pnpm
- An Anthropic API key

## Setup

```bash
pnpm install
cp .env.example .env   # add ANTHROPIC_API_KEY and ANTHROPIC_MODEL
```

## Scripts

| Command | What it does |
|---|---|
| `pnpm hello` | M1: single Messages API call — prints response + token usage |
| `pnpm hello-stream` | M1: streaming Messages API call — tokens arrive in real time |
| `pnpm intake` | M2: vision call — reads a food photo from `assets/`, returns structured recipe JSON |
| `pnpm tools` | M3–M4: tool-use loop with custom scaling/macro tools; `--task <type>` flag routes to Haiku/Sonnet/Opus |
| `pnpm agent` | M5: two-agent workout planner (Sonnet) + critique (Opus) via orchestrator |
| `pnpm batch` | M6: submit an overnight batch of workout plans, poll until ended, stream JSONL results |
| `pnpm batch:dry` | M6: print the batch payload without submitting (useful for inspecting request shapes) |

## Project structure

```
assets/                        ← test food photos for the intake script
output/                        ← runtime output (gitignored); batch results written here
src/
  config.ts                    ← model IDs, token limits, batch config — all from .env (no hardcoded values)
  model/
    models.ts                  ← AllowedModel union type and Model enum
    router.ts                  ← task-based model routing (workout_planning → Sonnet, etc.)
  client/
    hello.ts                   ← M1: basic Messages API call
    hello-stream.ts            ← M1: streaming Messages API call
  intake/
    intake.ts                  ← M2: vision + native JSON schema output
  tools/
    definitions.ts             ← M3: tool schemas (scale_recipe, calculate_macros, get_pantry_item)
    handlers.ts                ← M3: pure handler functions + dispatch
    loop.ts                    ← M3–M4: reusable runToolLoop (agentic tool-use loop)
    chat.ts                    ← M3–M4: CLI entry with --task flag
  agent/
    types.ts                   ← M5: UserProfile, WorkoutPlan, CritiqueFeedback, etc.
    planner.system.ts          ← M5: planner system prompt
    planner-tools.ts           ← M5: planner tool definitions + handlers
    critique.system.ts         ← M5: critique system prompt
    critique-tools.ts          ← M5: critique tool definitions + handlers
    orchestrator.ts            ← M5: planner → critique orchestration
    agent.ts                   ← M5: CLI entry
  batch/
    batch.ts                   ← M6: buildBatchRequests, submitBatch, pollUntilEnded, streamResults
    batch-cli.ts               ← M6: CLI entry with --dry-run and --users flags
    fixtures/users.json        ← M6: mock UserProfile array (seed data)
    README.md                  ← M6: architecture, design decisions, exam concepts
```

## Testing

```bash
pnpm test                            # unit tests (no API calls)
INTEGRATION=1 pnpm test              # + real API integration tests (submit-and-cancel pattern)
INTEGRATION=1 INTEGRATION_FULL=1 pnpm test   # + slow batch poll-and-stream (may take minutes)
```

### Integration test strategy

Most integration tests make a real API call and return quickly (under 30s). The batch integration test is an exception — it submits a real batch and **immediately cancels it** rather than waiting for results. This is intentional:

- The Batch API is asynchronous and offline. After `create()` returns, Anthropic queues the job. Processing typically takes minutes but the SLA allows up to 24 hours. A time-bounded test that waits for completion is unreliable.
- The submit-and-cancel test verifies the API surface (auth, request shape, valid `batchId`) without blocking.
- The full poll-and-stream path is covered by unit tests with a mocked client (`streamResults` mock test in `batch.test.ts`).
- End-to-end batch completion can be verified manually with `pnpm batch` or with `INTEGRATION_FULL=1`.

## Conventions

- **SI units everywhere** — grams, millilitres, Celsius, kilometres in all tool schemas, prompts, and seed data.
- **No hardcoded values** — model IDs, token limits, poll intervals go in `config.ts` or `.env`.
- **Seed data** — fixture files created when the first milestone that needs them is built; not before.
- **Test layers** — unit (co-located, no API), integration (`tests/integration/`, `INTEGRATION=1`), eval (`pnpm eval`, M10 only).

## Key findings (exam-relevant)

### Batch API
- `processing_status: 'ended'` means the batch stopped processing — it does **not** mean all items succeeded. Always iterate results and check each item's `.result.type` (`'succeeded'` | `'errored'` | `'canceled'`) independently.
- Batches are billed at **50% of normal cost** — the exam tests when/why to use batch vs. real-time Messages API.
- Batches are **single-turn only** — the agentic tool-use loop cannot run inside a batch item. User context must be inlined into the message.
- Cancelling a batch transitions it to `'canceling'` then `'ended'`; items already processed keep their results.

### Tool-use loop
- The loop in `tools/loop.ts` exits on `stop_reason: 'end_turn'`. Tool results are appended as `tool_result` blocks and the loop continues until Claude stops calling tools.
- Error responses from handlers are returned as `tool_result` blocks with `is_error: true` — the model sees them and can decide how to proceed rather than crashing.

### Model routing
- Routing by task type (`router.ts`) keeps model selection out of business logic. Each route specifies model, `max_tokens`, and `cache_control` settings.
- Prompt caching requires the system prompt to be a content block (`{ type: 'text', text: '...', cache_control: { type: 'ephemeral' } }`) — a plain string is not cacheable.

### Agent orchestration
- Two-agent pattern: Planner (Sonnet, generative) → Critique (Opus, safety-critical). Each is a separate `runToolLoop` call; state flows as a `WorkoutPlan` JSON object between them.
- `stripCodeFences()` in `orchestrator.ts` handles models that wrap JSON output in markdown fences despite instructions not to. Defensive parsing is necessary in production.

## Milestones

| # | Theme | Domains | Status |
|---|---|---|---|
| 1 | Foundations: SDK setup, Messages API, streaming | D2, D5 | ✅ done |
| 2 | Structured intake: vision photo → recipe JSON, native schema output | D2, D6 | ✅ done |
| 3 | Tools: custom scaling/macro tools, schemas, tool-use loop | D8, D2 | ✅ done |
| 4 | Model tiers + caching + cost: routing, prompt caching, token logging | D5 | ✅ done |
| 5 | Agent: workout planner + critique sub-agent | D1 | ✅ done |
| 6 | Batch: overnight weekly-plan job via Batch API | D2 | ✅ done |
| 7 | MCP server (Python): pantry + training log | D8 | — |
| 8 | Security & hooks: injection isolation, destructive-action hook | D7 | — |
| 9 | Claude Code operation: CLAUDE.md hierarchy, slash command, Skill | D3 | — |
| 10 | Eval + debugging: task-level eval harness, trace analysis | D4 | — |
