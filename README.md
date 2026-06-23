# International educational migration to Russia

Static, reproducible GitHub Pages release for the MGIMO analytical platform on international educational migration to Russia.

The public site contains ten research pages: overview, observed inbound stock, demographic markets, gravity model, receptivity, competencies, forecast, structural gap, decision matrix, and executive report composer.

Live site after deployment:

https://arseniy24rus.github.io/International-educational-migration-to-Russia/

## What Is Included

- Source HTML and runtime assets under `docs/`.
- Public data artifacts under `docs/data/`, including the platform payload, public country reference, UI marts, source manifests, and compact CSV/JSON outputs used by the dashboard.
- Public frontend source builder under `src/frontend/platform2/`.
- Deterministic release scripts under `scripts/`.
- Small reproducibility metadata under `configs/`, `schemas/`, `data/source_registry.yaml`, `data/source_manifest_platform2.json`, `data/metadata/`, and `data/model_outputs/current/`.

## What Is Excluded

Large raw archives, source API snapshots, Trudvsem record snapshots, intermediate curated datasets, local worklogs, and QA screenshots are not stored as ordinary Git blobs. This keeps the repository suitable for GitHub Pages and avoids publishing private or unnecessarily large evidence layers. Public UI artifacts keep source IDs, checksums, periods, units, and evidence classes so the released dashboard remains auditable.

## Reproduce The Pages Artifact

Install dependencies:

```bash
npm ci
npx playwright install --with-deps
```

Build, validate, and run browser QA:

```bash
npm run frontend:public:release
```

The generated publish artifact is written to `release/github-pages`. On Windows, open the local release with:

```bat
release\github-pages\open_github_pages_local.cmd
```

## Validate A Deployed Site

After GitHub Pages deployment:

```bash
node scripts/run_github_pages_release_qa.cjs --engine chromium --base-url https://arseniy24rus.github.io/International-educational-migration-to-Russia
node scripts/run_github_pages_release_qa.cjs --engine webkit --base-url https://arseniy24rus.github.io/International-educational-migration-to-Russia
```

The QA runner checks all ten pages, source drawers, flags, blank charts/maps, layout overflow, forbidden development markers, and the English executive report generation path.

## Public Data Provenance

Start from these files:

- `docs/data/mgimo_platform2_payload.json` - canonical public payload consumed by the dashboard.
- `docs/data/platform2/source_manifest_platform2.json` - public source manifest and failed-attempt registry.
- `data/source_registry.yaml` and `data/source_manifest_platform2.json` - compact reproducibility metadata retained with the public repository.
- `release/github-pages/PUBLIC_RELEASE_MANIFEST.json` - generated file inventory after `npm run frontend:public:build`.
