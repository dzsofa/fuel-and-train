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
cp .env.example .env   # then add your ANTHROPIC_API_KEY
```

## Scripts

| Command | What it does |
|---|---|
| `pnpm hello` | Single Messages API call — prints response text and token usage |
| `pnpm hello-stream` | Same call with streaming — tokens arrive in real time |

More scripts are added with each milestone. See `CLAUDE.md` for the full milestone plan and project conventions.
