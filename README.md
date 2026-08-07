# Fuel & Train

Personal nutrition and training assistant — built as a hands-on study project for the **Claude Certified Developer – Foundations** exam (CCDV-F, v1.0).

Covers all eight exam domains across ten incremental milestones. Primary language: TypeScript. MCP server: Python.

## Prerequisites

- Node v22
- pnpm
- An Anthropic API key

## Setup

```bash
pnpm install
cp .env.example .env   # then add your ANTHROPIC_API_KEY and ANTHROPIC_MODEL
```

## Scripts

| Command | What it does |
|---|---|
| `pnpm hello` | Single Messages API call — prints response text and token usage |
| `pnpm hello-stream` | Same call with streaming — tokens arrive in real time |
| `pnpm intake` | Vision call — reads a food photo from `assets/`, returns a structured recipe JSON and token usage |


## Project structure

```
assets/          ← test food photos for the intake script
src/
  config.ts      ← model ID and token limits read from .env (no hardcoded values)
  client/
    hello.ts         ← M1: basic Messages API call
    hello-stream.ts  ← M1: streaming Messages API call
  intake/
    intake.ts        ← M2: vision + native JSON schema output
```

## Milestones

| # | Theme | Domains | Status |
|---|---|---|---|
| 1 | Foundations: SDK setup, Messages API, streaming | D2, D5 | ✅ done |
| 2 | Structured intake: vision photo → recipe JSON, native schema output | D2, D6 | ✅ done |
| 3 | Tools: custom scaling/macro tools, schemas, tool-use loop | D8, D2 | 🔜 next |
| 4 | Model tiers + caching + cost: routing, prompt caching, token logging | D5 | — |
| 5 | Agent: workout planner + critique sub-agent (Claude Agent SDK) | D1 | — |
| 6 | Batch: overnight weekly-plan job via Batch API | D2 | — |
| 7 | MCP server (Python): pantry + training log | D8 | — |
| 8 | Security & hooks: injection isolation, destructive-action hook | D7 | — |
| 9 | Claude Code operation: CLAUDE.md hierarchy, slash command, Skill | D3 | — |
| 10 | Eval + debugging: task-level eval harness, trace analysis | D4 | — |

More scripts are added with each milestone. See `CLAUDE.md` for conventions (SI units, no hardcoded values, seed data policy).
