# Fuel & Train

A Claude-native personal nutrition and training assistant, built to practice every domain of the **Claude Certified Developer – Foundations** exam (CCDV-F, v1.0, July 2026).

---

## Project role

This CLAUDE.md governs how Claude assists inside this repo. It will expand during M9 to include custom commands and skills. Until then it defines the working conventions.

**Mentor mode applies here too.** Explain concepts and design decisions; produce code only when explicitly requested. Reference the exam blueprint (PDF §6) and official Anthropic documentation for all Claude-API-related guidance.

---

## Stack

- **Language:** TypeScript (Node v22, pnpm). One language is sufficient for the exam.
- **MCP server:** Python only (in `mcp-server/`). This is the deliberate Python touchpoint.
- **Claude API:** real calls via the Anthropic TypeScript SDK. API key loaded from `.env` — never hardcoded.
- **No Ollama, no local models.** This repo is explicitly Claude-native to practice the exam domains.

---

## Conventions

### SI units — mandatory everywhere

All measurements use SI units throughout the codebase, data files, prompts, and tool schemas. No exceptions.

| Quantity | Unit | Not |
|---|---|---|
| Weight / mass | grams (g) or kilograms (kg) | ounces, pounds |
| Volume | millilitres (ml) or litres (l) | cups, fl oz, tbsp, tsp |
| Temperature | Celsius (°C) | Fahrenheit |
| Distance | kilometres (km) or metres (m) | miles, feet |
| Energy | kilocalories (kcal) or kilojoules (kJ) | (both acceptable) |

This applies to tool input/output schemas, system prompts, seed data files, and user-facing output.

### Secrets and keys

- `ANTHROPIC_API_KEY` lives in `.env` only. Never log, commit, or interpolate into strings.
- `.env` is git-ignored from day one.
- Principle: least privilege — only read the key where it is needed to construct the SDK client.

### Config

- Tunable parameters (model IDs, `max_tokens`, `temperature`, retry limits, cache TTL) live in a `config.ts` or `.env` — never hardcoded inline.
- Model IDs are pinned by string constant, not assumed. Verify against current Anthropic documentation before each milestone that introduces a new model.

### TypeScript style

- Strict mode (`"strict": true` in `tsconfig.json`).
- pnpm for package management.
- Prettier-formatted (auto on save).
- No `any` without a comment explaining why.

### Tool schemas

- Every custom tool has a clear, examiner-quality `description` field — the model uses it to decide when and how to call the tool.
- All schema fields include `description`.
- Input types are as narrow as possible (enum over string where values are known).
- SI unit constraints are stated explicitly in descriptions: e.g., `"weight_g: weight of ingredient in grams"`.

---

## Milestone status

| # | Name | Domain(s) | Status |
|---|---|---|---|
| M1 | Foundations | D2, D5 | pending |
| M2 | Structured intake from an image | D2, D6 | pending |
| M3 | Custom tools | D8, D2 | pending |
| M4 | Model tiers, caching & cost | D5 | pending |
| M5 | Workout-planner agent | D1 | pending |
| M6 | Batch weekly planning | D2 | pending |
| M7 | Pantry & training-log MCP server (Python) | D8 | pending |
| M8 | Security & hooks | D7 | pending |
| M9 | Claude Code operation | D3 | pending |
| M10 | Eval & debugging | D4 | pending |

Update status to **in progress** / **done** as you work through each milestone.

---

## Repo structure

```
fuel-and-train/
  .env                  # ANTHROPIC_API_KEY (git-ignored)
  .gitignore
  CLAUDE.md             # this file
  package.json
  tsconfig.json
  assets/images/        # mock recipe/label images for M2 (no camera needed)
  data/                 # pantry.json, training-log.json (created at M3), eval tasks (M10)
  src/
    client/             # Anthropic SDK wrapper, streaming helpers
    intake/             # vision: image → structured recipe/nutrition object
    tools/              # custom tools: recipe scaling, macro estimation
    routing/            # model-tier selection, token tracking, cost logging
    agent/              # workout planner + critique sub-agent (Claude Agent SDK)
    batch/              # weekly batch job via Batch API
    security/           # untrusted-input isolation, prompt-injection defence, hooks
    eval/               # eval harness + trace analysis
  mcp-server/           # Python MCP server — pantry + training log tools/resources
```

---

## Key reference links

*Verify model names and SDK surface against these before each relevant milestone.*

- Anthropic API docs: https://docs.anthropic.com/en/api
- Claude models overview: https://docs.anthropic.com/en/docs/about-claude/models/overview
- Prompt engineering guide: https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview
- Tool use (function calling): https://docs.anthropic.com/en/docs/build-with-claude/tool-use/overview
- Vision (multi-format input): https://docs.anthropic.com/en/docs/build-with-claude/vision
- Prompt caching: https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
- Message Batches API: https://docs.anthropic.com/en/docs/build-with-claude/message-batches
- Claude Agent SDK: https://docs.anthropic.com/en/docs/claude-code/sdk
- MCP documentation: https://docs.anthropic.com/en/docs/mcp

*Reference: CCDF_Guide.pdf §6 (Exam Content Outline / Blueprint) is the authoritative source for what each domain tests.*
