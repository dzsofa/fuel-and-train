"""
Fuel & Train MCP Server
Exposes pantry, meal log, and training log as MCP tools.
Transport: stdio (default) — compatible with Claude Desktop, Claude Code, and the MCP client SDK.

Domain 8 exam: MCP server architecture, tool schemas, stdio transport.
"""

from __future__ import annotations

import json
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal

from mcp.server.mcpserver import MCPServer
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

DATA_DIR = Path(__file__).parent.parent / "data"
PANTRY_FILE = DATA_DIR / "pantry.json"
MEAL_LOG_FILE = DATA_DIR / "meal-log.json"
TRAINING_LOG_FILE = DATA_DIR / "training-log.json"

# ---------------------------------------------------------------------------
# File I/O helpers (thread-safe with a per-file lock)
# ---------------------------------------------------------------------------

_locks: dict[Path, threading.Lock] = {
    PANTRY_FILE: threading.Lock(),
    MEAL_LOG_FILE: threading.Lock(),
    TRAINING_LOG_FILE: threading.Lock(),
}


def _read(path: Path) -> list[dict[str, Any]]:
    with _locks[path]:
        with path.open(encoding="utf-8") as f:
            return json.load(f)


def _write(path: Path, data: list[dict[str, Any]]) -> None:
    with _locks[path]:
        with path.open("w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write("\n")


# ---------------------------------------------------------------------------
# Shared types
# ---------------------------------------------------------------------------

ActivityType = Literal[
    "Running", "Cycling", "Strength", "Swimming", "HIIT", "Aerobics", "Other"
]


class Macros(BaseModel):
    protein_g: float
    carbs_g: float
    fat_g: float
    calories_kcal: float


# ---------------------------------------------------------------------------
# MCP server instance
# ---------------------------------------------------------------------------

mcp = MCPServer(
    name="fuel-and-train",
    version="0.1.0",
    description="Pantry, meal log, and training log tools for the Fuel & Train assistant",
)

# ---------------------------------------------------------------------------
# Pantry tools
# ---------------------------------------------------------------------------


@mcp.tool(description="Return all items currently in the pantry.")
def get_pantry() -> list[dict[str, Any]]:
    return _read(PANTRY_FILE)


@mcp.tool(
    description=(
        "Upsert a pantry item by name. "
        "Adds the item if it does not exist; updates amount_g if it does. "
        "Set amount_g to 0 to remove the item from the pantry."
    )
)
def update_pantry_item(name: str, amount_g: float) -> dict[str, Any]:
    items = _read(PANTRY_FILE)

    if amount_g == 0:
        updated = [i for i in items if i["name"].lower() != name.lower()]
        _write(PANTRY_FILE, updated)
        return {"action": "removed", "name": name}

    for item in items:
        if item["name"].lower() == name.lower():
            item["amount_g"] = amount_g
            _write(PANTRY_FILE, items)
            return {"action": "updated", "name": item["name"], "amount_g": amount_g}

    items.append({"name": name, "amount_g": amount_g})
    _write(PANTRY_FILE, items)
    return {"action": "added", "name": name, "amount_g": amount_g}


# ---------------------------------------------------------------------------
# Meal log tools
# ---------------------------------------------------------------------------


@mcp.tool(
    description=(
        "Return meal log entries. "
        "Pass date as 'YYYY-MM-DD' to filter to a single day; omit to return all entries."
    )
)
def get_meal_log(date: str | None = None) -> list[dict[str, Any]]:
    entries = _read(MEAL_LOG_FILE)
    if date is None:
        return entries
    return [e for e in entries if e["timestamp"].startswith(date)]


@mcp.tool(
    description=(
        "Append a new meal to the log. "
        "Provide meal_name, macros (protein_g, carbs_g, fat_g, calories_kcal), "
        "and an optional notes string. Timestamp is set automatically."
    )
)
def log_meal(
    meal_name: str,
    macros: Macros,
    notes: str | None = None,
) -> dict[str, Any]:
    entries = _read(MEAL_LOG_FILE)
    entry: dict[str, Any] = {
        "timestamp": datetime.now(timezone.utc).astimezone().isoformat(),
        "meal_name": meal_name,
        "macros": macros.model_dump(),
    }
    if notes is not None:
        entry["notes"] = notes
    entries.append(entry)
    _write(MEAL_LOG_FILE, entries)
    return {"action": "logged", "entry": entry}


# ---------------------------------------------------------------------------
# Training log tools
# ---------------------------------------------------------------------------


@mcp.tool(
    description=(
        "Return training log entries. "
        "Pass date as 'YYYY-MM-DD' to filter to a single day; omit to return all entries."
    )
)
def get_training_log(date: str | None = None) -> list[dict[str, Any]]:
    entries = _read(TRAINING_LOG_FILE)
    if date is None:
        return entries
    return [e for e in entries if e["timestamp"].startswith(date)]


@mcp.tool(
    description=(
        "Append a new training session to the log. "
        "Provide activity (one of: Running, Cycling, Strength, Swimming, HIIT, Aerobics, Other), "
        "duration_min, and optionally distance_km and notes. Timestamp is set automatically."
    )
)
def log_training_session(
    activity: ActivityType,
    duration_min: float,
    distance_km: float | None = None,
    notes: str | None = None,
) -> dict[str, Any]:
    entries = _read(TRAINING_LOG_FILE)
    entry: dict[str, Any] = {
        "timestamp": datetime.now(timezone.utc).astimezone().isoformat(),
        "activity": activity,
        "duration_min": duration_min,
    }
    if distance_km is not None:
        entry["distance_km"] = distance_km
    if notes is not None:
        entry["notes"] = notes
    entries.append(entry)
    _write(TRAINING_LOG_FILE, entries)
    return {"action": "logged", "entry": entry}


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


def main() -> None:
    mcp.run()  # defaults to stdio transport


if __name__ == "__main__":
    main()
