# Fuel & Train MCP Server

Python MCP server exposing pantry, meal log, and training log as tools.
Part of the **Fuel & Train** CCDV-F exam practice project — Domain 8: Tools & MCPs.

## Exam concepts

- **MCP vs custom tools**: Custom tools (M3) are defined inline in the `tools` array on each API call and run inside your application process. An MCP server is an external process; the host application discovers its tools at runtime via `tools/list` and invokes them via `tools/call`. Claude never contacts the MCP server directly.
- **stdio transport**: The server communicates over stdin/stdout. The host (Claude Desktop, Claude Code, or your TypeScript app) spawns it as a child process and pipes JSON-RPC messages through it.
- **Tool schema inference**: The MCP SDK infers JSON Schema from Python type annotations. `Literal[...]` becomes an `enum`, `BaseModel` fields become an `object` with required properties, `X | None` becomes an optional field.

## Tools

| Tool | Description |
|---|---|
| `get_pantry` | Returns all pantry items |
| `update_pantry_item` | Upserts an item by name; `amount_g: 0` removes it |
| `get_meal_log` | Returns meal log entries; optional `date` param (`YYYY-MM-DD`) filters to one day |
| `log_meal` | Appends a meal entry; timestamp set automatically |
| `get_training_log` | Returns training log entries; optional `date` param filters to one day |
| `log_training_session` | Appends a training session; timestamp set automatically |

## Setup

Install the package in editable mode (run once from this directory):

```bash
cd mcp-server
pip install -e .
```

This registers the `fuel-and-train-mcp` CLI command used by Claude Desktop and Claude Code.

## Connect to Claude Desktop

Add the following entry to `%APPDATA%\Claude\claude_desktop_config.json` under `mcpServers`:

```json
{
  "mcpServers": {
    "fuel-and-train": {
      "command": "fuel-and-train-mcp"
    }
  }
}
```

Restart Claude Desktop. Open a new conversation and ask: *"What's in my pantry?"* — Claude will call `get_pantry` automatically.

> **Note:** The server reads and writes `data/pantry.json`, `data/meal-log.json`, and `data/training-log.json` relative to the `fuel-and-train/` repo root, resolved from `server.py`'s own location at startup. The working directory Claude Desktop uses to launch the server does not matter.

## Connect to Claude Code

Add the same block to `.mcp.json` at the repo root (project-scoped MCP config — distinct from `.claude/settings.json`, which only holds permissions/hooks/env settings):

```json
{
  "mcpServers": {
    "fuel-and-train": {
      "command": "fuel-and-train-mcp"
    }
  }
}
```

Run `/mcp` in a Claude Code session to confirm the server is listed and its tools are available.

## Connect from the TypeScript app (M7 integration)

Use the MCP client from `@anthropic-ai/sdk` to spawn the server and inject its tools into a Messages call alongside (or instead of) the M3 inline tools. The pattern:

```ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

// Spawn the MCP server and collect its tools
const mcpClient = await client.beta.mcp.connect('fuel-and-train-mcp');
const mcpTools = await mcpClient.listTools();

// Pass MCP tools into the Messages call
const response = await client.messages.create({
  model: '...',
  tools: [...mcpTools],
  messages: [{ role: 'user', content: 'Log my morning run: 10 km in 55 minutes.' }],
});
```

> The exact TypeScript MCP client API should be verified against the current `@anthropic-ai/sdk` docs before implementation — the pattern above is illustrative.

## File layout

```
mcp-server/
  pyproject.toml    ← Python package; declares fuel-and-train-mcp CLI entry point
  server.py         ← MCPServer instance + 6 tool definitions
  README.md         ← this file
```

Data files live one level up in `../data/` and are shared with the TypeScript app.
