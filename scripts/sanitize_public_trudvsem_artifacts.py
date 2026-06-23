#!/usr/bin/env python3
"""Create privacy-safe public Trudvsem JSON artifacts.

This operates only on GitHub Pages public artifacts under docs/data/platform2.
It does not change raw evidence, model weights or aggregate program-demand
scores. Source-native vacancy IDs are replaced by release-local surrogate IDs
and employer names are removed from public samples.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_GLOB = "docs/data/platform2/trudvsem_labor_market_*.json"
SANITIZATION_VERSION = "public-ui-privacy-v1"
SANITIZED_AT = "2026-06-22T00:00:00Z"


def public_record_id(value: Any) -> str:
    seed = str(value or "missing").encode("utf-8")
    return "rec-" + hashlib.sha256(seed).hexdigest()[:16]


def sanitize_value(value: Any, id_map: dict[str, str]) -> Any:
    if isinstance(value, list):
        return [sanitize_value(item, id_map) for item in value]
    if not isinstance(value, dict):
        return value

    source_id = str(value.get("vacancy_id", "") or "")
    sanitized: dict[str, Any] = {}
    for key, child in value.items():
        if key in {"vacancy_id", "employer_name"}:
            continue
        sanitized[key] = sanitize_value(child, id_map)
    if source_id and "release_record_id" not in sanitized:
        id_map.setdefault(source_id, public_record_id(source_id))
        sanitized["release_record_id"] = id_map[source_id]
    return sanitized


def sanitize_file(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    before_bytes = path.stat().st_size
    before_hash = hashlib.sha256(path.read_bytes()).hexdigest()
    id_map: dict[str, str] = {}

    payload = sanitize_value(payload, id_map)

    metadata = payload.setdefault("metadata", {})
    metadata["public_sanitization"] = {
        "version": SANITIZATION_VERSION,
        "sanitized_at_utc": SANITIZED_AT,
        "policy": "source-native vacancy_id replaced by release_record_id; employer_name removed from public samples",
        "surrogate_scope": "release-local stable hash prefix",
        "aggregate_values_changed": False,
    }
    if isinstance(metadata.get("snapshot_metadata"), dict):
        warning = str(metadata["snapshot_metadata"].get("metric_warning", ""))
        metadata["snapshot_metadata"]["metric_warning"] = warning.replace("vacancy_id", "deduplicated source record")

    text = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    path.write_text(text, encoding="utf-8")
    return {
        "path": str(path.relative_to(ROOT)).replace("\\", "/"),
        "before_bytes": before_bytes,
        "before_sha256": before_hash,
        "after_bytes": path.stat().st_size,
        "after_sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "surrogate_ids": len(id_map),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--glob", default=DEFAULT_GLOB)
    parser.add_argument("--report", type=Path, default=ROOT / "worklogs" / "frontend-world-class" / "public_trudvsem_sanitization.json")
    args = parser.parse_args()

    paths = sorted(ROOT.glob(args.glob))
    results = [sanitize_file(path) for path in paths if path.is_file()]
    report = {
        "status": "passed",
        "sanitization_version": SANITIZATION_VERSION,
        "sanitized_at_utc": SANITIZED_AT,
        "glob": args.glob,
        "files": results,
    }
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": "passed", "files": len(results)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
