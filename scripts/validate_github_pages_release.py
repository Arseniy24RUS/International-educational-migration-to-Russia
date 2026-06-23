#!/usr/bin/env python3
"""Validate the clean GitHub Pages public release artifact."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
RELEASE = ROOT / "release" / "github-pages"
MANIFEST = RELEASE / "PUBLIC_RELEASE_MANIFEST.json"

EXPECTED_HTML = {
    "index.html",
    "migration.html",
    "demography.html",
    "model.html",
    "friendliness.html",
    "vacancies.html",
    "forecast.html",
    "gap.html",
    "matrix.html",
    "report.html",
}

EXPECTED_ROUTES = [
    "platform2",
    "migration",
    "demography",
    "model",
    "friendliness",
    "vacancies",
    "forecast",
    "gap",
    "matrix",
    "report",
]

COUNTRY_ROUTES = {
    "platform2",
    "migration",
    "demography",
    "friendliness",
    "forecast",
    "gap",
    "matrix",
    "report",
}

FORBIDDEN_PATTERNS = {
    "task_number": re.compile(r"5\.2\.\d+"),
    "task_ru": re.compile(r"Задача"),
    "task_en": re.compile(r"Task\s+5\.2"),
    "modules_ru": re.compile(r"Модули"),
    "modules_en": re.compile(r"Modules"),
    "module_routes": re.compile(r"MODULE_ROUTES|openModules|moduleNav"),
    "platform2_html": re.compile(r"platform2\.html"),
    "students_html": re.compile(r"students\.html"),
    "labor_html": re.compile(r"labor\.html"),
    "labor_dir_link": re.compile(r"labor/"),
    "branches_route": re.compile(r"navBranches|\"branches\""),
}

TEXT_EXTENSIONS = {".html", ".js", ".css", ".json", ".csv", ".md", ".txt", ".geojson", ".svg"}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def validate_paths(errors: list[str]) -> None:
    if not RELEASE.exists():
        errors.append("release/github-pages does not exist")
        return
    html = {path.name for path in RELEASE.glob("*.html")}
    if html != EXPECTED_HTML:
        errors.append(f"HTML page set mismatch: expected {sorted(EXPECTED_HTML)}, got {sorted(html)}")
    for relative in ("platform2.html", "students.html", "labor.html", "labor"):
        if (RELEASE / relative).exists():
            errors.append(f"Forbidden public path exists: {relative}")


def validate_forbidden_markers(errors: list[str]) -> None:
    for path in RELEASE.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in TEXT_EXTENSIONS:
            continue
        if "assets/vendor" in path.relative_to(RELEASE).as_posix():
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        for name, pattern in FORBIDDEN_PATTERNS.items():
            if pattern.search(text):
                rel = path.relative_to(RELEASE).as_posix()
                errors.append(f"Forbidden marker {name} in {rel}")
                break


def validate_manifest(errors: list[str]) -> None:
    if not MANIFEST.exists():
        errors.append("PUBLIC_RELEASE_MANIFEST.json missing")
        return
    manifest = read_json(MANIFEST)
    routes = [item.get("id") for item in manifest.get("routes", [])]
    if routes != EXPECTED_ROUTES:
        errors.append(f"Route order mismatch in manifest: {routes}")
    pages = set(manifest.get("html_pages", []))
    if pages != EXPECTED_HTML:
        errors.append(f"Manifest HTML set mismatch: {sorted(pages)}")
    listed = {item["path"]: item for item in manifest.get("files", [])}
    actual = {
        path.relative_to(RELEASE).as_posix(): path
        for path in RELEASE.rglob("*")
        if path.is_file() and path.name != "PUBLIC_RELEASE_MANIFEST.json"
    }
    if set(listed) != set(actual):
        missing = sorted(set(actual) - set(listed))[:20]
        extra = sorted(set(listed) - set(actual))[:20]
        errors.append(f"Manifest file inventory mismatch; missing={missing}, extra={extra}")
        return
    for rel, path in actual.items():
        item = listed[rel]
        if item.get("bytes") != path.stat().st_size:
            errors.append(f"Manifest byte mismatch: {rel}")
        if item.get("sha256") != sha256(path):
            errors.append(f"Manifest hash mismatch: {rel}")


def validate_ui_marts(errors: list[str], warnings: list[str]) -> None:
    ui_dir = RELEASE / "data" / "platform2" / "ui"
    if not ui_dir.exists():
        errors.append("UI mart directory missing")
        return
    routes = []
    for path in sorted(ui_dir.glob("*.json")):
        payload = read_json(path)
        route = payload.get("route")
        routes.append(route)
        if "task" in payload:
            errors.append(f"Public UI mart keeps task field: {path.name}")
        if route in COUNTRY_ROUTES:
            for index, row in enumerate(payload.get("focus_rows", [])):
                if row.get("country_bearing") and row.get("iso3") and not row.get("iso2"):
                    warnings.append(f"{path.name}: focus_rows[{index}] has iso3={row.get('iso3')} but no iso2")
    if set(routes) != set(EXPECTED_ROUTES):
        errors.append(f"UI mart route set mismatch: {sorted(routes)}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--strict", action="store_true")
    args = parser.parse_args()

    errors: list[str] = []
    warnings: list[str] = []
    validate_paths(errors)
    if RELEASE.exists():
        validate_forbidden_markers(errors)
        validate_manifest(errors)
        validate_ui_marts(errors, warnings)
    if args.strict and warnings:
        errors.extend(f"warning escalated: {warning}" for warning in warnings)
    report = {"status": "failed" if errors else "passed", "errors": errors, "warnings": warnings}
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
