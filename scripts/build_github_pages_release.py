#!/usr/bin/env python3
"""Build the clean GitHub Pages publish artifact under release/github-pages."""
from __future__ import annotations

import hashlib
import json
import re
import shutil
from pathlib import Path
from typing import Any, Callable


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
RELEASE = ROOT / "release" / "github-pages"

ROUTES = [
    ("platform2", "platform2.html", "index.html", "Обзор", "Overview", "Концептуальная модель", "Conceptual model"),
    ("migration", "migration.html", "migration.html", "Потоки", "Flows", "Потоки 2010-2025", "Flows 2010-2025"),
    ("demography", "demography.html", "demography.html", "Рынки 2050", "Markets 2050", "Молодёжные рынки", "Youth markets"),
    ("model", "model.html", "model.html", "Модель", "Model", "Гравитационная модель", "Gravity model"),
    ("friendliness", "friendliness.html", "friendliness.html", "Восприимчивость", "Receptivity", "Восприимчивость к России", "Receptivity to Russia"),
    ("vacancies", "vacancies.html", "vacancies.html", "Компетенции", "Skills", "Вакансии и компетенции", "Vacancies and skills"),
    ("forecast", "forecast.html", "forecast.html", "Прогноз", "Forecast", "Прогноз до 2050 года", "Forecast to 2050"),
    ("gap", "gap.html", "gap.html", "Потенциал", "Potential", "Нереализованный потенциал", "Unrealized potential"),
    ("matrix", "matrix.html", "matrix.html", "Матрица", "Matrix", "Стратегическая матрица", "Strategic matrix"),
    ("report", "report.html", "report.html", "Доклад", "Report", "Итоговый доклад", "Final report"),
]

HTML_ROUTES = [dest for _, _, dest, *_ in ROUTES]
ROUTE_IDS = [route for route, *_ in ROUTES]

ASSET_FILES = [
    "assets/platform2.css",
    "assets/platform2-release.css",
    "assets/platform2-world-class.css",
    "assets/site-shell.css",
    "assets/site-shell.js",
    "assets/executive-report.css",
    "assets/executive-report.js",
    "assets/css/report-cartography.css",
    "assets/js/report-cartography.js",
    "assets/platform2.js",
    "assets/platform2-world-class.js",
    "assets/mgimo-home.png",
    "assets/fnisc.png",
]

DATA_FILES = [
    "data/mgimo_platform2_payload.json",
    "data/world_admin_boundaries_ru_claimed_update_2026.geojson",
]

FORBIDDEN_PATTERNS = [
    r"5\.2\.\d+",
    r"Task\s+5\.2",
    r"Задача",
    r"MODULE_ROUTES",
    r"openModules",
    r"Модули",
    r"Modules",
    r"students\.html",
    r"labor\.html",
    r"labor/",
    r"navBranches",
    r'"branches"',
]


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def reset_release_dir() -> None:
    target = RELEASE.resolve()
    expected_parent = (ROOT / "release").resolve()
    if expected_parent not in target.parents:
        raise RuntimeError(f"Refusing to delete unexpected path: {target}")
    if RELEASE.exists():
        try:
            shutil.rmtree(RELEASE)
        except PermissionError:
            # A local preview cmd can keep release/github-pages as its current
            # directory. Rebuild the deterministic contents in place instead.
            for child in RELEASE.iterdir():
                if child.is_dir():
                    shutil.rmtree(child)
                else:
                    child.unlink()
    RELEASE.mkdir(parents=True, exist_ok=True)


def copy_file(relative_path: str, transform: Callable[[str], str] | None = None) -> None:
    source = DOCS / relative_path
    destination = RELEASE / relative_path
    destination.parent.mkdir(parents=True, exist_ok=True)
    if transform:
        destination.write_text(transform(source.read_text(encoding="utf-8")), encoding="utf-8")
    else:
        shutil.copy2(source, destination)


def copy_tree(relative_path: str) -> None:
    source = DOCS / relative_path
    destination = RELEASE / relative_path
    if not source.exists():
        return
    shutil.copytree(source, destination, dirs_exist_ok=True)


