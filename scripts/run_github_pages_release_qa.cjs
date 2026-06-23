#!/usr/bin/env node
"use strict";

const fs = require("fs");
const http = require("http");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const RELEASE = path.join(ROOT, "release", "github-pages");
const OUT = path.join(ROOT, "artifacts", "github-pages-release");
const SCREEN_DIR = path.join(OUT, "screenshots");
const SECTION_DIR = path.join(OUT, "sections");
const CONTACT_DIR = path.join(OUT, "contact-sheets");

const ROUTES = [
  { id: "platform2", path: "index.html" },
  { id: "migration", path: "migration.html" },
  { id: "demography", path: "demography.html" },
  { id: "model", path: "model.html" },
  { id: "friendliness", path: "friendliness.html" },
  { id: "vacancies", path: "vacancies.html" },
  { id: "forecast", path: "forecast.html" },
  { id: "gap", path: "gap.html" },
  { id: "matrix", path: "matrix.html" },
  { id: "report", path: "report.html" },
];

const VARIANTS = [
  { id: "ru-1600", lang: "ru", width: 1600, height: 1000, mobile: false },
  { id: "ru-1366", lang: "ru", width: 1366, height: 768, mobile: false },
  { id: "en-1600", lang: "en", width: 1600, height: 1000, mobile: false },
  { id: "ru-mobile", lang: "ru", width: 390, height: 844, mobile: true },
];

const ENGINE_NAMES = new Set(["chromium", "webkit"]);

const MIME = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".geojson", "application/geo+json; charset=utf-8"],
  [".csv", "text/csv; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".md", "text/markdown; charset=utf-8"],
]);

