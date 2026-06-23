#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
let chromium;
let webkit;
try {
  ({ chromium, webkit } = require('@playwright/test'));
} catch (error) {
  console.error('Playwright dependency is unavailable. Run: npm ci');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(2);
}

const browserPaths = {
  chromium: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || chromium.executablePath(),
  webkit: process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE_PATH || webkit.executablePath(),
};
const requested = (process.env.PLAYWRIGHT_REQUIRED_BROWSERS || 'chromium,webkit')
  .split(',').map((name) => name.trim()).filter(Boolean);
const required = requested.map((name) => [name, browserPaths[name]]);
const missing = required.filter(([, executable]) => !executable || !fs.existsSync(executable));
if (missing.length) {
  console.error('Playwright browser preflight failed. Missing executable(s):');
  for (const [name, executable] of missing) console.error(`- ${name}: ${executable || '(unknown path)'}`);
  console.error('Install the pinned browsers and OS dependencies with: npx playwright install --with-deps');
  process.exit(2);
}
console.log(JSON.stringify({ status: 'passed', browsers: Object.fromEntries(required) }));