def scrub_public_text(text: str) -> str:
    text = text.replace("platform2.html", "index.html")
    text = text.replace('countries: "data/mgimo_dashboard_data.json"', 'countries: "data/platform2/public_country_reference.json"')
    text = re.sub(r"Task\s+5\.2\.\d+\s*(?:·|В·|-)?\s*", "", text)
    text = re.sub(r"Задача\s+5\.2\.\d+\s*(?:·|В·|-)?\s*", "", text)
    text = re.sub(r"Р—Р°РґР°С‡Р°\s+5\.2\.\d+\s*(?:·|В·|-)?\s*", "", text)
    text = re.sub(r"5\.2\.\d+", "", text)
    text = re.sub(r"(Задача|Р—Р°РґР°С‡Р°)\s*(?:·|В·|-)?\s*", "", text)
    text = re.sub(r'\n\s*navBranches:\s*"[^"]*",', "", text)
    text = re.sub(r'\s+\["students\.html",[^\n]+\],\n', "\n", text)
    text = re.sub(r'\s+\["labor\.html",[^\n]+\],\n', "\n", text)
    text = re.sub(r'\s+\["index\.html",\s*"navBranches",[^\n]+\],\n', "\n", text)
    text = text.replace("<span>${item.number}</span>", "")
    text = re.sub(r"<article><span>\d+</span>", "<article>", text)
    text = re.sub(
        r"(function table\(rows, columns, opts = \{\}\) \{\s*)const label",
        "\\1const safeCell = (column, row, idx) => { const value = column.render ? column.render(row, idx) : row[column.key]; const safeFlagMarkup = typeof value === \"string\" && value.includes('class=\"p2-country-flag'); return column.html || safeFlagMarkup ? value : esc(value); };\n    const label",
        text,
        count=1,
    )
    text = text.replace("c.html ? c.render(row, idx) : esc(c.render ? c.render(row, idx) : row[c.key])", "safeCell(c, row, idx)")
    text = text.replace('<td class="${c.num ? "num" : ""}">', '<td class="${c.num ? "num" : ""}" data-label="${esc(c.label)}">')
    return text


def scrub_html(text: str) -> str:
    text = scrub_public_text(text)
    return text.replace("v=20260621-ui6", "v=20260622-public").replace("v=20260622-world-class-ui1", "v=20260622-public")