function requestedEngineNames() {
  const cliEngineIndex = process.argv.indexOf("--engine");
  const cliEngine = cliEngineIndex >= 0 ? process.argv[cliEngineIndex + 1] : "";
  return (cliEngine || process.env.MGIMO_PUBLIC_RELEASE_QA_ENGINES || process.env.MGIMO_FRONTEND_QA_ENGINES || "chromium,webkit")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function requestedBaseUrl() {
  const cliBaseUrlIndex = process.argv.indexOf("--base-url");
  const cliBaseUrl = cliBaseUrlIndex >= 0 ? process.argv[cliBaseUrlIndex + 1] : "";
  const value = cliBaseUrl || process.env.MGIMO_PUBLIC_RELEASE_QA_BASE_URL || "";
  return value ? value.replace(/\/+$/, "") : "";
}

function ensureDirs() {
  for (const dir of [SCREEN_DIR, SECTION_DIR, CONTACT_DIR]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function contactSrc(filePath) {
  return path.relative(CONTACT_DIR, path.resolve(ROOT, filePath)).replace(/\\/g, "/");
}

function serve(root) {
  const server = http.createServer((request, response) => {
    const rawUrl = new URL(request.url || "/", "http://127.0.0.1");
    const pathname = decodeURIComponent(rawUrl.pathname === "/" ? "/index.html" : rawUrl.pathname);
    const resolved = path.resolve(root, "." + pathname);
    if (!resolved.startsWith(root)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }
    fs.readFile(resolved, (error, body) => {
      if (error) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }
      response.writeHead(200, {
        "content-type": MIME.get(path.extname(resolved).toLowerCase()) || "application/octet-stream",
        "cache-control": "no-store",
      });
      response.end(body);
    });
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${address.port}` });
    });
  });
}

function safeName(value) {
  return String(value).replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
}

async function waitForApp(page) {
  await page.waitForFunction(() => document.body?.dataset?.shellReady === "true", { timeout: 30000 });
  await page.waitForFunction(() => document.documentElement?.dataset?.uiReady === "true", { timeout: 45000 });
  await page.waitForFunction(
    () => document.documentElement?.dataset?.worldClassReady === "true" || document.documentElement?.dataset?.worldClassError === "true",
    { timeout: 45000 }
  );
  await page.waitForTimeout(900);
}

async function captureSections(page, engine, route, variant, errors) {
  const selectors = [
    ["hero", ".page-hero"],
    ["command", "#wcCommandCenter"],
    ["workbench", "#wcRouteWorkbench"],
    ["dashboard", ".dashboard-grid"],
    ["analysis", ".analysis-grid"],
    ["map", ".map"],
    ["chart", ".chart"],
    ["table", ".wc-table-wrap, details.data-disclosure, .ranking-panel"],
  ];
  const saved = [];
  for (const [name, selector] of selectors) {
    const locator = page.locator(selector).first();
    if (!(await locator.count())) continue;
    try {
      await page.evaluate(() => {
        document.activeElement?.blur?.();
        document.body.dataset.qaSectionCapture = "true";
        if (!document.getElementById("mgimo-qa-section-style")) {
          const style = document.createElement("style");
          style.id = "mgimo-qa-section-style";
          style.textContent = `
            body[data-qa-section-capture="true"] header.app-header,
            body[data-qa-section-capture="true"] header.platform2-header,
            body[data-qa-section-capture="true"] #platform2Header,
            body[data-qa-section-capture="true"] .skip-link {
              visibility: hidden !important;
              pointer-events: none !important;
            }
          `;
          document.head.appendChild(style);
        }
      }).catch(() => {});
      const visible = await locator.isVisible({ timeout: 1000 }).catch(() => false);
      if (!visible) {
        await page.evaluate(() => { delete document.body.dataset.qaSectionCapture; }).catch(() => {});
        continue;
      }
      const file = path.join(SECTION_DIR, `${engine}-${route.id}-${variant.id}-${name}.png`);
      await locator.screenshot({ path: file, animations: "disabled" });
      await page.evaluate(() => { delete document.body.dataset.qaSectionCapture; }).catch(() => {});
      saved.push(path.relative(ROOT, file).replace(/\\/g, "/"));
    } catch (error) {
      await page.evaluate(() => { delete document.body.dataset.qaSectionCapture; }).catch(() => {});
      errors.push(`section screenshot failed ${route.id}/${variant.id}/${name}: ${error.message}`);
    }
  }

  const sourceButton = page.locator("[data-wc-source-kind], [data-wc-selected-source], [data-open-sources]").first();
  if (await sourceButton.count()) {
    await sourceButton.click().catch(() => {});
    await page.waitForTimeout(250);
    const drawer = page.locator("#sourceDrawer.open").first();
    if (await drawer.count()) {
      const file = path.join(SECTION_DIR, `${engine}-${route.id}-${variant.id}-source-drawer.png`);
      await drawer.screenshot({ path: file, animations: "disabled" }).catch((error) => errors.push(`source drawer screenshot failed ${route.id}/${variant.id}: ${error.message}`));
      saved.push(path.relative(ROOT, file).replace(/\\/g, "/"));
      await page.evaluate(() => {
        const closeButton = document.querySelector("#closeDrawer");
        if (closeButton) closeButton.click();
        const drawerElement = document.querySelector("#sourceDrawer");
        if (drawerElement?.classList.contains("open")) {
          drawerElement.classList.remove("open");
          drawerElement.setAttribute("aria-hidden", "true");
        }
      }).catch(() => {});
      await page.waitForTimeout(150);
    }
  }

  if (variant.mobile) {
    const menu = page.locator(".mgimo-shell-menu-button").first();
    if (await menu.count()) {
      await menu.click().catch(() => {});
      await page.waitForTimeout(250);
      const nav = page.locator("#mgimoResearchNav").first();
      if (await nav.count()) {
        const file = path.join(SECTION_DIR, `${engine}-${route.id}-${variant.id}-mobile-menu.png`);
        await nav.screenshot({ path: file, animations: "disabled" }).catch((error) => errors.push(`mobile menu screenshot failed ${route.id}/${variant.id}: ${error.message}`));
        saved.push(path.relative(ROOT, file).replace(/\\/g, "/"));
      }
    }
  }
  return saved;
}

async function inspectPage(page, route) {
  return await page.evaluate((routeId) => {
    const errors = [];
    const warnings = [];
    const forbidden = [
      ["task_number", /5\.2\.\d+/],
      ["task_ru", /Задача/],
      ["task_en", /Task\s+5\.2/],
      ["modules_ru", /Модули/],
      ["modules_en", /Modules/],
    ];
    const bodyText = document.body.innerText || "";
    for (const [name, pattern] of forbidden) {
      if (pattern.test(bodyText)) errors.push(`visible forbidden marker: ${name}`);
    }
    const badLinks = [...document.querySelectorAll("a[href]")]
      .map((link) => link.getAttribute("href") || "")
      .filter((href) => /platform2\.html|students\.html|labor\.html|(?:^|\/)labor\//.test(href));
    if (badLinks.length) errors.push(`forbidden links: ${badLinks.slice(0, 8).join(", ")}`);

    const scrollWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    const overflow = Math.max(0, scrollWidth - window.innerWidth);
    if (overflow > 2) errors.push(`horizontal overflow ${overflow}px`);

    const isVisible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 1 && rect.height > 1;
    };

    const clipSelectors = [
      "h1", "h2", "h3", "button", "a", "th", "td", ".badge", ".action-button", ".primary-action", ".text-button",
      ".mgimo-shell-nav-link", ".wc-focus-row", ".wc-metric-card", ".wc-source-tile", ".wc-detail-panel",
      ".executive-finding-card", ".program-demand-card", ".recommendation-card", ".sector-tile"
    ];
    const clipped = [];
    for (const element of document.querySelectorAll(clipSelectors.join(","))) {
      if (!isVisible(element)) continue;
      const style = getComputedStyle(element);
      const overflowX = style.overflowX;
      const overflowY = style.overflowY;
      const allowX = overflowX === "auto" || overflowX === "scroll" || element.closest(".wc-table-wrap, .table-wrap, .data-table-wrap");
      const allowY = overflowY === "auto" || overflowY === "scroll";
      const clipsY = overflowY === "hidden" || overflowY === "clip";
      if (!allowX && element.scrollWidth > element.clientWidth + 3) {
        clipped.push(`${element.tagName.toLowerCase()}${element.className ? "." + String(element.className).trim().replace(/\s+/g, ".") : ""} width ${element.scrollWidth}/${element.clientWidth}`);
      } else if (clipsY && !allowY && element.scrollHeight > element.clientHeight + 4 && style.whiteSpace !== "nowrap") {
        clipped.push(`${element.tagName.toLowerCase()}${element.className ? "." + String(element.className).trim().replace(/\s+/g, ".") : ""} height ${element.scrollHeight}/${element.clientHeight}`);
      }
      if (clipped.length >= 20) break;
    }
    if (clipped.length) errors.push(`visible clipping: ${clipped.join(" | ")}`);

    const blankCharts = [];
    for (const chart of document.querySelectorAll(".chart, [data-chart]")) {
      if (!isVisible(chart)) continue;
      const rect = chart.getBoundingClientRect();
      if (rect.width < 80 || rect.height < 40) continue;
      const hasSvg = chart.querySelector("svg path, svg rect, svg circle, canvas");
      const hasHtmlBars = chart.querySelector(".bar-row, .wc-bar-row, i[style*='width'], table, .plot-container");
      const text = (chart.innerText || "").trim();
      if (!hasSvg && !hasHtmlBars && text.length < 20) {
        blankCharts.push(chart.id || chart.getAttribute("data-chart") || chart.className || "chart");
      }
    }
    if (blankCharts.length) errors.push(`blank chart containers: ${blankCharts.slice(0, 10).join(", ")}`);

    const blankMaps = [];
    for (const map of document.querySelectorAll(".map")) {
      if (!isVisible(map)) continue;
      const rect = map.getBoundingClientRect();
      if (rect.width < 120 || rect.height < 120) continue;
      const tiles = map.querySelectorAll(".leaflet-tile-loaded, .leaflet-tile").length;
      const vectors = map.querySelectorAll(".leaflet-interactive, .leaflet-marker-icon, svg path").length;
      if (!tiles && !vectors) blankMaps.push(map.id || "map");
      else if (tiles && !vectors) warnings.push(`map has tiles but no detected vector overlay: ${map.id || "map"}`);
    }
    if (blankMaps.length) errors.push(`blank map containers: ${blankMaps.join(", ")}`);

    const flagRows = [...document.querySelectorAll("[data-country-iso3]")]
      .filter((element) => element.getAttribute("data-country-iso3"))
      .filter((element) => !element.closest(".wc-country-flag"));
    const missingFlags = flagRows
      .filter((element) => {
        const state = element.getAttribute("data-country-flag-state");
        return state !== "not-applicable" && !element.querySelector(".wc-country-flag-image, .country-flag-image, .wc-country-flag.is-placeholder");
      })
      .slice(0, 12)
      .map((element) => `${element.tagName.toLowerCase()} ${element.getAttribute("data-country-iso3")}`);
    if (missingFlags.length) errors.push(`country rows without flag: ${missingFlags.join(", ")}`);
    if (!["model", "vacancies"].includes(routeId)) {
      const visibleFlags = [...document.querySelectorAll(".wc-country-flag-image, .country-flag-image")].filter(isVisible).length;
      if (visibleFlags === 0) errors.push("no visible country flags on country-bearing route");
    }

    for (const panel of document.querySelectorAll(".panel, .wc-workbench, .wc-command-center, .wc-detail-panel")) {
      if (!isVisible(panel)) continue;
      const rect = panel.getBoundingClientRect();
      if (rect.height < 240 || rect.width < 240) continue;
      const childRects = [...panel.children].map((child) => child.getBoundingClientRect()).filter((rect) => rect.width > 4 && rect.height > 4);
      const area = childRects.reduce((sum, rect) => sum + Math.min(rect.width * rect.height, panel.getBoundingClientRect().width * panel.getBoundingClientRect().height), 0);
      const coverage = area / Math.max(1, rect.width * rect.height);
      if (coverage < 0.06) warnings.push(`low content coverage ${(coverage * 100).toFixed(1)}% in ${panel.id || panel.className}`);
    }

    return { errors, warnings, metrics: { overflow, flags: document.querySelectorAll(".wc-country-flag-image, .country-flag-image").length } };
  }, route.id);
}

async function inspectEnglishReport(page, route, variant) {
  if (route.id !== "report" || variant.lang !== "en" || variant.mobile) {
    return { errors: [], warnings: [], metrics: {} };
  }
  const errors = [];
  const warnings = [];
  const composer = await page.evaluate(() => ({
    htmlLang: document.documentElement.lang,
    hasGenerate: /Generate report/.test(document.body.innerText || ""),
    cyrillicBefore: /[А-Яа-яЁё]/.test(document.body.innerText || ""),
  }));
  if (composer.htmlLang !== "en") errors.push(`report html lang is ${composer.htmlLang}, expected en`);
  if (!composer.hasGenerate) errors.push("English composer does not expose Generate report");
  if (composer.cyrillicBefore) errors.push("visible Cyrillic in English report composer");

  await page.locator("#generateManagementReport").click({ timeout: 10000 });
  await page.waitForSelector(".management-report-document[data-lang='en'] .report-book > section", { timeout: 60000 });
  await page.waitForTimeout(500);
  await page.evaluate(() => window.ReportCartography?.enhance?.(document, { lang: "en" })).catch(() => {});
  const generated = await page.evaluate(() => {
    const errors = [];
    const warnings = [];
    const isVisible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 1 && rect.height > 1;
    };
    const doc = document.querySelector(".management-report-document[data-lang='en']");
    if (!doc) {
      return { errors: ["generated report document is missing data-lang=en"], warnings, metrics: {} };
    }
    const text = doc.innerText || "";
    if (!/International educational migration to Russia/.test(text)) errors.push("English cover title is missing");
    if (!/Manifest JSON/.test(text) || !/Print \/ PDF/.test(text) || !/Close/.test(text)) errors.push("English toolbar labels are missing");
    if (!/Cartographic interpretation of platform results/.test(text)) warnings.push("English cartography chapter not detected");

    const bad = [];
    const walker = document.createTreeWalker(doc, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const value = node.nodeValue || "";
        if (!/[А-Яа-яЁё]/.test(value)) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (parent.closest("[data-source-citation], code, pre, .source-id")) return NodeFilter.FILTER_REJECT;
        if (!isVisible(parent)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    while (walker.nextNode() && bad.length < 20) {
      bad.push((walker.currentNode.nodeValue || "").replace(/\s+/g, " ").trim().slice(0, 120));
    }
    if (bad.length) errors.push(`visible Cyrillic in generated English report: ${bad.join(" | ")}`);
    return {
      errors,
      warnings,
      metrics: {
        pages: doc.querySelectorAll(".report-book > section, .report-cartography-page").length,
        cartographyPages: doc.querySelectorAll(".report-cartography-page").length,
      },
    };
  });
  errors.push(...generated.errors);
  warnings.push(...generated.warnings);
  return { errors, warnings, metrics: generated.metrics };
}

async function runCase(browser, engine, route, variant, baseUrl) {
  const context = await browser.newContext({
    viewport: { width: variant.width, height: variant.height },
    isMobile: variant.mobile,
    deviceScaleFactor: variant.mobile ? 2 : 1,
  });
  await context.addInitScript((lang) => {
    for (const key of ["mgimo_platform2_lang", "mgimo_students_lang", "mgimo_lang"]) {
      localStorage.setItem(key, lang);
      sessionStorage.setItem(key, lang);
    }
  }, variant.lang);
  try {
    const page = await context.newPage();
    const errors = [];
    const warnings = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(`console error: ${message.text()}`);
    });
    page.on("pageerror", (error) => errors.push(`page error: ${error.message}`));

    const url = `${baseUrl}/${route.path}`;
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await waitForApp(page);

    await page.evaluate(() => document.activeElement?.blur?.()).catch(() => {});
    const shot = path.join(SCREEN_DIR, `${engine}-${route.id}-${variant.id}.png`);
    await page.screenshot({ path: shot, fullPage: true, animations: "disabled" });
    const sectionScreenshots = await captureSections(page, engine, route, variant, errors);
    const inspection = await inspectPage(page, route);
    errors.push(...inspection.errors);
    warnings.push(...inspection.warnings);
    const reportInspection = await inspectEnglishReport(page, route, variant);
    errors.push(...reportInspection.errors);
    warnings.push(...reportInspection.warnings);

    return {
      engine,
      route: route.id,
      path: route.path,
      variant: variant.id,
      url,
      screenshot: path.relative(ROOT, shot).replace(/\\/g, "/"),
      section_screenshots: sectionScreenshots,
      errors,
      warnings,
      metrics: { ...inspection.metrics, report: reportInspection.metrics },
      status: errors.length ? "failed" : "passed",
    };
  } finally {
    await context.close().catch(() => {});
  }
}

function writeContactSheet(results) {
  const html = `<!doctype html>
<meta charset="utf-8">
<title>GitHub Pages release QA contact sheet</title>
<style>
body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;margin:24px;background:#f6f8fb;color:#17243a}
h1{font-size:24px} h2{font-size:18px;margin-top:28px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
figure{margin:0;padding:10px;background:#fff;border:1px solid #d8e1ec;border-radius:8px}
img{width:100%;height:260px;object-fit:contain;background:#eef3f8}
figcaption{font-size:12px;line-height:1.35;margin-top:8px}
.failed{border-color:#c94444}
</style>
<h1>GitHub Pages release QA contact sheet</h1>
${["chromium", "webkit"].map((engine) => `<h2>${engine}</h2><div class="grid">${results.filter((item) => item.engine === engine).map((item) => `<figure class="${item.status === "failed" ? "failed" : ""}"><img src="${contactSrc(item.screenshot)}" alt="${item.engine} ${item.route} ${item.variant}"><figcaption><strong>${item.route}</strong> ${item.variant}<br>${item.status}${item.errors.length ? `<br>${item.errors.slice(0, 2).join("<br>")}` : ""}</figcaption></figure>`).join("")}</div>`).join("")}`;
  fs.writeFileSync(path.join(CONTACT_DIR, "index.html"), html, "utf8");
}

function writeQaReport(results, sourceReports = []) {
  writeContactSheet(results);
  const report = {
    status: results.some((item) => item.status !== "passed") ? "failed" : "passed",
    generated_at_utc: new Date().toISOString(),
    release_root: "release/github-pages",
    screenshots_dir: path.relative(ROOT, SCREEN_DIR).replace(/\\/g, "/"),
    sections_dir: path.relative(ROOT, SECTION_DIR).replace(/\\/g, "/"),
    contact_sheet: path.relative(ROOT, path.join(CONTACT_DIR, "index.html")).replace(/\\/g, "/"),
    ...(sourceReports.length ? { source_reports: sourceReports } : {}),
    results,
  };
  fs.writeFileSync(path.join(OUT, "public-release-qa.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
  const engines = [...new Set(results.map((item) => item.engine))];
  if (engines.length === 1) {
    fs.writeFileSync(path.join(OUT, `public-release-qa-${engines[0]}.json`), JSON.stringify(report, null, 2) + "\n", "utf8");
  }
  return report;
}

function routeSortKey(result) {
  const engineOrder = { chromium: 0, webkit: 1 };
  const routeOrder = Object.fromEntries(ROUTES.map((route, index) => [route.id, index]));
  const variantOrder = Object.fromEntries(VARIANTS.map((variant, index) => [variant.id, index]));
  return [
    engineOrder[result.engine] ?? 99,
    routeOrder[result.route] ?? 99,
    variantOrder[result.variant] ?? 99,
  ].join(":");
}

async function settleWithTimeout(promise, ms, label) {
  let timer;
  try {
    await Promise.race([
      promise,
      new Promise((resolve) => {
        timer = setTimeout(() => {
          console.warn(`${label} timed out after ${ms}ms; continuing after completed QA cases`);
          resolve();
        }, ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function runIsolatedEngines(engineNames, baseUrl) {
  const sourceReports = [];
  const results = [];
  for (const engine of engineNames) {
    if (!ENGINE_NAMES.has(engine)) throw new Error(`Unsupported engine: ${engine}`);
    const childEnv = { ...process.env };
    for (const key of Object.keys(childEnv)) {
      if (/^npm_/i.test(key) || key === "INIT_CWD") delete childEnv[key];
    }
    const args = [__filename, "--engine", engine];
    if (baseUrl) args.push("--base-url", baseUrl);
    const child = spawnSync(process.execPath, args, {
      cwd: ROOT,
      env: childEnv,
      stdio: "inherit",
    });
    if (child.status !== 0) process.exit(child.status || 1);
    const reportPath = path.join(OUT, "public-release-qa.json");
    const engineReportPath = path.join(OUT, `public-release-qa-${engine}.json`);
    fs.copyFileSync(reportPath, engineReportPath);
    sourceReports.push(path.relative(ROOT, engineReportPath).replace(/\\/g, "/"));
    const report = JSON.parse(fs.readFileSync(engineReportPath, "utf8"));
    results.push(...report.results);
  }
  results.sort((a, b) => routeSortKey(a).localeCompare(routeSortKey(b)));
  const report = writeQaReport(results, sourceReports);
  if (report.status !== "passed") {
    const failed = results.filter((item) => item.status !== "passed").slice(0, 12).map((item) => `${item.engine} ${item.route} ${item.variant}: ${item.errors.join("; ")}`);
    console.error(failed.join("\n"));
    process.exit(1);
  }
}

async function main() {
  ensureDirs();
  const baseUrlOverride = requestedBaseUrl();
  if (!baseUrlOverride && !fs.existsSync(RELEASE)) {
    throw new Error("release/github-pages does not exist. Run npm run frontend:public:build first.");
  }
  const engineNames = requestedEngineNames();
  if (engineNames.length > 1 && process.env.MGIMO_PUBLIC_RELEASE_QA_CHILD !== "1") {
    runIsolatedEngines(engineNames, baseUrlOverride);
    return;
  }
  const { chromium, webkit } = require("@playwright/test");
  const engines = { chromium, webkit };
  const served = baseUrlOverride ? { server: null, baseUrl: baseUrlOverride } : await serve(RELEASE);
  const { server, baseUrl } = served;
  const results = [];
  try {
    for (const engine of engineNames) {
      if (!ENGINE_NAMES.has(engine) || !engines[engine]) throw new Error(`Unsupported engine: ${engine}`);
      // eslint-disable-next-line no-await-in-loop
      const browser = await engines[engine].launch();
      try {
        for (const route of ROUTES) {
          for (const variant of VARIANTS) {
            // eslint-disable-next-line no-await-in-loop
            const result = await runCase(browser, engine, route, variant, baseUrl);
            results.push(result);
            const mark = result.status === "passed" ? "PASS" : "FAIL";
            console.log(`${mark} ${engine} ${route.id} ${variant.id}`);
          }
        }
      } finally {
        // eslint-disable-next-line no-await-in-loop
        await settleWithTimeout(browser.close().catch(() => {}), 15000, `${engine} browser.close`);
      }
    }
  } finally {
    if (server) await settleWithTimeout(new Promise((resolve) => server.close(resolve)), 5000, "release QA server.close");
  }
  const report = writeQaReport(results);
  if (report.status !== "passed") {
    const failed = results.filter((item) => item.status !== "passed").slice(0, 12).map((item) => `${item.engine} ${item.route} ${item.variant}: ${item.errors.join("; ")}`);
    console.error(failed.join("\n"));
    process.exit(1);
  }
  process.exit(0);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
