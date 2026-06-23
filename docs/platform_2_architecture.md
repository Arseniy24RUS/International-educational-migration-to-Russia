# Архитектура Platform 2.0

## Целевая логика

Platform 2.0 остаётся статическим dashboard на GitHub Pages. Разница между текущей версией и Platform 2.0 состоит не в backend, а в появлении воспроизводимого исследовательского контура:

`source probes → raw data → staging normalization → curated analytical tables → model outputs → static public payload → dashboard/report/exports`.

## Data zones

`data/raw/` хранит неизменённые выгрузки API, bulk files, HTML/PDF/CSV/XLSX official sources, checksum manifests.

`data/staging/` хранит распарсенные и harmonized tables с исходными единицами измерения и source row ids.

`data/curated/` хранит аналитические таблицы Platform 2.0 с нормализованными ISO3, годами, статусами наблюдения и provenance columns.

`data/model/` хранит коэффициенты моделей, diagnostics, forecasts, gap estimates.

`docs/data/` хранит публичные JSON/CSV для GitHub Pages. Сюда попадают только данные, которые можно публично распространять.

`reports/` хранит аналитические отчёты, собранные из curated/model/public data.

`worklogs/platform2/` хранит source probe logs, Codex/subagent decisions, QA protocols.

## Основные таблицы

### `education_migration_od_2010_2025.csv`
Международная OD-панель образовательной миграции.

Columns:
`origin_iso3`, `origin_country`, `destination_iso3`, `destination_country`, `year`, `students_count`, `education_level`, `sex`, `field_of_study`, `source_key`, `source_indicator`, `source_url_or_file`, `retrieved_at`, `raw_value`, `unit`, `observation_status`, `license_or_terms`, `sha256_or_etag`, `notes`.

### `russia_inbound_by_origin_2010_2025.csv`
Фактический приток/контингент иностранных студентов в России по странам происхождения.

Columns:
`origin_iso3`, `origin_country`, `destination_iso3`, `destination_country`, `year`, `students_count`, `flow_or_stock`, `education_level`, `program_level`, `funding_channel`, `source_key`, `source_url_or_file`, `retrieved_at`, `observation_status`, `coverage_note`.

### `country_year_features_2010_2025.csv`
Панель предикторов для модели.

Columns:
`iso3`, `country`, `year`, `pop_15_24`, `pop_20_24`, `pop_25_29`, `outbound_mobility_ratio`, `gdp_pc_ppp`, `internet_users_pct`, `tertiary_enrollment_ratio`, `wgi_government_effectiveness`, `wgi_political_stability`, `distance_to_moscow_km`, `russian_language_environment`, `mgimo_partner_count`, `friendliness_index`, source fields for each variable in long-form companion table.

### `friendliness_receptivity_index.csv`
Composite index with components and coverage.

Columns:
`iso3`, `country`, `year`, `friendliness_index`, `survey_attitude_component`, `un_voting_affinity_component`, `institutional_presence_component`, `russian_language_component`, `education_behavior_component`, `component_coverage_score`, `normalization_method`, `weight_version`, `source_trace_id`.

### `vacancy_competency_counts.csv`
Vacancy/skill database.

Columns:
`source_key`, `retrieved_at`, `country_iso3`, `region_name`, `keyword_group`, `keyword`, `vacancy_count`, `skill_name`, `skill_count`, `professional_role`, `salary_from_median`, `salary_to_median`, `currency`, `source_url`, `observation_status`.

### `gravity_model_report.json`
Machine-readable model card.

Fields:
`model_id`, `dependent_variable`, `estimator`, `formula`, `training_years`, `validation_years`, `n_observations`, `n_origins`, `coefficients`, `standard_errors`, `fit_metrics`, `diagnostics`, `source_tables`, `limitations`.

### `potential_forecast_2026_2050.csv`
Country-year-program-language forecast.

Columns:
`origin_iso3`, `origin_country`, `macroregion`, `year`, `program_area`, `language_of_instruction`, `potential_students`, `potential_index`, `prediction_interval_low`, `prediction_interval_high`, `model_id`, `observation_status`, `source_trace_id`.

### `unrealized_potential_gap.csv`
Actual vs potential gap.

Columns:
`origin_iso3`, `origin_country`, `actual_students_latest`, `actual_period`, `potential_students_latest`, `potential_year`, `gap_abs`, `gap_ratio`, `rank_unrealized_potential`, `coverage_status`, `notes`.

### `country_program_matrix.csv`
Final management matrix.

Columns:
`country_iso3`, `country`, `macroregion`, `priority_tier`, `program_area`, `language_of_instruction`, `recruitment_instrument`, `expected_effect`, `effect_basis`, `risk_level`, `risk_note`, `source_trace_id`.

## Static payload design

`docs/data/mgimo_platform2_payload.json` should expose:

```json
{
  "meta": {
    "version": "2.0",
    "generated_at": "...",
    "source_manifest_sha256": "...",
    "no_synthetic_numbers": true
  },
  "countries": {},
  "odFlows": {},
  "russiaInbound": {},
  "gravityModel": {},
  "forecast2050": {},
  "friendliness": {},
  "vacancies": {},
  "unrealizedPotential": {},
  "countryProgramMatrix": {},
  "sources": {},
  "coverage": {}
}
```

The existing `mgimo_dashboard_data.json` may remain the canonical legacy payload for current branch/students pages; Platform 2.0 may either extend it or use a separate payload. The safer migration path is separate payload plus shared source drawer component.

## UI sections

1. Executive summary cards: verified countries covered, OD rows, Russia-inbound coverage, model status, top unrealized markets.
2. Global OD migration map and country-pair explorer.
3. Russia inbound observed flows, with “no open observed row” state if source missing.
4. Youth market forecast to 2050.
5. Gravity model explanation and diagnostics.
6. Friendliness/receptivity map.
7. Vacancy and competency heatmap.
8. Potential migration forecast by country/program/language.
9. Actual vs potential gap ranking.
10. Country–program–language–instrument–effect matrix.
11. Source passport drawer and downloads.
12. Report download panel.

## Compatibility with current repository

Do not remove existing files. Add:
`docs/platform2.html`, `docs/assets/platform2.js`, `docs/assets/platform2.css`, `docs/data/mgimo_platform2_payload.json`.

Update navigation in `docs/index.html` and `docs/students.html` to include “Platform 2.0 / Глобальная карта образовательной миграции”.

Keep existing QA scripts and add Platform 2.0 validators. Existing `npm run qa` should include the new tests.