def public_shell_js() -> str:
    route_objects = []
    for route, _, href, ru, en, ru_long, en_long in ROUTES:
        route_objects.append(
            {
                "id": route,
                "href": href,
                "ru": ru,
                "en": en,
                "ruLong": ru_long,
                "enLong": en_long,
            }
        )
    routes_json = json.dumps(route_objects, ensure_ascii=False, indent=4)
    return f'''(() => {{
  "use strict";

  const STORAGE_KEYS = ["mgimo_platform2_lang", "mgimo_students_lang", "mgimo_lang"];
  const MAIN_ROUTES = {routes_json};

  const TEXT = {{
    ru: {{
      product: "Международная образовательная миграция в Россию",
      institution: "МГИМО МИД России · ФНИСЦ РАН",
      researchNav: "Разделы исследования",
      menu: "Навигация",
      language: "Язык интерфейса",
      skipToContent: "Перейти к содержанию"
    }},
    en: {{
      product: "International educational migration to Russia",
      institution: "MGIMO University · FCTAS RAS",
      researchNav: "Research sections",
      menu: "Navigation",
      language: "Interface language",
      skipToContent: "Skip to content"
    }}
  }};

  function currentLanguage(explicit) {{
    if (["ru", "en"].includes(explicit)) return explicit;
    for (const key of STORAGE_KEYS) {{
      const sessionValue = sessionStorage.getItem(key);
      if (["ru", "en"].includes(sessionValue)) return sessionValue;
    }}
    for (const key of STORAGE_KEYS) {{
      const value = localStorage.getItem(key);
      if (["ru", "en"].includes(value)) return value;
    }}
    return "ru";
  }}

  function storeLanguage(lang) {{
    STORAGE_KEYS.forEach((key) => {{
      sessionStorage.setItem(key, lang);
      localStorage.setItem(key, lang);
    }});
  }}

  function currentPageId() {{
    const declared = document.body?.dataset?.view || document.body?.dataset?.page;
    if (declared) return declared;
    const pathname = location.pathname.replace(/\\\\/g, "/");
    const filename = pathname.split("/").pop() || "index.html";
    if (!filename || filename === "index.html") return "platform2";
    const match = MAIN_ROUTES.find((route) => route.href === filename);
    return match?.id || "platform2";
  }}

  function hrefFor(route) {{
    return route.href;
  }}

  function logoPath(name) {{
    return `assets/${{name}}`;
  }}

  function pageMeta(pageId) {{
    return MAIN_ROUTES.find((route) => route.id === pageId) || MAIN_ROUTES[0];
  }}

  function syncSkipLinks(lang) {{
    const label = (TEXT[lang] || TEXT.ru).skipToContent;
    document.querySelectorAll(".skip-link").forEach((link) => {{
      link.textContent = label;
      if (!link.getAttribute("href")) link.setAttribute("href", "#app");
      link.setAttribute("data-shell-localized", "true");
    }});
  }}

  function navItem(route, pageId, lang) {{
    const active = route.id === pageId;
    const label = route[lang] || route.ru;
    const longLabel = route[`${{lang}}Long`] || label;
    return `<a class="mgimo-shell-nav-link${{active ? " active" : ""}}" href="${{hrefFor(route)}}"${{active ? ' aria-current="page"' : ""}} data-route-id="${{route.id}}" title="${{longLabel}}">
      <span class="mgimo-shell-link-copy"><strong>${{label}}</strong></span>
    </a>`;
  }}

  function render(options = {{}}) {{
    const header = document.querySelector(options.selector || "header.app-header, #platform2Header");
    if (!header) return null;
    const pageId = options.pageId || currentPageId();
    const lang = currentLanguage(options.lang);
    const copy = TEXT[lang] || TEXT.ru;
    const meta = pageMeta(pageId);
    const pageTitle = options.pageTitle || meta[`${{lang}}Long`] || meta[lang] || "";
    const pageSubtitle = options.pageSubtitle || "";

    let bar = header.querySelector(":scope > .executive-bar");
    if (!bar) {{
      bar = document.createElement("div");
      bar.className = "executive-bar";
      header.prepend(bar);
    }}
    bar.classList.add("mgimo-shell-bar", "mgimo-shell-public");
    bar.innerHTML = `
      <div class="mgimo-shell-brand">
        <div class="institution-lockup" aria-label="${{copy.institution}}">
          <a class="logo-link" href="https://mgimo.ru/" target="_blank" rel="noopener noreferrer" aria-label="MGIMO">
            <img class="brand-logo mgimo-logo" src="${{logoPath("mgimo-home.png")}}" alt="MGIMO" />
          </a>
          <span class="brand-divider" aria-hidden="true"></span>
          <a class="logo-link" href="https://www.fnisc.ru/" target="_blank" rel="noopener noreferrer" aria-label="FNISC">
            <img class="brand-logo fnisc-logo" src="${{logoPath("fnisc.png")}}" alt="FNISC" />
          </a>
        </div>
        <div class="mgimo-shell-title-block">
          <span class="mgimo-shell-eyebrow">${{copy.institution}}</span>
          <h1>${{copy.product}}</h1>
          <p><strong>${{pageTitle}}</strong>${{pageSubtitle ? `<span>${{pageSubtitle}}</span>` : ""}}</p>
        </div>
      </div>
      <div class="mgimo-shell-tools">
        <div class="segmented compact mgimo-shell-language" role="group" aria-label="${{copy.language}}">
          <button id="langRu" data-lang="ru" class="segment ${{lang === "ru" ? "active" : ""}}" type="button" aria-pressed="${{lang === "ru"}}">RU</button>
          <button id="langEn" data-lang="en" class="segment ${{lang === "en" ? "active" : ""}}" type="button" aria-pressed="${{lang === "en"}}">EN</button>
        </div>
        <button class="mgimo-shell-menu-button" type="button" aria-expanded="false" aria-controls="mgimoResearchNav">${{copy.menu}}</button>
      </div>
      <nav id="mgimoResearchNav" class="app-nav p2-nav mgimo-shell-nav" aria-label="${{copy.researchNav}}">
        ${{MAIN_ROUTES.map((route) => navItem(route, pageId, lang)).join("")}}
      </nav>`;

    const menuButton = bar.querySelector(".mgimo-shell-menu-button");
    const nav = bar.querySelector(".mgimo-shell-nav");
    const closeMenu = ({{ restoreFocus = false }} = {{}}) => {{
      menuButton?.setAttribute("aria-expanded", "false");
      nav?.classList.remove("open");
      if (restoreFocus) menuButton?.focus();
    }};
    menuButton?.addEventListener("click", () => {{
      const expanded = menuButton.getAttribute("aria-expanded") === "true";
      if (expanded) closeMenu();
      else {{
        menuButton.setAttribute("aria-expanded", "true");
        nav?.classList.add("open");
      }}
    }});
    bar.addEventListener("keydown", (event) => {{
      if (event.key === "Escape" && menuButton?.getAttribute("aria-expanded") === "true") {{
        event.preventDefault();
        closeMenu({{ restoreFocus: true }});
      }}
    }});
    nav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => closeMenu()));

    bar.querySelectorAll("[data-lang]").forEach((button) => {{
      button.addEventListener("click", () => {{
        const nextLang = button.getAttribute("data-lang");
        if (!["ru", "en"].includes(nextLang)) return;
        storeLanguage(nextLang);
        document.documentElement.lang = nextLang;
        window.dispatchEvent(new CustomEvent("mgimo:language-change", {{ detail: {{ lang: nextLang }} }}));
        window.setTimeout(() => render({{ ...options, lang: nextLang }}), 0);
      }});
    }});

    document.documentElement.lang = lang;
    syncSkipLinks(lang);
    document.title = `${{copy.product}} - ${{pageTitle}}`;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute("content", `${{copy.product}}. ${{pageTitle}}.`);
    document.body.dataset.shellReady = "true";
    return bar;
  }}

  window.MGIMO_SHELL = {{
    MAIN_ROUTES,
    currentLanguage,
    currentPageId,
    pageMeta,
    render
  }};

  const autoRender = () => render();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", autoRender, {{ once: true }});
  else autoRender();
}})();
'''


def scrub_json(value: Any) -> Any:
    if isinstance(value, dict):
        return {key: scrub_json(item) for key, item in value.items() if key not in {"task", "step"}}
    if isinstance(value, list):
        return [scrub_json(item) for item in value]
    if isinstance(value, str):
        return scrub_public_text(value)
    return value


def copy_public_html() -> None:
    for _, source, destination, *_ in ROUTES:
        text = (DOCS / source).read_text(encoding="utf-8")
        (RELEASE / destination).write_text(scrub_html(text), encoding="utf-8")


def copy_public_assets() -> None:
    for path in ASSET_FILES:
        if path == "assets/site-shell.js":
            target = RELEASE / path
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(public_shell_js(), encoding="utf-8")
        elif path == "assets/platform2.js":
            copy_file(path, scrub_public_text)
        else:
            copy_file(path)
    release_css = RELEASE / "assets" / "platform2-world-class.css"
    if release_css.exists():
        release_css.write_text(release_css.read_text(encoding="utf-8") + """

@media (max-width: 620px) {
  .table-wrap {
    max-height: min(440px, 62vh);
    overflow: auto;
    overscroll-behavior: contain;
  }

  .table-wrap table {
    display: block;
    width: 100%;
    min-width: 0;
  }

  .table-wrap thead {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .table-wrap tbody,
  .table-wrap tr,
  .table-wrap td {
    display: block;
    width: 100%;
  }

  .table-wrap tbody {
    padding: 8px;
  }

  .table-wrap tr {
    padding: 8px 0;
    border-top: 1px solid var(--p2-border, #d8e1ec);
  }

  .table-wrap td {
    display: grid;
    grid-template-columns: minmax(88px, 0.42fr) minmax(0, 1fr);
    gap: 10px;
    padding: 5px 2px;
    border-top: 0;
    text-align: left;
  }

  .table-wrap td::before {
    content: attr(data-label);
    color: var(--p2-muted, #66748b);
    font-size: 0.72rem;
    font-weight: 850;
    line-height: 1.25;
  }

  .table-wrap td.num {
    justify-items: start;
    text-align: left;
  }

  .table-wrap .p2-country-flag,
  .table-wrap .wc-country-flag {
    overflow: hidden;
  }
}
""", encoding="utf-8")
    copy_tree("assets/vendor/leaflet")
    copy_tree("assets/vendor/plotly")
    plotly_bundle = RELEASE / "assets" / "vendor" / "plotly" / "plotly.min.js"
    if plotly_bundle.exists():
        plotly_bundle.write_text(plotly_bundle.read_text(encoding="utf-8").replace("Modules", "Parts"), encoding="utf-8")
    copy_tree("assets/vendor/flags/4x3")
    for svg_path in (RELEASE / "assets" / "vendor" / "flags" / "4x3").glob("*.svg"):
        text = svg_path.read_text(encoding="utf-8")
        sanitized = re.sub(r"(\d+\.\d+)(?=\.\d)", r"\1 ", text)
        if sanitized != text:
            svg_path.write_text(sanitized, encoding="utf-8")


def copy_public_data() -> None:
    for path in DATA_FILES:
        copy_file(path)
    copy_tree("data/platform2")
    for public_data_file in (RELEASE / "data" / "platform2").rglob("*"):
        if public_data_file.suffix.lower() not in {".csv", ".json", ".txt", ".md"}:
            continue
        text = public_data_file.read_text(encoding="utf-8", errors="ignore")
        sanitized = (
            text
            .replace("UIS observed flows", "UIS observed stock")
            .replace("UIS observed flow", "UIS observed stock")
        )
        if sanitized != text:
            public_data_file.write_text(sanitized, encoding="utf-8")
    dashboard = json.loads((DOCS / "data" / "mgimo_dashboard_data.json").read_text(encoding="utf-8"))
    country_reference = {
        "schema_version": "github_pages_public_country_reference_v1",
        "generated_at_utc": "2026-06-22T00:00:00Z",
        "source_artifact": "canonical country and UN WPP reference subset",
        "source_sha256": sha256(DOCS / "data" / "mgimo_dashboard_data.json"),
        "country_count": len(dashboard.get("countries", [])),
        "countries": dashboard.get("countries", []),
        "demographySeries": dashboard.get("demographySeries", {}),
        "ageSexPyramid": dashboard.get("ageSexPyramid", {}),
    }
    country_reference_path = RELEASE / "data" / "platform2" / "public_country_reference.json"
    country_reference_path.parent.mkdir(parents=True, exist_ok=True)
    country_reference_path.write_text(json.dumps(scrub_json(country_reference), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    ui_dir = RELEASE / "data" / "platform2" / "ui"
    for path in sorted(ui_dir.glob("*.json")):
        payload = scrub_json(json.loads(path.read_text(encoding="utf-8")))
        path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    copy_tree("reports")


def write_nojekyll() -> None:
    (RELEASE / ".nojekyll").write_text("", encoding="utf-8")


def write_local_launcher() -> None:
    (RELEASE / "open_github_pages_local.cmd").write_text(
        """@echo off
setlocal

set "ROOT=%~dp0"
set "PAGE=index.html"
set "PORT=4174"
set "URL=http://127.0.0.1:%PORT%/%PAGE%"

if not exist "%ROOT%%PAGE%" (
  echo GitHub Pages release index was not found:
  echo   "%ROOT%%PAGE%"
  echo.
  echo Open this launcher from release\\github-pages.
  pause
  exit /b 1
)

set "SERVER_CMD="
py -3 --version >nul 2>nul
if not errorlevel 1 set "SERVER_CMD=py -3 -m http.server %PORT% --bind 127.0.0.1"

if not defined SERVER_CMD (
  python --version >nul 2>nul
  if not errorlevel 1 set "SERVER_CMD=python -m http.server %PORT% --bind 127.0.0.1"
)

if defined SERVER_CMD (
  start "MGIMO GitHub Pages release server" /min cmd /c "cd /d ""%ROOT%"" && %SERVER_CMD%"
  timeout /t 2 /nobreak >nul
  start "" "%URL%"
  exit /b 0
)

where npx >nul 2>nul
if not errorlevel 1 (
  start "MGIMO GitHub Pages release server" /min cmd /c "cd /d ""%ROOT%"" && npx http-server . -a 127.0.0.1 -p %PORT% -c-1"
  timeout /t 3 /nobreak >nul
  start "" "%URL%"
  exit /b 0
)

echo Python or Node.js/npm is required to run the local GitHub Pages release server.
echo Install project dependencies, then double-click this file again.
pause
exit /b 1
""",
        encoding="utf-8",
        newline="\r\n",
    )


def assert_no_forbidden_public_markers() -> None:
    checked_extensions = {".html", ".js", ".css", ".json", ".csv", ".md", ".txt", ".geojson", ".svg"}
    findings: list[str] = []
    for path in RELEASE.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in checked_extensions:
            continue
        if "assets/vendor" in path.relative_to(RELEASE).as_posix():
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        for pattern in FORBIDDEN_PATTERNS:
            if re.search(pattern, text):
                findings.append(f"{path.relative_to(RELEASE).as_posix()}: {pattern}")
                break
    forbidden_paths = [
        "platform2.html",
        "students.html",
        "labor.html",
        "labor",
    ]
    for relative in forbidden_paths:
        if (RELEASE / relative).exists():
            findings.append(relative)
    if findings:
        sample = "\n".join(findings[:30])
        raise RuntimeError(f"Forbidden public markers found:\n{sample}")


def release_file_records(exclude: set[str] | None = None) -> list[dict[str, Any]]:
    exclude = exclude or set()
    files = []
    for path in sorted(RELEASE.rglob("*")):
        relative = path.relative_to(RELEASE).as_posix()
        if not path.is_file() or relative in exclude:
            continue
        files.append(
            {
                "path": relative,
                "bytes": path.stat().st_size,
                "sha256": sha256(path),
            }
        )
    return files


def write_payload_release_manifest() -> None:
    excluded = {"PUBLIC_RELEASE_MANIFEST.json", "release-manifest-v5.3.json", "RELEASE_MANIFEST.sha256"}
    files = release_file_records(excluded)
    payload = {
        "schema_version": "github-pages-release-v5.3",
        "status": "built",
        "generated_at_utc": "2026-06-22T00:00:00Z",
        "routes": [{"id": route, "path": dest} for route, _, dest, *_ in ROUTES],
        "files": files,
    }
    output = RELEASE / "release-manifest-v5.3.json"
    output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    digest_lines = [f"{item['sha256']}  {item['path']}" for item in files]
    digest_lines.append(f"{sha256(output)}  release-manifest-v5.3.json")
    (RELEASE / "RELEASE_MANIFEST.sha256").write_text("\n".join(digest_lines) + "\n", encoding="utf-8")


def write_manifest() -> None:
    files = release_file_records({"PUBLIC_RELEASE_MANIFEST.json"})
    manifest = {
        "schema_version": "github-pages-public-release-v1",
        "status": "built",
        "generated_at_utc": "2026-06-22T00:00:00Z",
        "source_docs_root": "docs",
        "publish_root": "release/github-pages",
        "routes": [{"id": route, "path": dest} for route, _, dest, *_ in ROUTES],
        "html_pages": HTML_ROUTES,
        "files": files,
    }
    output = RELEASE / "PUBLIC_RELEASE_MANIFEST.json"
    output.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    reset_release_dir()
    copy_public_html()
    copy_public_assets()
    copy_public_data()
    write_nojekyll()
    write_local_launcher()
    assert_no_forbidden_public_markers()
    write_payload_release_manifest()
    write_manifest()
    print(json.dumps({"status": "passed", "publish_root": str(RELEASE.relative_to(ROOT)).replace("\\", "/"), "html_pages": len(HTML_ROUTES)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
