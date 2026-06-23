(() => {
  "use strict";

  const VIEW = document.body.dataset.view || "platform2";
  const MOSCOW = { lat: 55.7558, lon: 37.6176 };
  const DATA_URLS = {
    payload: "data/mgimo_platform2_payload.json",
    countries: "data/mgimo_dashboard_data.json",
    geo: "data/world_admin_boundaries_ru_claimed_update_2026.geojson",
    inbound: "data/platform2/russia_inbound_students_by_origin_2010_2025.csv",
    forecast: "data/platform2/potential_forecast_2026_2050.csv",
    gap: "data/platform2/unrealized_potential_gap.csv",
    matrix: "data/platform2/country_program_priority_v5.csv",
    trudvsemV2: "data/platform2/trudvsem_labor_market_v5.json",
    friendliness: "data/platform2/friendliness_index.csv",
    vacancy: "data/platform2/vacancy_competency_aggregates.csv",
    labor: "data/platform2/labor_migration_dashboard.json",
    laborRegions: "data/platform2/russia_regions.geojson",
  };

  const TXT = {
    ru: {
      title: "Направления международной образовательной миграции и решений МГИМО",
      subtitle: "Наблюдаемые строки UIS, модельный потенциал PPML, разрыв факт-потенциал, матрица программ и источник каждого числа показаны раздельно.",
      navBranches: "Филиалы",
      navStudents: "Студенты",
      navOverview: "Обзор",
      navMigration: "Потоки",
      navDemography: "Рынки 2050",
      navModel: "Модель",
      navFriendliness: "Восприимчивость",
      navForecast: "Прогноз",
      navGap: "Потенциал",
      navMatrix: "Матрица",
      navReport: "Отчёт",
      navLabor: "Трудовая миграция",
      navVacancies: "Вакансии и компетенции",
      loading: "Загрузка проверенных данных...",
      sourcePassports: "Паспорта источников",
      close: "Закрыть",
      downloads: "Выгрузки",
      observed: "Наблюдаемая численность UIS",
      modelled: "Модельный потенциал",
      fact: "Факт UIS",
      potential: "Структурная ёмкость",
      gap: "Разрыв",
      country: "Страна",
      year: "Год",
      students: "Студенты",
      rank: "Место",
      status: "Статус",
      source: "Источник",
      passport: "Паспорт",
      sourceKey: "Идентификатор источника",
      retrieved: "Дата получения",
      sourcePeriod: "Период источника",
      rawValue: "Исходное значение",
      unit: "Единица измерения",
      transform: "Сценарий обработки",
      checksum: "Контрольная сумма SHA-256",
      trace: "Идентификатор трассировки",
      reset: "Сбросить",
      all: "Все",
      search: "Поиск",
      region: "Регион",
      topN: "Строки",
      mapScaleLow: "Ниже",
      mapScaleHigh: "Выше",
      mapLayer: "Слой карты",
      scenario: "Сценарий",
      scenarioLow: "Нижний",
      scenarioBase: "Базовый",
      scenarioHigh: "Верхний",
      reliability: "Надёжность",
      uncertainty: "Неопределённость",
      dataCoverage: "Покрытие данных",
      verifiedRussia: "Проверенный источник UIS по въезду в Россию активен",
      observedOnly: "На этой странице используются только наблюдаемые численности UIS; модельные оценки не входят в рейтинг.",
      latestPositive: "Последний содержательный год",
      sourceMax: "Максимальный год в источнике",
      coverage: "Покрытие",
      overviewHeading: "Концептуальная модель и карта решений",
      overviewNote: "Единый контур связывает наблюдаемый контингент UIS, молодёжные рынки, гравитационную модель, восприимчивость к России, компетенции и управленческие решения.",
      demographyTitle: "Молодёжные образовательные рынки мира до 2050 года",
      demographyNotice: "Официальные демографические проекции ООН: масштаб, динамика и возрастная структура потенциальных образовательных рынков.",
      modelTitle: "Гравитационная модель международной образовательной миграции",
      modelNotice: "Структурная модель объясняет распределение наблюдаемого контингента UIS и отделена от прогнозного инерционно-демографического ориентира.",
      friendlinessTitle: "Дружелюбность и образовательная восприимчивость к России",
      friendlinessNotice: "Компоненты, интервалы неопределённости и покрытие показаны раздельно; ненадёжный точечный ранг скрывается.",
      forecastTitle: "Прогноз потенциальной образовательной миграции до 2050 года",
      forecastTop: "Сценарный порядок стран к выбранному году",
      forecastNotice: "Показана структурная ёмкость распределения и отдельный инерционно-демографический ориентир; это не точечный прогноз набора.",
      gapTitle: "Рейтинг структурной недопредставленности",
      gapNotice: "В фактический рейтинг входят только страны с проверенными фактическими строками UIS и расчетным потенциалом.",
      matrixTitle: "Матрица страна-программа-язык-инструмент",
      matrixNotice: "Текущий языковой разрез является агрегированным; интерфейс не создает ложной детализации.",
      reportTitle: "Ректорский отчёт и аудиторские выгрузки",
      laborTitle: "Трудовая миграция: потребность по регионам и отраслям России",
      laborNotice: "Это отдельный контекст спроса на компетенции в России, не фактическая образовательная миграция.",
      vacanciesTitle: "Работа в России: вакансии, компетенции и спрос на программы",
      vacanciesNotice: "Официальные записи API обезличены; поисковые итоги пересекаются и не являются числом уникальных вакансий.",
      laborDemandSignal: "Сигнал спроса на программу",
      combinedPriority: "Совместный приоритет страна–программа",
      noData: "Нет проверенной строки для выбранных фильтров.",
      aggregateLanguage: "Все языки: проверенного языкового разреза нет",
      methodology: "Методология",
      limitations: "Ограничения",
      modelDiagnostics: "Диагностика модели",
      countryDetail: "Выбранная страна",
      matrixPreview: "Матрица программ",
      vacancyCompetency: "Вакансии и компетенции",
      laborRegionYear: "Регион-год",
      laborSectorYear: "Сектор-год",
      executiveFindings: "Управленческие выводы",
      reportBuilder: "Конструктор отчета",
      auditCenter: "Центр аудита источников",
      mobileNote: "Все таблицы прокручиваются внутри панели; карта и паспорта остаются доступными на мобильном экране.",
    },
    en: {
      title: "MGIMO international education migration and decision platform",
      subtitle: "Observed UIS rows, PPML modelled potential, fact-potential gap, program matrix and every source passport are kept separate.",
      navBranches: "Branches",
      navStudents: "Students",
      navOverview: "Overview",
      navMigration: "Flows",
      navDemography: "Markets 2050",
      navModel: "Model",
      navFriendliness: "Receptivity",
      navForecast: "Forecast",
      navGap: "Potential",
      navMatrix: "Matrix",
      navReport: "Report",
      navLabor: "Labor migration",
      navVacancies: "Vacancies & skills",
      loading: "Loading verified data...",
      sourcePassports: "Source passports",
      close: "Close",
      downloads: "Downloads",
      observed: "Observed stock",
      modelled: "Modelled potential",
      fact: "UIS fact",
      potential: "Structural capacity",
      gap: "Gap",
      country: "Country",
      year: "Year",
      students: "Students",
      rank: "Rank",
      status: "Status",
      source: "Source",
      passport: "Passport",
      sourceKey: "source_key",
      retrieved: "Retrieved at",
      sourcePeriod: "Source period",
      rawValue: "Raw value",
      unit: "Unit",
      transform: "Transform script",
      checksum: "Checksum / SHA-256",
      trace: "Trace ID",
      reset: "Reset",
      all: "All",
      search: "Search",
      region: "Region",
      topN: "Rows",
      mapScaleLow: "Lower",
      mapScaleHigh: "Higher",
      mapLayer: "Map layer",
      scenario: "Scenario",
      scenarioLow: "Low",
      scenarioBase: "Base",
      scenarioHigh: "High",
      reliability: "Reliability",
      uncertainty: "Uncertainty",
      dataCoverage: "Data coverage",
      verifiedRussia: "Verified UIS Russia inbound source is active",
      observedOnly: "This page uses observed UIS counts only; model estimates are excluded from the ranking.",
      latestPositive: "Latest meaningful year",
      sourceMax: "Source max year",
      coverage: "Coverage",
      overviewHeading: "Conceptual model and decision map",
      overviewNote: "One evidence chain connects observed UIS student stock, youth markets, the gravity model, receptivity to Russia, competencies and management decisions.",
      demographyTitle: "Global youth education markets to 2050",
      demographyNotice: "Official UN demographic projections show the scale, trajectory and age structure of potential education markets.",
      modelTitle: "Gravity model of international education migration",
      modelNotice: "The structural model explains the allocation of observed UIS student stock and remains separate from the demographic-continuity forecast benchmark.",
      friendlinessTitle: "Friendliness and educational receptivity to Russia",
      friendlinessNotice: "Components, uncertainty bounds and coverage are shown separately; unreliable point ranks stay hidden.",
      forecastTitle: "Potential education migration forecast to 2050",
      forecastTop: "Scenario order by selected year",
      forecastNotice: "The view separates structural allocation capacity from a demographic-continuity benchmark; neither is a point enrolment forecast.",
      gapTitle: "Structural under-representation ranking",
      gapNotice: "The factual ranking includes only countries with verified UIS actual rows and calculated potential.",
      matrixTitle: "Country-program-language-instrument matrix",
      matrixNotice: "The current language level is aggregate; the UI does not invent a split.",
      reportTitle: "Executive report and audit downloads",
      laborTitle: "Labor migration: Russia regional and sector demand",
      laborNotice: "This is a separate Russia-side competency-demand layer, not observed education migration.",
      vacanciesTitle: "Jobs in Russia: vacancies, skills and program demand",
      vacanciesNotice: "Official API records are sanitized; keyword totals overlap and are not unique vacancy counts.",
      laborDemandSignal: "Program demand signal",
      combinedPriority: "Combined country–program priority",
      noData: "No verified row for current filters.",
      aggregateLanguage: "aggregate_all_languages: no verified language split",
      methodology: "Methodology",
      limitations: "Limitations",
      modelDiagnostics: "Model diagnostics",
      countryDetail: "Selected country",
      matrixPreview: "Program matrix",
      vacancyCompetency: "Vacancies and competencies",
      laborRegionYear: "Region-year",
      laborSectorYear: "Sector-year",
      executiveFindings: "Executive findings",
      reportBuilder: "Report builder",
      auditCenter: "Source audit center",
      mobileNote: "Tables scroll inside panels; maps and passports remain reachable on mobile.",
    },
  };

  const PAGE = {
    platform2: { key: "navOverview", title: "overviewHeading", subtitle: "overviewNote" },
    migration: { key: "navMigration", title: "navMigration", subtitle: "observedOnly" },
    demography: { key: "navDemography", title: "demographyTitle", subtitle: "demographyNotice" },
    model: { key: "navModel", title: "modelTitle", subtitle: "modelNotice" },
    friendliness: { key: "navFriendliness", title: "friendlinessTitle", subtitle: "friendlinessNotice" },
    vacancies: { key: "navVacancies", title: "vacanciesTitle", subtitle: "vacanciesNotice" },
    forecast: { key: "navForecast", title: "forecastTitle", subtitle: "forecastNotice" },
    gap: { key: "navGap", title: "gapTitle", subtitle: "gapNotice" },
    matrix: { key: "navMatrix", title: "matrixTitle", subtitle: "matrixNotice" },
    report: { key: "navReport", title: "reportTitle", subtitle: "subtitle" },
    labor: { key: "navLabor", title: "laborTitle", subtitle: "laborNotice" },
  };

  const NAV = [
    ["platform2.html", "navOverview", "platform2"],
    ["migration.html", "navMigration", "migration"],
    ["demography.html", "navDemography", "demography"],
    ["model.html", "navModel", "model"],
    ["friendliness.html", "navFriendliness", "friendliness"],
    ["vacancies.html", "navVacancies", "vacancies"],
    ["forecast.html", "navForecast", "forecast"],
    ["gap.html", "navGap", "gap"],
    ["matrix.html", "navMatrix", "matrix"],
    ["report.html", "navReport", "report"],
    ["index.html", "navBranches", "branches"],
    ["students.html", "navStudents", "students"],
    ["labor.html", "navLabor", "labor"],
  ];

  function storedInterfaceLanguage() {
    return sessionStorage.getItem("mgimo_platform2_lang")
      || sessionStorage.getItem("mgimo_lang")
      || localStorage.getItem("mgimo_platform2_lang")
      || localStorage.getItem("mgimo_lang");
  }

  const state = {
    lang: ["ru", "en"].includes(storedInterfaceLanguage())
      ? storedInterfaceLanguage()
      : "ru",
    payload: null,
    countries: null,
    geo: null,
    laborGeo: null,
    csv: new Map(),
    maps: new Map(),
    selectedIso: "KAZ",
    selectedYear: 2050,
    migrationYear: 2023,
  };

  const $ = (sel) => document.querySelector(sel);
  const missingLabel = () => (state.lang === "ru" ? "нет данных" : "missing");
  const fmt0 = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed)
      ? new Intl.NumberFormat(state.lang === "ru" ? "ru-RU" : "en-US", { maximumFractionDigits: 0 }).format(parsed)
      : missingLabel();
  };
  const fmt1 = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed)
      ? new Intl.NumberFormat(state.lang === "ru" ? "ru-RU" : "en-US", { maximumFractionDigits: 1 }).format(parsed)
      : missingLabel();
  };
  const t = (key) => TXT[state.lang][key] || TXT.ru[key] || key;
  const num = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const hasCyrillic = (value) => /[А-Яа-яЁё]/.test(String(value ?? ""));

  function displayLabel(row, labelKey) {
    const value = row?.[labelKey];
    if (state.lang !== "en" || !hasCyrillic(value)) return value;
    return row.query_group || row.program_group_en || row.program_group || row.activity_id || row.okved_section || row.trace_id || "verified row";
  }

  function stablePublicCode(value) {
    const input = String(value || "missing");
    let hash = 2166136261;
    for (let index = 0; index < input.length; index += 1) {
      hash ^= input.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `rec-${(hash >>> 0).toString(16).padStart(8, "0")}`;
  }

  function publicVacancyCode(row) {
    return row?.release_record_id || stablePublicCode(row?.source_row_sha256 || row?.vacancy_id || row?.trace_id);
  }

  function safeVacancyField(row, field) {
    if (state.lang === "ru") return row?.[field] || missingLabel();
    if (field === "job_name") return `${programLabel(row)} record`;
    if (field === "region_name") return row?.region_code ? `Region code ${row.region_code}` : "Russian region";
    if (field === "professional_sphere") return programLabel(row);
    if (field === "education") return row?.education ? "Education level recorded" : missingLabel();
    return displayLabel(row, field) || missingLabel();
  }

  function safeEvidenceMatch(row) {
    const value = row?.matched_pattern || row?.skill_original || "";
    if (state.lang !== "en" || !hasCyrillic(value)) return value || missingLabel();
    return `${programLabel(row)} taxonomy rule matched`;
  }

  function russiaCoverageNote(payload) {
    const note = payload?.russiaInbound?.coverageNote || "";
    if (state.lang === "ru" && /2024 Russia slice is retained for audit/i.test(note)) {
      return "Срез России за 2024 год сохранён для аудита, но исключён из рейтинга, потому что сумма равна нулю.";
    }
    return note;
  }

  function flagEmoji(iso3) {
    const iso2 = countryByIso().get(iso3)?.iso2;
    if (!iso2 || iso2.length !== 2) return "";
    const code = iso2.toLowerCase();
    const native = [...iso2.toUpperCase()].map((c) => String.fromCodePoint(127397 + c.charCodeAt(0))).join("");
    return `<span class="p2-country-flag country-flag" aria-hidden="true" data-country-flag-state="svg" data-country-iso3="${iso3 || ""}"><span class="p2-country-native">${native}</span><img class="country-flag-image flag-image" src="assets/vendor/flags/4x3/${code}.svg" alt="" loading="lazy"></span>`;
  }

  function countryByIso() {
    if (!state.countries) return new Map();
    if (!state.countryMap) {
      state.countryMap = new Map((state.countries.countries || []).map((c) => [c.iso3, c]));
    }
    return state.countryMap;
  }

  function geoNamesByIso() {
    if (!state.geoNameMap) {
      state.geoNameMap = new Map((state.geo?.features || []).map((feature) => {
        const properties = feature.properties || {};
        return [geoIso(feature), { ru: properties.name_ru || properties.name || geoIso(feature), en: properties.name_en || properties.name || geoIso(feature) }];
      }));
    }
    return state.geoNameMap;
  }

  function localizedCountry(iso3, defaultName = "") {
    const geo = geoNamesByIso().get(iso3);
    if (geo) return geo[state.lang] || geo.en || defaultName || iso3;
    const country = countryByIso().get(iso3);
    if (state.lang === "ru") return country?.nameRu || country?.country_ru || defaultName || country?.name || iso3;
    return country?.nameEn || country?.country_en || country?.name || defaultName || iso3;
  }

  function pct(value, digits = 1) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? `${fmt1(parsed)}%` : missingLabel();
  }

  function reliabilityLabel(value) {
    const labels = {
      ru: { high: "высокая", moderate: "средняя", low: "низкая", limited: "ограниченная" },
      en: { high: "high", moderate: "moderate", low: "low", limited: "limited" },
    };
    return labels[state.lang]?.[String(value || "").toLowerCase()] || value || missingLabel();
  }

  function observationStatusLabel(value) {
    const key = String(value || "").trim();
    const labels = {
      observed_official: { ru: "официальное наблюдение", en: "official observation" },
      official_or_reference: { ru: "официальные / справочные данные", en: "official / reference data" },
      official_projection: { ru: "официальная проекция", en: "official projection" },
      calculated: { ru: "расчётный показатель", en: "calculated indicator" },
      calculated_structural_gap: { ru: "расчётный структурный разрыв", en: "calculated structural gap" },
      actual_2023_plus_structural_and_continuity_models: { ru: "факт 2023 года + структурная модель и инерционный ориентир", en: "2023 actual + structural and continuity models" },
      calculated_uncertainty_aware_scenario_ensemble_v5: { ru: "расчётный сценарный ансамбль с учётом неопределённости", en: "uncertainty-aware scenario ensemble" },
      model_estimate: { ru: "модельная оценка", en: "model estimate" },
      modelled: { ru: "модельная оценка", en: "model estimate" },
      observed: { ru: "наблюдение", en: "observed" },
      estimated: { ru: "оценка", en: "estimate" },
      projection: { ru: "проекция", en: "projection" },
    };
    return labels[key]?.[state.lang] || key.replaceAll("_", " ") || missingLabel();
  }

  function unitLabel(value) {
    const key = String(value || "").trim();
    const labels = {
      students: { ru: "человек", en: "students" },
      students_capacity_equivalent: { ru: "эквивалент структурной ёмкости, человек", en: "structural-capacity equivalent, students" },
      persons: { ru: "человек", en: "people" },
      percent: { ru: "%", en: "%" },
      ratio: { ru: "доля", en: "ratio" },
    };
    return labels[key]?.[state.lang] || key || missingLabel();
  }

  function publicSourceTitle(value) {
    const raw = String(value || "").trim();
    if (!raw) return missingLabel();
    const idLabels = {
      ppml_russia_inbound_uis_opri_wpp_distance_v1: { ru: "PPML: контингент UIS, WPP и расстояния", en: "PPML: UIS stock, WPP and distance inputs" },
      ppml_russia_inbound_structural_allocation_v3: { ru: "PPML: структурное распределение контингента", en: "PPML structural stock allocation" },
      friendliness_receptivity_ex_ante_v4: { ru: "Индекс восприимчивости к России без утечки исхода", en: "Outcome-safe receptivity to Russia index" },
      friendliness_component_sources: { ru: "Компоненты индекса восприимчивости", en: "Receptivity index component sources" },
      mgimo_partner_universities: { ru: "Партнёрские университеты МГИМО", en: "MGIMO partner universities" },
      natural_earth_admin0_label_points: { ru: "Natural Earth: географические точки стран", en: "Natural Earth country label points" },
      trudvsem_open_data_api: { ru: "Официальный API «Работа в России»", en: "Jobs in Russia official API" },
      un_digital_library_voting_2026_02_06: { ru: "Цифровая библиотека ООН: голосования", en: "UN Digital Library voting records" },
      un_wpp2024_population_by_single_age_sex: { ru: "ООН WPP 2024: население по полу и возрасту", en: "UN WPP 2024 population by age and sex" },
      un_wpp2024_targeted_increment: { ru: "ООН WPP 2024: целевой демографический прирост", en: "UN WPP 2024 targeted demographic increment" },
      unesco_uis_opri_202602: { ru: "UNESCO UIS OPRI: контингент международно мобильных студентов", en: "UNESCO UIS OPRI internationally mobile student stock" },
      unesco_uis_outbound_mobility_ratio: { ru: "UNESCO UIS: доля исходящей образовательной мобильности", en: "UNESCO UIS outbound mobility ratio" },
      verified_feature_panel_incremental_base: { ru: "Проверенная панель признаков модели", en: "Verified model feature panel" },
      "2010-2025 observed panel; 2026-2050 scenarios": { ru: "Наблюдаемая панель 2010-2025; сценарии 2026-2050", en: "2010-2025 observed panel; 2026-2050 scenarios" },
    };
    if (idLabels[raw]) return idLabels[raw][state.lang];
    if (/^world_bank_/i.test(raw)) {
      const code = raw.replace(/^world_bank_/i, "").replaceAll("_", ".");
      return state.lang === "ru" ? `Всемирный банк: ${code}` : `World Bank: ${code}`;
    }
    if (/^[a-z0-9]+(?:_[a-z0-9.-]+)+$/i.test(raw)) {
      return raw.replaceAll("_", " ");
    }
    if (state.lang === "en") return raw;
    const exact = {
      "Structural under-representation gap relative to demographic continuity": "Структурная недопредставленность относительно инерционно-демографического ориентира",
      "Structural PPML allocation model with demographic continuity benchmark": "Структурная PPML-модель распределения с инерционно-демографическим ориентиром",
      "UNESCO UIS OPRI February 2026 bulk archive": "UNESCO UIS OPRI — массовая выгрузка, февраль 2026 года",
      "UN World Population Prospects 2024": "ООН: Мировые демографические перспективы 2024",
      "Pew Global Attitudes 2023": "Pew Global Attitudes 2023 — отношение к России",
      "Jobs in Russia official open data API": "Официальный API «Работа в России»",
    };
    if (exact[raw]) return exact[raw];
    if (/structural under-representation gap/i.test(raw)) return "Структурная недопредставленность относительно инерционно-демографического ориентира";
    if (/structural ppml allocation model/i.test(raw)) return "Структурная PPML-модель распределения с инерционно-демографическим ориентиром";
    if (/UNESCO UIS OPRI/i.test(raw)) return "UNESCO UIS OPRI — контингент международно мобильных студентов";
    if (/World Population Prospects 2024/i.test(raw)) return "ООН: Мировые демографические перспективы 2024";
    return raw;
  }

  function mobilityMeasureLabel(value) {
    const key = String(value || "").trim();
    const labels = {
      enrolled_stock: { ru: "контингент зачисленных международно мобильных студентов", en: "enrolled internationally mobile student stock" },
      stock: { ru: "контингент студентов", en: "student stock" },
      flow: { ru: "поток студентов", en: "student flow" },
    };
    return labels[key]?.[state.lang] || key.replaceAll("_", " ") || missingLabel();
  }

  function mobilityIndicatorLabel(value) {
    if (!value) return missingLabel();
    return state.lang === "ru"
      ? "Контингент международно мобильных студентов по стране происхождения"
      : String(value);
  }

  function componentLabel(value) {
    const labels = {
      F_SURVEY_RUSSIA_ATTITUDE: { ru: "отношение к России по международным опросам", en: "survey attitudes to Russia" },
      F_DIPLOMATIC_ALIGNMENT: { ru: "дипломатическая согласованность", en: "diplomatic alignment" },
      F_INSTITUTIONAL_TIES: { ru: "институциональные связи", en: "institutional ties" },
      F_RUSSIAN_LANGUAGE_ENVIRONMENT: { ru: "русскоязычная среда", en: "Russian-language environment" },
      F_POLICY_ACCESS: { ru: "правовой и институциональный доступ", en: "policy and institutional access" },
    };
    const parts = String(value || "").split(/[;|,]/).map((part) => part.trim()).filter(Boolean);
    return parts.length ? parts.map((part) => labels[part]?.[state.lang] || part).join("; ") : missingLabel();
  }

  function coefficientLabel(value) {
    const labels = {
      const: { ru: "Константа", en: "Constant" },
      ln_student_pool: { ru: "Молодёжный образовательный рынок, логарифм", en: "Youth education market, log" },
      ln_distance: { ru: "Расстояние до Москвы, логарифм", en: "Distance to Moscow, log" },
      ln_outbound: { ru: "Выездная образовательная мобильность, логарифм", en: "Outbound student mobility, log" },
      ln_outbound_missing: { ru: "Нет данных о выездной мобильности", en: "Outbound mobility missing" },
      tertiary_share: { ru: "Охват высшим образованием", en: "Tertiary enrolment share" },
      tertiary_share_missing: { ru: "Нет данных об охвате высшим образованием", en: "Tertiary share missing" },
      unga_alignment: { ru: "Согласованность голосований в ГА ООН", en: "UNGA voting alignment" },
      unga_alignment_missing: { ru: "Нет данных о согласованности голосований", en: "UNGA alignment missing" },
    };
    return labels[value]?.[state.lang] || String(value || "").replaceAll("_", " ");
  }

  function specificationLabel(value) {
    const labels = {
      core: { ru: "Базовая", en: "Core" },
      mobility: { ru: "С мобильностью", en: "Mobility" },
      theory_ex_ante: { ru: "Теоретическая ex ante", en: "Theory ex ante" },
    };
    return labels[value]?.[state.lang] || String(value || "").replaceAll("_", " ");
  }

  function publicDownloadLabel(item) {
    const href = String(item?.href || "");
    const map = [
      [/education_migration_od/, { ru: "Панель международной мобильности UNESCO UIS", en: "UNESCO UIS mobility panel" }],
      [/russia_inbound_students/, { ru: "Контингент в России по странам происхождения", en: "Russia student stock by origin" }],
      [/country_year_features/, { ru: "Страновые признаки по годам", en: "Country-year features" }],
      [/potential_forecast/, { ru: "Сценарии потенциала до 2050 года", en: "Potential scenarios to 2050" }],
      [/capacity_scenario_totals/, { ru: "Совокупная ёмкость сценариев", en: "Scenario capacity totals" }],
      [/unrealized_potential_gap/, { ru: "Факт и нереализованный потенциал", en: "Actual and unrealized potential" }],
      [/friendliness_index/, { ru: "Индекс восприимчивости", en: "Receptivity index" }],
      [/trudvsem_program_demand/, { ru: "Спрос на программы по вакансиям", en: "Record-level program demand" }],
      [/country_program_priority/, { ru: "Матрица страна–программа", en: "Country-program matrix" }],
      [/mgimo_global_education_migration_report/, { ru: "Аналитический доклад", en: "Analytical report" }],
    ];
    const match = map.find(([pattern]) => pattern.test(href));
    if (match) return match[1][state.lang];
    return state.lang === "ru" ? (item?.label_ru || item?.label || href) : (item?.label_en || item?.label || href);
  }

  function modelEstimatorLabel(value) {
    if (!value) return missingLabel();
    if (state.lang === "en") return value;
    return "Пуассоновская псевдомаксимизация правдоподобия (PPML) с кластерной ковариацией по странам происхождения";
  }

  function modelStatusLabel(value) {
    const labels = {
      validated_structural_model_not_short_term_point_forecast: { ru: "проверена для структурного объяснения; не является точечным краткосрочным прогнозом", en: "validated for structural explanation; not a short-term point forecast" },
      validated_for_ranking: { ru: "проверена для ранжирования", en: "validated for ranking" },
      experimental: { ru: "экспериментальная", en: "experimental" },
      blocked: { ru: "заблокирована", en: "blocked" },
    };
    return labels[value]?.[state.lang] || String(value || "").replaceAll("_", " ") || missingLabel();
  }

  function programLabel(row) {
    if (state.lang === "ru") return row.program_label_ru || row.program_group || row.keyword_group || missingLabel();
    const labels = {
      digital_analytics: "Digital analytics and Data/AI",
      international_economics: "International economics and trade",
      management_public: "Management and public policy",
      languages_regional: "Languages and area studies",
      legal_public: "International law and compliance",
    };
    return labels[row.program_group || row.keyword_group] || row.program_group || row.keyword_group || missingLabel();
  }

  function decisionTierLabel(value) {
    const labels = {
      B_targeted_validation: { ru: "B · целевая проверка", en: "B · targeted validation" },
      C_monitor_and_experiment: { ru: "C · мониторинг и эксперимент", en: "C · monitor and experiment" },
      C_monitor_and_test: { ru: "C · мониторинг и проверка", en: "C · monitor and test" },
      D_insufficient_evidence: { ru: "D · недостаточно данных", en: "D · insufficient evidence" },
      D_insufficient_or_unstable_evidence: { ru: "D · недостаточные или неустойчивые данные", en: "D · insufficient or unstable evidence" },
      A_evidence_supported_pilot: { ru: "A · доказательный пилот", en: "A · evidence-supported pilot" },
    };
    return labels[value]?.[state.lang] || value || missingLabel();
  }

  function recruitmentInstrumentLabel(value) {
    const labels = {
      employer_linked_program_campaign_and_case_competitions: { ru: "Кампания с работодателями и кейс-чемпионаты", en: "Employer-linked campaign and case competitions" },
      russian_language_track_alumni_and_school_network: { ru: "Русскоязычный трек, выпускники и школьные сети", en: "Russian-language track, alumni and school networks" },
      bilingual_digital_campaign_and_online_preparatory_modules: { ru: "Двуязычная цифровая кампания и онлайн-подготовка", en: "Bilingual digital campaign and online preparation" },
      partner_university_pathway_and_joint_certificate: { ru: "Партнёрская траектория и совместный сертификат", en: "Partner-university pathway and joint certificate" },
      scholarship_targeting_and_embassy_outreach: { ru: "Адресные стипендии и работа через представительства", en: "Targeted scholarships and embassy outreach" },
      targeted_digital_campaign_with_local_partner_validation: { ru: "Целевая цифровая кампания с проверкой через местного партнёра", en: "Targeted digital campaign with local-partner validation" },
      digital_recruitment_scholarship_and_olympiad: { ru: "Цифровое привлечение, стипендия и олимпиада", en: "Digital recruitment, scholarship and olympiad" },
    };
    return labels[value]?.[state.lang] || String(value || missingLabel()).replaceAll("_", " ");
  }

  function languageLabel(value) {
    const labels = {
      aggregate_all_languages: { ru: "Все языки: детализация источником не подтверждена", en: "All languages: no verified source split" },
      russian_or_bilingual_russian_english: { ru: "Русский или двуязычный русско-английский формат", en: "Russian or bilingual Russian-English" },
      english_or_bilingual: { ru: "Английский или двуязычный формат", en: "English or bilingual" },
      english_plus_russian_preparatory_year: { ru: "Английский язык с подготовительным годом русского языка", en: "English plus a Russian preparatory year" },
      english_with_optional_russian_preparatory_module: { ru: "Английский язык с факультативным модулем русского языка", en: "English with an optional Russian preparatory module" },
      english_plus_russian_preparatory_year_plus_target_region_language: { ru: "Английский язык, подготовительный год русского и язык целевого региона", en: "English, a Russian preparatory year and the target-region language" },
      english_with_optional_russian_preparatory_module_plus_target_region_language: { ru: "Английский язык, факультативный русский и язык целевого региона", en: "English, optional Russian and the target-region language" },
      russian_or_bilingual_russian_english_plus_target_region_language: { ru: "Русский или русско-английский формат с языком целевого региона", en: "Russian or Russian-English bilingual plus the target-region language" },
    };
    return labels[value]?.[state.lang] || String(value || missingLabel()).replaceAll("_", " ");
  }

  async function getJson(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
    return response.json();
  }

  async function getText(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
    return response.text();
  }

  function parseCsv(text) {
    const rows = [];
    let field = "";
    let row = [];
    let quoted = false;
    for (let i = 0; i < text.length; i += 1) {
      const ch = text[i];
      if (quoted) {
        if (ch === '"' && text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else if (ch === '"') {
          quoted = false;
        } else {
          field += ch;
        }
      } else if (ch === '"') {
        quoted = true;
      } else if (ch === ",") {
        row.push(field);
        field = "";
      } else if (ch === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else if (ch !== "\r") {
        field += ch;
      }
    }
    if (field.length || row.length) {
      row.push(field);
      rows.push(row);
    }
    const header = rows.shift() || [];
    return rows.filter((r) => r.length && r.some((v) => v !== "")).map((r) => Object.fromEntries(header.map((h, idx) => [h.replace(/^\uFEFF/, ""), r[idx] ?? ""])));
  }

  async function loadCsv(name, url = DATA_URLS[name]) {
    if (!state.csv.has(name)) {
      state.csv.set(name, getText(url).then(parseCsv));
    }
    return state.csv.get(name);
  }

  async function loadCommon({ needGeo = true } = {}) {
    if (!state.payload) state.payload = await getJson(DATA_URLS.payload);
    if (!state.countries) state.countries = await getJson(DATA_URLS.countries);
    if (needGeo && !state.geo) state.geo = await getJson(DATA_URLS.geo);
    return state.payload;
  }

  function renderHeader() {
    const page = PAGE[VIEW] || PAGE.platform2;
    if (window.MGIMO_SHELL?.render) {
      window.MGIMO_SHELL.render({
        selector: "#platform2Header",
        pageId: VIEW,
        lang: state.lang,
        pageTitle: t(page.title),
        pageSubtitle: t(page.subtitle),
      });
    }
    document.documentElement.lang = state.lang;
  }

  function setLang(lang) {
    if (state.lang === lang) {
      document.documentElement.lang = lang;
      return;
    }
    state.lang = lang;
    sessionStorage.setItem("mgimo_platform2_lang", lang);
    sessionStorage.setItem("mgimo_lang", lang);
    localStorage.setItem("mgimo_platform2_lang", lang);
    localStorage.setItem("mgimo_lang", lang);
    document.documentElement.lang = lang;
    closeDrawer();
    clearMaps();
    renderHeader();
    route();
  }

  window.addEventListener("mgimo:language-change", (event) => {
    const lang = event.detail?.lang;
    if (["ru", "en"].includes(lang)) setLang(lang);
  });

  function sourceButton(label = t("sourcePassports")) {
    return `<button class="primary-action" type="button" data-open-sources>${esc(label)}</button>`;
  }

  function auditMiniStrip(payload) {
    const chips = (payload.sourceRegistry?.sources || []).slice(0, 18);
    return `<div class="audit-mini-strip">${chips.map((source) => {
      const label = source.source_id || source.source_key || "source";
      const value = source.row_count || source.validation_status || source.observation_status || "ok";
      const rendered = Number.isFinite(Number(value)) ? fmt0(value) : value;
      return `<button class="micro-chip" type="button" data-open-sources><span>${esc(label)}</span><strong>${esc(rendered)}</strong></button>`;
    }).join("")}</div>`;
  }

  function legacyInboundLabel() {
    return state.lang === "ru" ? "Проверенный источник по въезду в Россию активен: UIS" : "Verified Russia inbound source active: UIS";
  }

  function observedOnlyLabel() {
    return state.lang === "ru" ? "Только наблюдаемые численности UIS" : "Observed UIS counts";
  }

  function kpi(label, value, note, passport) {
    return `<article class="kpi" ${passport ? `data-passport='${esc(JSON.stringify(passport))}' role="button" tabindex="0"` : ""}>
      <span>${esc(label)}</span>
      <strong>${esc(value)}</strong>
      <small>${esc(note || "")}</small>
    </article>`;
  }

  function table(rows, columns, opts = {}) {
    const label = opts.label || (state.lang === "ru" ? "Таблица данных" : "Data table");
    return `<div class="table-wrap" role="region" tabindex="0" aria-label="${esc(label)}"><table ${opts.id ? `id="${opts.id}"` : ""}><thead><tr>${columns.map((c) => `<th scope="col" class="${c.num ? "num" : ""}">${esc(c.label)}</th>`).join("")}</tr></thead><tbody>${rows.map((row, idx) => `<tr data-row-index="${idx}" ${opts.rowKey ? `data-row-key="${esc(row[opts.rowKey])}"` : ""}>${columns.map((c) => `<td class="${c.num ? "num" : ""}">${c.html ? c.render(row, idx) : esc(c.render ? c.render(row, idx) : row[c.key])}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }

  function bars(rows, labelKey, valueKey, limit = 12) {
    const visible = rows.slice(0, limit);
    const max = Math.max(1, ...visible.map((r) => num(r[valueKey])));
    return `<div class="bar-list">${visible.map((r) => `<div class="bar-row">
      <strong>${esc(displayLabel(r, labelKey))}</strong>
      <div class="bar-track"><div class="bar" style="width:${Math.max(1, num(r[valueKey]) / max * 100)}%"></div></div>
      <span class="num">${fmt0(r[valueKey])}</span>
    </div>`).join("")}</div>`;
  }

  function downloadLinks(items) {
    return `<div class="download-row">${(items || []).map((d) => {
      const label = publicDownloadLabel(d);
      return `<a href="${esc(d.href)}" download>${esc(label)}</a>`;
    }).join("")}</div>`;
  }

  function statusBand(title, note, actions = sourceButton()) {
    return `<section class="status-band"><div><strong>${esc(title)}</strong><p>${esc(note)}</p></div><div class="toolbar-row">${actions}</div></section>`;
  }

  function pageHero({ kicker, title, note, evidenceTitle, evidenceValue, evidenceNote, actions = sourceButton() }) {
    return `<section class="page-hero">
      <div class="page-hero-copy">
        <p class="page-hero-kicker">${esc(kicker || "")}</p>
        <h2>${esc(title)}</h2>
        <p>${esc(note || "")}</p>
        <div class="hero-actions">${actions}</div>
      </div>
      <aside class="hero-evidence-card" aria-label="${esc(evidenceTitle || t("sourcePassports"))}">
        <span>${esc(evidenceTitle || t("sourcePassports"))}</span>
        <strong>${esc(evidenceValue || "")}</strong>
        <small>${esc(evidenceNote || "")}</small>
      </aside>
    </section>`;
  }

  function scaleLegend() {
    return `<div class="scale-legend"><span>${esc(t("mapScaleLow"))}</span><i></i><i></i><i></i><i></i><i></i><span>${esc(t("mapScaleHigh"))}</span></div>`;
  }

  function evidenceRibbon(payload) {
    const baseItems = [
      ["UIS", payload.odCoverage?.russia_rows],
      ["WPP", payload.youthMarketForecast?.top2050StudentPool?.length || payload.gravityModel?.n_origins],
      ["PPML", payload.gravityModel?.n_observations],
      ["Gap", payload.factPotentialGap?.top?.length],
      ["Matrix", payload.countryProgramMatrix?.rows?.length],
      [state.lang === "ru" ? "Сигналы вакансий" : "Vacancy signals", payload.vacancyCompetency?.rows?.length],
      ["Sources", payload.sourceRegistry?.sources?.length],
      ["Labor", payload.laborMigration?.counts?.forecast_rows],
    ];
    const sourceItems = (payload.sourceRegistry?.sources || [])
      .slice(0, 14)
      .map((source) => [source.source_id || source.source_key, source.row_count || source.validation_status || "ok"]);
    const items = baseItems.concat(sourceItems);
    return `<section class="panel evidence-ribbon" data-chart>${items.map(([label, value]) => {
      const rendered = Number.isFinite(Number(value)) ? fmt0(value) : esc(value || "ok");
      return `<span class="tag"><strong>${esc(label)}</strong>&nbsp;${rendered}</span>`;
    }).join("")}</section>`;
  }

  let lastDrawerFocus = null;

  function drawerKeydown(event) {
    if (event.key === "Escape") closeDrawer();
  }

  function renderDrawerContent(items, title = t("sourcePassports")) {
    const drawer = $("#sourceDrawer");
    lastDrawerFocus = document.activeElement;
    drawer.innerHTML = `<button id="closeDrawer" class="drawer-close text-button" type="button">${esc(t("close"))}</button><h2>${esc(title)}</h2>${items.join("")}`;
    $("#closeDrawer").addEventListener("click", closeDrawer);
    drawer.setAttribute("role", "dialog");
    drawer.setAttribute("aria-modal", "false");
    drawer.setAttribute("aria-label", title);
    drawer.setAttribute("tabindex", "-1");
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    document.addEventListener("keydown", drawerKeydown);
    ($("#closeDrawer") || drawer).focus();
  }

  function closeDrawer() {
    const drawer = $("#sourceDrawer");
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    document.removeEventListener("keydown", drawerKeydown);
    if (lastDrawerFocus && typeof lastDrawerFocus.focus === "function") {
      lastDrawerFocus.focus();
    }
  }

  function sourceCard(source) {
    const id = source.source_id || source.source_key || source.model_id || "source";
    const url = source.url || source.source_url_or_file || "";
    const retrieved = source.retrieved_at_utc || source.retrieved_at || source.generated_at || "";
    const period = source.source_period || [source.year_min, source.year_max].filter(Boolean).join("-") || "";
    const checksum = source.sha256 || source.sha256_or_etag || "";
    const title = publicSourceTitle(source.source_title || id);
    const heading = title || publicSourceTitle(id);
    const showId = id && id !== heading;
    const fileLabel = state.lang === "ru" ? "Файл / ссылка" : "File / URL";
    const rowsLabel = state.lang === "ru" ? "Строк" : "Rows";
    return `<article class="source-card">
      <h3>${esc(heading)}</h3>
      ${showId ? `<p class="passport-source-title"><code>${esc(id)}</code></p>` : ""}
      <p><strong>${esc(t("retrieved"))}:</strong> ${esc(retrieved)}</p>
      <p><strong>${esc(t("sourcePeriod"))}:</strong> ${esc(period)}</p>
      <p><strong>${esc(t("status"))}:</strong> ${esc(source.validation_status || source.observation_status || source.status || "")}</p>
      <p><strong>${esc(fileLabel)}:</strong> <code>${esc(url)}</code></p>
      <p><strong>${esc(t("checksum"))}:</strong> <code>${esc(checksum)}</code></p>
      ${source.row_count ? `<p><strong>${esc(rowsLabel)}:</strong> ${fmt0(source.row_count)}</p>` : ""}
    </article>`;
  }

  function passportCard(row, title = t("passport")) {
    if (!row) return `<article class="passport-card">${esc(t("noData"))}</article>`;
    const sourceId = row.source_key || row.actual_source_key || row.model_id || "";
    const sourceTitle = row.source_title || row.source_indicator_label || row.actual_source_title || "";
    const sourceFile = row.source_url_or_file || row.actual_source_url_or_file || "";
    const period = row.source_period || row.actual_period || row.year || row.forecast_year || "";
    const status = observationStatusLabel(row.observation_status || row.actual_observation_status || row.coverage_status || "");
    const unit = unitLabel(row.unit || row.actual_unit || "");
    return `<article class="passport-card">
      <h3>${esc(title)}</h3>
      ${sourceTitle ? `<p class="passport-source-title">${esc(publicSourceTitle(sourceTitle))}</p>` : ""}
      <dl class="passport-summary">
        <div><dt>${esc(t("sourceKey"))}</dt><dd><code>${esc(sourceId)}</code></dd></div>
        <div><dt>${esc(t("sourcePeriod"))}</dt><dd>${esc(period)}</dd></div>
        <div><dt>${esc(t("status"))}</dt><dd>${esc(status)}</dd></div>
        <div><dt>${esc(t("unit"))}</dt><dd>${esc(unit)}</dd></div>
      </dl>
      <details class="technical-passport"><summary>${esc(state.lang === "ru" ? "Техническая трассировка" : "Technical trace")}</summary>
        <p><strong>${esc(state.lang === "ru" ? "Файл / URL" : "File / URL")}:</strong> <code>${esc(sourceFile)}</code></p>
        <p><strong>${esc(t("retrieved"))}:</strong> ${esc(row.retrieved_at || row.actual_retrieved_at || "")}</p>
        <p><strong>${esc(t("rawValue"))}:</strong> <code>${esc(row.raw_value || row.actual_raw_value || "")}</code></p>
        <p><strong>${esc(t("transform"))}:</strong> <code>${esc(row.transform_script || row.transformation_script || "")}</code></p>
        <p><strong>${esc(t("checksum"))}:</strong> <code>${esc(row.sha256_or_etag || row.actual_sha256_or_etag || "")}</code></p>
        <p><strong>${esc(t("trace"))}:</strong> <code>${esc(row.trace_id || row.actual_trace_id || row.source_trace_id || row.source_row_sha256 || "")}</code></p>
      </details>
    </article>`;
  }

  function routeSourceWeight(source) {
    const route = document.body?.dataset?.view || "";
    const routeKeywords = {
      migration: ["uis", "unesco", "inbound", "migration"],
      demography: ["wpp", "population", "demography"],
      model: ["ppml", "gravity", "model"],
      friendliness: ["friendliness", "wgi", "voting", "pew", "receptivity"],
      vacancies: ["trudvsem", "vacancy", "vacancies", "labor_demand"],
      forecast: ["forecast", "capacity", "ppml", "wpp"],
      gap: ["gap", "capacity", "ppml", "uis"],
      matrix: ["matrix", "priority", "program", "trudvsem"],
      report: ["report", "matrix", "gap", "forecast", "uis", "wpp", "ppml"],
    };
    const haystack = [
      source.source_id,
      source.source_key,
      source.source_title,
      source.model_id,
      source.transform_script,
      source.url,
      source.source_url_or_file,
    ].filter(Boolean).join(" ").toLowerCase();
    const keywords = routeKeywords[route] || [];
    return keywords.some((keyword) => haystack.includes(keyword)) ? 0 : 1;
  }

  function openSources() {
    const payload = state.payload || {};
    const sourceObjects = [
      ...(payload.sourceRegistry?.sources || []),
      ...(payload.laborMigration?.sourcePassports || []),
    ].slice().sort((a, b) => routeSourceWeight(a) - routeSourceWeight(b));
    const sources = sourceObjects.map(sourceCard);
    const failed = (payload.sourceRegistry?.failed_attempts || []).map((f) => sourceCard({
      source_id: f.source_id,
      url: f.url,
      retrieved_at_utc: f.retrieved_at_utc || f.date || "",
      validation_status: f.status || f.reason || "",
      sha256: "",
    }));
    renderDrawerContent([...sources, ...failed]);
  }

  function bindCommon() {
    document.querySelectorAll("[data-open-sources]").forEach((btn) => btn.addEventListener("click", openSources));
    document.querySelectorAll("[data-passport]").forEach((el) => {
      const openPassport = () => {
        try {
          const row = JSON.parse(el.getAttribute("data-passport"));
          renderDrawerContent([passportCard(row)], t("passport"));
        } catch {
          openSources();
        }
      };
      el.addEventListener("click", openPassport);
      el.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openPassport();
        }
      });
    });
  }

  function geoIso(feature) {
    const p = feature.properties || {};
    return p.iso_a3 || p.adm0_a3 || p.wb_a3 || p.adm0_iso || p.sov_a3 || p.gu_a3;
  }

  function color(value, max, palette = ["#edf2f7", "#cfe0f2", "#94badd", "#4f86bf", "#0b4f8a"]) {
    const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
    return palette[Math.min(palette.length - 1, Math.floor(ratio * palette.length))];
  }

  function coordsForIso(iso) {
    const c = countryByIso().get(iso);
    return c?.coordinates ? [c.coordinates.lat, c.coordinates.lon] : null;
  }

  function destroyMap(id) {
    const map = state.maps.get(id);
    if (map) {
      try {
        map.off();
        map.remove();
      } catch (error) {
        console.warn("Map cleanup failed", id, error);
      }
      state.maps.delete(id);
    }
  }

  function clearMaps() {
    for (const id of [...state.maps.keys()]) destroyMap(id);
  }

  function renderWorldMap(id, rows, { isoKey, valueKey, labelKey, selectedIso, onSelect, arcs = [], ariaLabel = "" }) {
    const container = document.getElementById(id);
    if (!container || !state.geo || !window.L) {
      if (container) container.innerHTML = `<div class="empty-state">${esc(t("noData"))}</div>`;
      return;
    }
    const panelTitle = container.closest(".panel")?.querySelector("h2")?.textContent?.trim();
    container.setAttribute("role", "region");
    container.setAttribute("aria-label", ariaLabel || panelTitle || (state.lang === "ru" ? "Тематическая карта" : "Thematic map"));
    destroyMap(id);
    const valueByIso = new Map(rows.map((r) => [r[isoKey], num(r[valueKey])]));
    const rowByIso = new Map(rows.map((r) => [r[isoKey], r]));
    const max = Math.max(1, ...rows.map((r) => num(r[valueKey])));
    const map = L.map(id, { zoomControl: true, attributionControl: false, scrollWheelZoom: false }).setView([28, 45], 2);
    state.maps.set(id, map);
    L.geoJSON(state.geo, {
      style: (feature) => {
        const iso = geoIso(feature);
        const value = valueByIso.get(iso) || 0;
        return {
          color: iso === selectedIso ? "#d6a51f" : "#ffffff",
          weight: iso === selectedIso ? 2.2 : 0.6,
          fillColor: value ? color(value, max) : "#e7edf5",
          fillOpacity: value ? 0.82 : 0.35,
        };
      },
      onEachFeature: (feature, layer) => {
        const iso = geoIso(feature);
        const row = rowByIso.get(iso);
        const name = state.lang === "ru" ? (feature.properties.name_ru || feature.properties.name || iso) : (feature.properties.name_en || feature.properties.name || iso);
        layer.bindTooltip(row ? `${name}: ${fmt0(row[valueKey])}` : `${name}: ${t("noData")}`);
        layer.on("click", () => {
          if (row && onSelect) onSelect(row);
        });
      },
    }).addTo(map);
    arcs.slice(0, 35).forEach((row) => {
      const start = coordsForIso(row[isoKey]);
      if (!start) return;
      L.polyline([start, [MOSCOW.lat, MOSCOW.lon]], {
        color: "#0b4f8a",
        weight: Math.max(1, Math.min(7, Math.sqrt(num(row[valueKey])) / 32)),
        opacity: 0.48,
      }).addTo(map);
    });
    setTimeout(() => {
      if (state.maps.get(id) !== map || !document.getElementById(id)?.isConnected) return;
      try { map.invalidateSize({ pan: false }); } catch (error) { console.warn("Map resize skipped", id, error); }
    }, 120);
  }

  function renderRussiaMap(id, laborData) {
    const container = document.getElementById(id);
    if (!container || !state.laborGeo || !window.L) return;
    destroyMap(id);
    const rows = laborData.top_regions_2050 || [];
    const valueByName = new Map(rows.map((r) => [String(r.territory_name).toLowerCase(), num(r.recommended_annual_quota_persons)]));
    const max = Math.max(1, ...rows.map((r) => num(r.recommended_annual_quota_persons)));
    const map = L.map(id, { zoomControl: true, attributionControl: false, scrollWheelZoom: false }).setView([61, 92], 3);
    state.maps.set(id, map);
    L.geoJSON(state.laborGeo, {
      style: (feature) => {
        const p = feature.properties || {};
        const name = String(p.Name_full || p.Name_small || p.name_en || "").toLowerCase();
        const value = valueByName.get(name) || 0;
        return {
          color: "#ffffff",
          weight: 0.7,
          fillColor: value ? color(value, max, ["#edf2f7", "#c7e0f2", "#7fb4d6", "#2d6fb4", "#0b4f8a"]) : "#e7edf5",
          fillOpacity: value ? 0.82 : 0.35,
        };
      },
      onEachFeature: (feature, layer) => {
        const p = feature.properties || {};
        const name = p.Name_full || p.Name_small || p.name_en || "";
        const value = valueByName.get(String(name).toLowerCase()) || 0;
        layer.bindTooltip(`${name}: ${fmt0(value)}`);
      },
    }).addTo(map);
    setTimeout(() => {
      if (state.maps.get(id) !== map || !document.getElementById(id)?.isConnected) return;
      try { map.invalidateSize({ pan: false }); } catch (error) { console.warn("Map resize skipped", id, error); }
    }, 120);
  }

  function plot(id, data, layout = {}, config = {}) {
    const element = document.getElementById(id);
    if (!window.Plotly || !element) return;
    const accessibility = layout.accessibility || {};
    const cleanLayout = { ...layout };
    delete cleanLayout.accessibility;
    const title = typeof cleanLayout.title === "string" ? cleanLayout.title : cleanLayout.title?.text;
    const panelTitle = element.closest(".panel")?.querySelector("h2")?.textContent?.trim();
    element.setAttribute("role", "img");
    element.setAttribute("aria-label", accessibility.ariaLabel || title || panelTitle || (state.lang === "ru" ? "График" : "Chart"));
    Plotly.newPlot(id, data, {
      margin: { l: 44, r: 16, t: 14, b: 42 },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { family: "Inter, Segoe UI, Arial", size: 11, color: "#17233a" },
      ...cleanLayout,
    }, { displayModeBar: false, responsive: true, ...config });
  }

  function renderTrend(id, rows, xKey, yKey, name) {
    plot(id, [{ x: rows.map((r) => r[xKey]), y: rows.map((r) => num(r[yKey])), type: "scatter", mode: "lines+markers", name, line: { color: "#0b4f8a", width: 3 }, fill: "tozeroy", fillcolor: "rgba(11,79,138,.10)" }]);
  }

  function renderHorizontalBar(id, rows, labelKey, valueKey, name) {
    const visible = rows.slice(0, 14).reverse();
    const labels = visible.map((r) => r[labelKey]);
    const maxLabelLength = labels.reduce((max, label) => Math.max(max, String(label || "").length), 0);
    const leftMargin = Math.min(window.innerWidth < 700 ? 190 : 270, Math.max(132, maxLabelLength * 7));
    plot(id, [{ y: labels, x: visible.map((r) => num(r[valueKey])), type: "bar", orientation: "h", name, marker: { color: "#0b4f8a" } }], {
      margin: { l: leftMargin, r: 24, t: 14, b: 38 },
      yaxis: { automargin: true, tickfont: { size: 10 } },
      xaxis: { automargin: true },
    });
  }

  async function renderOverview(payload) {
    const trudvsem = await getJson(DATA_URLS.trudvsemV2);
    const matrixRows = await loadCsv("matrix");
    const forecastRows = (await loadCsv("forecast")).map((row) => ({ ...row, displayCountry: localizedCountry(row.origin_iso3, row.origin_country) }));
    const laborPrograms = (trudvsem.programDemand || []).map((row) => ({
      ...row,
      display_label: programLabel(row),
    }));
    const countryProgramPriority = matrixRows
      .map((row) => ({ ...row, displayCountry: localizedCountry(row.iso3, row.country), displayProgram: programLabel(row) }))
      .sort((a, b) => num(a.rank_country_program_priority) - num(b.rank_country_program_priority));
    const inbound = payload.russiaInbound.topOrigins || [];
    const gap = payload.factPotentialGap.top || [];
    const forecast = payload.potentialForecast.capacityScenarios || [];
    const forecastFinal = forecast[forecast.length - 1] || {};
    const selected = gap[0] || inbound[0] || {};
    state.selectedIso = selected.origin_iso3 || selected.iso3 || "UKR";
    $("#app").innerHTML = `
      ${pageHero({
        kicker: state.lang === "ru" ? "Задача 5.2.1 · концептуальная модель" : "Task 5.2.1 · conceptual model",
        title: t("overviewHeading"),
        note: t("overviewNote"),
        evidenceTitle: state.lang === "ru" ? "Доказательная база" : "Evidence base",
        evidenceValue: `${fmt0(payload.odCoverage.rows)} UIS · ${fmt0(state.countries.countries?.length)} WPP`,
        evidenceNote: `${legacyInboundLabel()}. ${observedOnlyLabel()}. ${t("latestPositive")}: ${payload.russiaInbound.latestYear}.`,
        actions: `${sourceButton()}<a class="action-button primary" href="report.html">${esc(state.lang === "ru" ? "Открыть итоговый доклад" : "Open final report")}</a>`,
      })}
      <section class="decision-flow" aria-label="${esc(state.lang === "ru" ? "Исследовательский контур" : "Research workflow")}">
        <article><span>1</span><strong>${esc(state.lang === "ru" ? "Наблюдаемый контингент" : "Observed stock")}</strong><small>UIS 2010–2025</small></article><i aria-hidden="true">→</i>
        <article><span>2</span><strong>${esc(state.lang === "ru" ? "Молодёжные рынки" : "Youth markets")}</strong><small>UN WPP 2024</small></article><i aria-hidden="true">→</i>
        <article><span>3</span><strong>${esc(state.lang === "ru" ? "Структурная модель" : "Structural model")}</strong><small>PPML</small></article><i aria-hidden="true">→</i>
        <article><span>4</span><strong>${esc(state.lang === "ru" ? "Разрыв и восприимчивость" : "Gap and receptivity")}</strong><small>${esc(state.lang === "ru" ? "интервалы и покрытие" : "bounds and coverage")}</small></article><i aria-hidden="true">→</i>
        <article><span>5</span><strong>${esc(state.lang === "ru" ? "Управленческое решение" : "Management decision")}</strong><small>${esc(state.lang === "ru" ? "страна × программа × инструмент" : "country × program × instrument")}</small></article>
      </section>
      <section class="kpi-strip">
        ${kpi(state.lang === "ru" ? "Строк наблюдений UIS" : "UIS observation rows", fmt0(payload.odCoverage.russia_rows), state.lang === "ru" ? `${payload.odCoverage.origins} стран происхождения / ${payload.odCoverage.destinations} стран назначения` : `${payload.odCoverage.origins} origins / ${payload.odCoverage.destinations} destinations`, inbound[0])}
        ${kpi(t("modelled"), fmt0(forecastFinal.aggregate_capacity_demographic), state.lang === "ru" ? "базовая совокупная ёмкость в 2050 году" : "baseline aggregate capacity in 2050", payload.gravityModel)}
        ${kpi(t("modelDiagnostics"), fmt0(payload.gravityModel.n_observations), modelEstimatorLabel(payload.gravityModel.estimator), payload.gravityModel)}
        ${kpi(t("gap"), fmt0(gap[0]?.gap_abs), localizedCountry(gap[0]?.origin_iso3, gap[0]?.origin_country), gap[0])}
        ${kpi(t("sourcePassports"), fmt0(payload.sourceRegistry.sources.length), state.lang === "ru" ? `${payload.sourceRegistry.failed_attempts.length} попыток доступа зафиксировано` : `${payload.sourceRegistry.failed_attempts.length} access attempts logged`, payload.sourceRegistry.sources[0])}
      </section>
      <section class="control-bar">
        <label class="control-field"><span>${esc(t("year"))}</span><select id="overviewYear"><option>2026</option><option>2030</option><option>2040</option><option selected>2050</option></select></label>
        <label class="control-field"><span>${esc(state.lang === "ru" ? "Слой карты" : "Map layer")}</span><select id="overviewLayer"><option value="gap">${esc(t("gap"))}</option><option value="observed">${esc(t("fact"))}</option><option value="potential">${esc(t("potential"))}</option></select></label>
        <label class="control-field"><span>${esc(t("search"))}</span><input id="overviewSearch" type="search" value="${esc(localizedCountry(selected.origin_iso3 || selected.iso3, selected.origin_country || selected.country))}"></label>
        <div></div><div></div><div></div><button class="reset-button" type="button">${esc(t("reset"))}</button>
      </section>
      <section class="dashboard-grid">
        <section class="panel"><div class="pane-header"><div><h2>${esc(t("overviewHeading"))}</h2>${scaleLegend()}</div><span class="metric-note">${esc(t("fact"))} / ${esc(t("potential"))}</span></div><div id="platform2Map" class="map" data-qa="platform2-map"></div></section>
        <section class="panel ranking-panel"><div class="shortlist-head"><h2>${esc(t("gapTitle"))}</h2><button class="text-button" data-open-sources type="button">${esc(t("source"))}</button></div>${table(gap.slice(0, 20), [
          { label: t("rank"), render: (r) => r.rank_unrealized_potential, num: true },
          { label: t("country"), render: (r) => `${flagEmoji(r.origin_iso3)} ${localizedCountry(r.origin_iso3, r.origin_country)}` },
          { label: t("gap"), render: (r) => fmt0(r.gap_abs), num: true },
        ])}<div data-chart>${bars(gap.map((row) => ({ ...row, displayCountry: localizedCountry(row.origin_iso3, row.origin_country) })), "displayCountry", "gap_abs", 5)}</div></section>
        <section class="panel detail-panel" id="overviewDetail">${detailCountry(selected)}</section>
      </section>
      <section class="analysis-grid">
        <section class="panel span-7"><div class="pane-header"><h2>${esc(t("forecastTitle"))}</h2><span class="badge modelled">${esc(t("modelled"))}</span></div><div id="overviewForecastChart" class="chart small" data-chart></div></section>
        <section class="panel span-5"><h2>${esc(t("matrixPreview"))}</h2>${table(countryProgramPriority.slice(0, 8), [
          { label: t("country"), render: (r) => r.displayCountry },
          { label: state.lang === "ru" ? "Группа программ" : "Program group", render: (r) => r.displayProgram },
          { label: t("combinedPriority"), render: (r) => fmt1(r.combined_country_program_priority_score), num: true },
        ])}<p class="note">${esc(trudvsem.methodology?.interpretation || "")}</p></section>
        <section class="panel span-4"><h2>${esc(t("modelDiagnostics"))}</h2>${modelDiagnostics(payload.gravityModel)}</section>
        <section class="panel span-4"><h2>${esc(t("vacancyCompetency"))}</h2>${bars(laborPrograms, "display_label", "program_labor_demand_score", 8)}<p class="model-warning">${esc(t("vacanciesNotice"))}</p></section>
        <section class="panel span-4"><h2>${esc(t("downloads"))}</h2>${downloadLinks(payload.downloads)}</section>
      </section>`;
    bindCommon();
    const overviewGapRows = gap.map((row) => ({ ...row, displayCountry: localizedCountry(row.origin_iso3, row.origin_country) }));
    const renderOverviewMap = () => {
      const layer = $("#overviewLayer")?.value || "gap";
      const year = Number($("#overviewYear")?.value || 2050);
      const forecastSlice = forecastRows.filter((row) => Number(row.year) === year);
      const mapRows = layer === "observed" ? overviewGapRows : forecastSlice;
      const valueKey = layer === "observed" ? "actual_students_latest" : (layer === "potential" ? "model_based_attraction_capacity" : "representation_gap");
      const detailRows = mapRows.length ? mapRows : overviewGapRows;
      renderWorldMap("platform2Map", detailRows, {
        isoKey: "origin_iso3",
        valueKey,
        labelKey: "displayCountry",
        selectedIso: state.selectedIso,
        ariaLabel: state.lang === "ru" ? "Карта факта, потенциала или разрыва по странам происхождения" : "Map of actual, potential or gap by origin country",
        onSelect: (row) => {
          state.selectedIso = row.origin_iso3;
          $("#overviewDetail").innerHTML = detailCountry(row);
          bindCommon();
        },
      });
    };
    $("#overviewYear")?.addEventListener("change", renderOverviewMap);
    $("#overviewLayer")?.addEventListener("change", renderOverviewMap);
    renderOverviewMap();
    renderTrend("overviewForecastChart", forecast, "year", "aggregate_capacity_demographic", state.lang === "ru" ? "Базовая совокупная ёмкость" : "Baseline aggregate capacity");
  }

  function detailCountry(row) {
    if (!row) return `<div class="empty-state">${esc(t("noData"))}</div>`;
    const iso = row.origin_iso3 || row.iso3 || "";
    const country = localizedCountry(iso, row.origin_country || row.origin_name || row.country || "");
    return `<div class="selected-top">
      <div><p class="panel-kicker">${esc(t("countryDetail"))}</p><div class="country-heading"><span class="country-flag">${flagEmoji(iso)}</span><h2>${esc(country)}</h2></div></div>
      <div class="score-lockup"><span>${esc(t("gap"))}</span><strong>${fmt0(row.gap_abs || row.students_observed || row.potential_students || row.expected_effect_value)}</strong></div>
    </div>
    <div class="badge-row">
      <span class="badge verified">${esc(t("fact"))}: ${fmt0(row.actual_students_latest || row.students_observed || 0)}</span>
      <span class="badge modelled">${esc(t("potential"))}: ${fmt0(row.model_based_attraction_capacity || row.potential_students || 0)}</span><span class="badge">${esc(state.lang === "ru" ? "Инерционный ориентир" : "Continuity benchmark")}: ${fmt0(row.demographic_continuity_baseline || 0)}</span>
      ${row.probability_positive_representation_gap !== undefined ? `<span class="badge">${esc(state.lang === "ru" ? "P(положительный разрыв)" : "P(positive gap)")}: ${fmt1(100 * num(row.probability_positive_representation_gap))}%</span>` : ""}
      ${row.gap_parameter_q025 !== undefined ? `<span class="badge">95%: ${fmt0(row.gap_parameter_q025)}–${fmt0(row.gap_parameter_q975)}</span>` : ""}
      <span class="badge">${esc(observationStatusLabel(row.coverage_status || row.observation_status || ""))}</span>
    </div>
    <p class="model-warning">${esc(t("forecastNotice"))}</p>
    ${passportCard(row, t("passport"))}`;
  }

  function modelDiagnostics(model) {
    const structuralMae = model.validation_metrics?.mae || model.selected_time_holdout_average?.mae_students;
    const benchmarkMae = model.persistence_benchmark?.time_holdout_average?.mae_students;
    return `<div class="model-diagnostic-summary">
      <div class="badge-row"><span class="badge verified">${esc(modelStatusLabel(model.status))}</span><span class="badge">PPML</span></div>
      <p>${esc(state.lang === "ru" ? "Модель оценивает структурное распределение наблюдаемого контингента UIS между странами на основе молодёжного рынка, образовательной мобильности, расстояния и институциональных признаков." : "The model estimates structural allocation of observed UIS student stock across countries using youth-market size, mobility, distance and institutional covariates.")}</p>
      <div class="diagnostic-metrics"><span><strong>N</strong>${fmt0(model.n_observations)}</span><span><strong>MAE PPML</strong>${fmt0(structuralMae)}</span><span><strong>${esc(state.lang === "ru" ? "MAE ориентира" : "Benchmark MAE")}</strong>${fmt0(benchmarkMae)}</span></div>
      <p class="model-warning">${esc(state.lang === "ru" ? "Структурная ёмкость предназначена для анализа недопредставленности, а не для обещания конкретного числа будущих зачислений." : "Structural capacity supports under-representation analysis and is not a promise of a future enrolment count.")}</p>
      <details class="data-disclosure"><summary>${esc(state.lang === "ru" ? "Формула и коэффициенты" : "Formula and coefficients")}</summary>
        <p><strong>${esc(state.lang === "ru" ? "Формула" : "Formula")}:</strong> <code>${esc(model.formula || "")}</code></p>
        <p><strong>${esc(state.lang === "ru" ? "Метод оценивания" : "Estimator")}:</strong> ${esc(modelEstimatorLabel(model.estimator))}</p>
        ${table((model.coefficients || []).filter((row) => !String(row.term).startsWith("year_") && !String(row.term).startsWith("region_")).slice(0, 7), [
          { label: state.lang === "ru" ? "Фактор" : "Term", render: (r) => coefficientLabel(r.term) },
          { label: state.lang === "ru" ? "Оценка" : "Estimate", render: (r) => fmt1(r.estimate), num: true },
          { label: state.lang === "ru" ? "Стандартная ошибка" : "Std. error", render: (r) => fmt1(r.std_error), num: true },
        ])}
      </details>
    </div>`;
  }

  async function renderMigration() {
    const payload = await loadCommon();
    const rows = await loadCsv("inbound");
    const years = [...new Set(rows.map((r) => Number(r.year)).filter(Boolean))].sort((a, b) => a - b);
    state.migrationYear = payload.russiaInbound.latestYear || 2023;
    const renderYear = () => {
      const selectedRows = rows.filter((r) => Number(r.year) === Number(state.migrationYear) && num(r.students_observed) > 0).sort((a, b) => num(b.students_observed) - num(a.students_observed));
      const top = selectedRows.slice(0, Number($("#migrationTopN")?.value || 30)).map((row) => ({ ...row, displayCountry: localizedCountry(row.origin_iso3, row.origin_name) }));
      $("#migrationRanking").innerHTML = `<p class="metric-note">${esc(state.lang === "ru" ? "Наблюдаемые студенты" : "Observed students")}</p>` + table(top, [
        { label: t("rank"), render: (_, i) => i + 1, num: true },
        { label: t("country"), render: (r) => `${flagEmoji(r.origin_iso3)} ${r.displayCountry || localizedCountry(r.origin_iso3, r.origin_name)}` },
        { label: t("students"), render: (r) => fmt0(r.students_observed), num: true },
        { label: t("status"), render: (r) => observationStatusLabel(r.observation_status) },
        { label: t("passport"), html: true, render: (r) => `<button class="passport-button" type="button" data-trace="${esc(r.trace_id)}">${esc(t("passport"))}</button>` },
      ], { id: "migrationRankingTable", rowKey: "origin_iso3" });
      $("#migrationRanking").insertAdjacentHTML("beforeend", `<div data-chart>${bars(top, "origin_name", "students_observed", 6)}</div>`);
      $("#migrationRawTable").innerHTML = table(top.slice(0, 20), [
        { label: t("country"), render: (r) => r.displayCountry || localizedCountry(r.origin_iso3, r.origin_name) },
        { label: t("year"), render: (r) => r.year, num: true },
        { label: t("students"), render: (r) => fmt0(r.students_observed), num: true },
        { label: state.lang === "ru" ? "Тип показателя" : "Measure type", render: (r) => mobilityMeasureLabel(r.flow_or_stock) },
        { label: t("trace"), render: (r) => r.trace_id },
      ], { id: "migrationRawRows" });
      const first = top[0];
      updateMigrationDetail(first);
      renderWorldMap("migrationMap", top, { isoKey: "origin_iso3", valueKey: "students_observed", labelKey: "displayCountry", selectedIso: first?.origin_iso3, onSelect: updateMigrationDetail, arcs: top });
      renderHorizontalBar("migrationBarChart", top, "displayCountry", "students_observed", t("observed"));
      const meaningfulTrendYears = years.filter((year) => Number(year) <= Number(payload.russiaInbound.latestYear || year));
      const totals = meaningfulTrendYears.map((year) => ({ year, value: rows.filter((r) => Number(r.year) === year).reduce((sum, r) => sum + num(r.students_observed), 0) }));
      renderTrend("migrationTrendChart", totals, "year", "value", t("observed"));
      bindMigrationButtons(top);
    };
    $("#app").innerHTML = `
      ${pageHero({
        kicker: state.lang === "ru" ? "Задача 5.2.2 · наблюдаемый международный контингент" : "Task 5.2.2 · observed international stock",
        title: state.lang === "ru" ? "Международная образовательная мобильность в Россию, 2010–2025" : "International student mobility to Russia, 2010–2025",
        note: t("observedOnly"),
        evidenceTitle: state.lang === "ru" ? "Проверенный источник" : "Verified source",
        evidenceValue: "UNESCO UIS OPRI",
        evidenceNote: `${t("latestPositive")}: ${payload.russiaInbound.latestYear}; ${t("sourceMax")}: ${payload.russiaInbound.sourceMaxYear}. ${russiaCoverageNote(payload)}`,
        actions: `<button id="openSourceDrawer" class="primary-action" type="button">${esc(t("sourcePassports"))}</button>`,
      })}
      <section class="kpi-strip">
        ${kpi(state.lang === "ru" ? "Наблюдений по России" : "Russia inbound rows", fmt0(payload.odCoverage.russia_rows), state.lang === "ru" ? "строки страна–год" : "country-year rows")}
        ${kpi(state.lang === "ru" ? "Стран происхождения" : "Origin countries", fmt0(payload.odCoverage.origins), state.lang === "ru" ? "глобальная база UIS" : "global UIS database")}
        ${kpi(state.lang === "ru" ? "Последний содержательный год" : "Latest meaningful year", String(payload.russiaInbound.latestYear), "UIS OPRI")}
        ${kpi(state.lang === "ru" ? "Максимальный год источника" : "Source maximum year", String(payload.russiaInbound.sourceMaxYear), state.lang === "ru" ? "может быть неполным" : "may be incomplete")}
        ${kpi(state.lang === "ru" ? "Тип показателя" : "Measure type", state.lang === "ru" ? "контингент" : "enrolled stock", state.lang === "ru" ? "не новые зачисления" : "not new enrolments")}
      </section>
      <section id="migrationFilters" class="filter-toolbar">
        <label class="control-field"><span>${esc(t("year"))}</span><select id="migrationYear">${years.map((y) => `<option value="${y}" ${y === state.migrationYear ? "selected" : ""}>${y}</option>`).join("")}</select></label>
        <label class="control-field"><span>${esc(t("topN"))}</span><select id="migrationTopN"><option>10</option><option selected>30</option><option>50</option><option>100</option></select></label>
        <label class="control-field"><span>${esc(t("search"))}</span><input id="migrationSearch" type="search"></label>
        <label class="control-field"><span>${esc(state.lang === "ru" ? "Страна назначения" : "Destination")}</span><select disabled><option>${esc(state.lang === "ru" ? "Российская Федерация" : "Russian Federation")}</option></select></label>
        <label class="control-field"><span>${esc(state.lang === "ru" ? "Тип показателя" : "Measure type")}</span><select disabled><option>${esc(state.lang === "ru" ? "Контингент зачисленных студентов" : "Enrolled student stock")}</option></select></label>
        <label class="control-field"><span>${esc(t("status"))}</span><select disabled><option>${esc(state.lang === "ru" ? "Официальные / справочные данные" : "Official / reference")}</option></select></label>
        <button class="reset-button" type="button">${esc(t("reset"))}</button>
      </section>
      <section class="dashboard-grid">
        <section class="panel"><div class="pane-header"><div><h2>${esc(state.lang === "ru" ? "Карта наблюдаемого въезда в Россию" : "Observed Russia inbound map")}</h2>${scaleLegend()}</div><span class="badge verified">${esc(t("fact"))}</span></div><div id="migrationMap" class="map" data-qa="migration-map"></div></section>
        <section class="panel ranking-panel"><div class="shortlist-head"><h2>${esc(state.lang === "ru" ? "Рейтинг наблюдаемого въезда" : "Observed inbound ranking")}</h2><span class="badge verified">${esc(state.lang === "ru" ? "Наблюдаемые студенты" : "Observed students")}</span><span class="metric-note">${esc(t("observedOnly"))}</span></div><div id="migrationRanking"></div></section>
        <section class="panel detail-panel"><div id="migrationDetail"></div><div id="migrationSourcePassport" class="passport-mini"></div></section>
      </section>
      <section class="analysis-grid">
        <section class="panel span-6"><h2>${esc(state.lang === "ru" ? "Динамика UIS по годам" : "UIS trend by year")}</h2><div id="migrationTrendChart" class="chart small" data-chart></div></section>
        <section class="panel span-6"><h2>${esc(state.lang === "ru" ? "Топ стран выбранного года" : "Selected-year top origins")}</h2><div id="migrationBarChart" class="chart small" data-chart></div></section>
        <section class="panel span-12"><h2>${esc(state.lang === "ru" ? "Строки наблюдений и идентификаторы трассировки" : "Observation rows and trace identifiers")}</h2><div id="migrationRawTable"></div></section>
      </section>`;
    $("#app .status-band")?.setAttribute("id", "migrationStatus");
    $("#openSourceDrawer").addEventListener("click", openSources);
    $("#migrationYear").addEventListener("change", (event) => { state.migrationYear = Number(event.target.value); renderYear(); });
    $("#migrationTopN").addEventListener("change", renderYear);
    renderYear();
  }

  function updateMigrationDetail(row) {
    if (!row) return;
    state.selectedIso = row.origin_iso3;
    $("#migrationDetail").innerHTML = `<div class="selected-top"><div><p class="panel-kicker">${esc(t("countryDetail"))}</p><div class="country-heading"><span class="country-flag">${flagEmoji(row.origin_iso3)}</span><h2>${esc(row.displayCountry || localizedCountry(row.origin_iso3, row.origin_name))}</h2></div></div><div class="score-lockup"><span>${esc(t("students"))}</span><strong>${fmt0(row.students_observed)}</strong></div></div><div class="badge-row"><span class="badge verified">${esc(t("fact"))}</span><span class="badge">${esc(mobilityMeasureLabel(row.flow_or_stock))}</span><span class="badge">${esc(observationStatusLabel(row.observation_status))}</span></div><p>${esc(mobilityIndicatorLabel(row.source_indicator_label))}</p>`;
    $("#migrationSourcePassport").innerHTML = passportCard(row, t("passport"));
  }

  function bindMigrationButtons(rows) {
    document.querySelectorAll("#migrationRanking tbody tr").forEach((tr) => {
      tr.addEventListener("click", () => updateMigrationDetail(rows[Number(tr.dataset.rowIndex)]));
    });
    document.querySelectorAll("#migrationRanking .passport-button").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        event.stopPropagation();
        const row = rows.find((r) => r.trace_id === btn.dataset.trace);
        updateMigrationDetail(row);
      });
    });
  }

  function renderDemographyVisuals(rows, selectedIso) {
    const series = state.countries.demographySeries?.[selectedIso] || {};
    const actual = series.actual || [];
    const forecast = series.forecast || [];
    plot("demographyTrend", [
      {
        x: actual.map((row) => row.year),
        y: actual.map((row) => num(row.student_pool)),
        type: "scatter",
        mode: "lines",
        name: state.lang === "ru" ? "Оценка ООН" : "UN estimate",
        line: { color: "#718096", width: 2 },
      },
      {
        x: forecast.map((row) => row.year),
        y: forecast.map((row) => num(row.student_pool)),
        type: "scatter",
        mode: "lines",
        name: state.lang === "ru" ? "Проекция ООН" : "UN projection",
        line: { color: "#0b4f8a", width: 3 },
        fill: "tozeroy",
        fillcolor: "rgba(11,79,138,.08)",
      },
    ], {
      yaxis: { title: state.lang === "ru" ? "Человек" : "People", separatethousands: true },
      xaxis: { fixedrange: true },
      legend: { orientation: "h", y: 1.12 },
    });

    const pyramid = state.countries.ageSexPyramid?.[selectedIso] || {};
    const yearIndex = (pyramid.forecastYears || []).indexOf(2050);
    const male = (pyramid.forecastMale || [])[yearIndex] || [];
    const female = (pyramid.forecastFemale || [])[yearIndex] || [];
    const bands = pyramid.ageBands || [];
    plot("demographyPyramid", [
      { y: bands, x: male.map((value) => -num(value)), type: "bar", orientation: "h", name: state.lang === "ru" ? "Мужчины" : "Male", marker: { color: "#4f86bf" }, hovertemplate: "%{y}: %{customdata}<extra></extra>", customdata: male.map(fmt0) },
      { y: bands, x: female.map(num), type: "bar", orientation: "h", name: state.lang === "ru" ? "Женщины" : "Female", marker: { color: "#d6a51f" }, hovertemplate: "%{y}: %{customdata}<extra></extra>", customdata: female.map(fmt0) },
    ], {
      barmode: "relative",
      xaxis: { tickformat: "~s", title: state.lang === "ru" ? "Население" : "Population" },
      yaxis: { automargin: true },
      legend: { orientation: "h", y: 1.12 },
      shapes: bands.flatMap((band, index) => ["15-19", "20-24"].includes(band) ? [{ type: "rect", xref: "paper", yref: "y", x0: 0, x1: 1, y0: index - .48, y1: index + .48, fillcolor: "rgba(22,119,93,.09)", line: { width: 0 }, layer: "below" }] : []),
    });

    const scatterRows = rows.filter((row) => Number.isFinite(row.growthPct) && row.pool2050 > 0);
    plot("demographyQuadrant", [{
      x: scatterRows.map((row) => row.growthPct),
      y: scatterRows.map((row) => row.pool2050),
      text: scatterRows.map((row) => row.country),
      customdata: scatterRows.map((row) => row.iso3),
      type: "scatter",
      mode: "markers",
      marker: { size: scatterRows.map((row) => Math.max(7, Math.min(28, Math.sqrt(row.pool2050) / 800))), color: scatterRows.map((row) => row.growthPct), colorscale: "Blues", showscale: false, opacity: .78, line: { color: "#fff", width: 1 } },
      hovertemplate: "%{text}<br>2050: %{y:,.0f}<br>2026–2050: %{x:.1f}%<extra></extra>",
    }], {
      xaxis: { title: state.lang === "ru" ? "Изменение рынка, 2026–2050, %" : "Market change, 2026–2050, %", zeroline: true, zerolinecolor: "#c99b2e" },
      yaxis: { title: state.lang === "ru" ? "Образовательный пул 2050" : "Education pool 2050", type: "log" },
    });
  }

  async function renderDemographyPage() {
    await loadCommon();
    const rows = (state.countries.countries || []).map((country) => {
      const demography = country.demography || {};
      const pool2026 = num(demography.studentPool2026);
      const pool2050 = num(demography.studentPool2050);
      return {
        iso3: country.iso3,
        country: localizedCountry(country.iso3, country.name),
        region: country.region,
        pool2026,
        pool2035: num(demography.studentPool2035),
        pool2050,
        youthCurrent: num(demography.youth15_24Current),
        addressable2050: num(demography.addressableMarketStudents2050),
        growthAbs: pool2050 - pool2026,
        growthPct: pool2026 > 0 ? (pool2050 / pool2026 - 1) * 100 : NaN,
      };
    }).filter((row) => row.pool2050 > 0);
    const growing = rows.filter((row) => row.growthPct > 0).sort((a, b) => b.growthPct - a.growthPct);
    const largest = rows.slice().sort((a, b) => b.pool2050 - a.pool2050);
    const selectedDefault = growing.find((row) => row.iso3 === "NGA") || growing[0] || largest[0];
    state.selectedIso = selectedDefault.iso3;
    const total2026 = rows.reduce((sum, row) => sum + row.pool2026, 0);
    const total2050 = rows.reduce((sum, row) => sum + row.pool2050, 0);
    const updateSelection = (iso3) => {
      state.selectedIso = iso3;
      const selected = rows.find((row) => row.iso3 === iso3) || selectedDefault;
      const detail = document.getElementById("demographyDetail");
      if (detail) detail.innerHTML = `<p class="panel-kicker">${esc(t("countryDetail"))}</p><div class="country-heading"><span class="country-flag">${flagEmoji(selected.iso3)}</span><h2>${esc(selected.country)}</h2></div><div class="metric-grid compact-metrics">${kpi(state.lang === "ru" ? "Пул 2026" : "Pool 2026", fmt0(selected.pool2026), "UN WPP 2024")}${kpi(state.lang === "ru" ? "Пул 2050" : "Pool 2050", fmt0(selected.pool2050), "UN WPP 2024")}${kpi(state.lang === "ru" ? "Изменение" : "Change", pct(selected.growthPct), "2026–2050")}</div><p class="decision-summary">${esc(selected.growthPct > 0 ? (state.lang === "ru" ? "Рынок расширяется: приоритет для раннего выстраивания школьных, языковых и партнёрских каналов." : "The market is expanding: prioritize early school, language and partner channels.") : (state.lang === "ru" ? "Рынок сокращается: акцент следует делать на повышении доли России, а не на росте абсолютного размера когорты." : "The market is contracting: focus on Russia's share rather than absolute cohort growth."))}</p>`;
      renderDemographyVisuals(rows, selected.iso3);
      const metric = document.getElementById("demographyMetric")?.value || "growthPct";
      renderWorldMap("demographyMap", rows, {
        isoKey: "iso3",
        valueKey: metric,
        labelKey: "country",
        selectedIso: selected.iso3,
        ariaLabel: state.lang === "ru" ? "Карта размера или динамики молодёжных образовательных рынков" : "Map of youth education-market scale or change",
        onSelect: (row) => { document.getElementById("demographyCountry").value = row.iso3; updateSelection(row.iso3); },
      });
    };
    $("#app").innerHTML = `
      ${pageHero({
        kicker: state.lang === "ru" ? "Задача 5.2.3 · демографическая основа" : "Task 5.2.3 · demographic foundation",
        title: t("demographyTitle"),
        note: t("demographyNotice"),
        evidenceTitle: state.lang === "ru" ? "Официальный источник" : "Official source",
        evidenceValue: "UN World Population Prospects 2024",
        evidenceNote: state.lang === "ru" ? "Оценки до 2023 года и средний вариант проекции 2024–2050; возрастные группы 15–24 выделены отдельно." : "Estimates through 2023 and Medium projection for 2024–2050; ages 15–24 are isolated explicitly.",
      })}
      <section class="kpi-strip">
        ${kpi(state.lang === "ru" ? "Стран и территорий" : "Countries and areas", fmt0(rows.length), state.lang === "ru" ? "с полным демографическим рядом" : "with complete demographic series")}
        ${kpi(state.lang === "ru" ? "Образовательный пул 2026" : "Education pool 2026", fmt0(total2026), state.lang === "ru" ? "15–24 + часть 25–29" : "ages 15–24 + part of 25–29")}
        ${kpi(state.lang === "ru" ? "Образовательный пул 2050" : "Education pool 2050", fmt0(total2050), state.lang === "ru" ? "средний вариант ООН" : "UN Medium variant")}
        ${kpi(state.lang === "ru" ? "Растущие рынки" : "Growing markets", fmt0(growing.length), state.lang === "ru" ? "положительная динамика 2026–2050" : "positive 2026–2050 change")}
        ${kpi(state.lang === "ru" ? "Лидер по росту" : "Growth leader", growing[0]?.country || missingLabel(), growing[0] ? pct(growing[0].growthPct) : "")}
      </section>
      <section class="filter-toolbar">
        <label class="control-field"><span>${esc(t("country"))}</span><select id="demographyCountry">${rows.slice().sort((a,b)=>a.country.localeCompare(b.country)).map((row) => `<option value="${row.iso3}" ${row.iso3 === state.selectedIso ? "selected" : ""}>${esc(row.country)}</option>`).join("")}</select></label>
        <label class="control-field"><span>${esc(state.lang === "ru" ? "Показатель карты" : "Map metric")}</span><select id="demographyMetric"><option value="growthPct">${esc(state.lang === "ru" ? "Динамика 2026–2050, %" : "Change 2026–2050, %")}</option><option value="pool2050">${esc(state.lang === "ru" ? "Образовательный пул 2050" : "Education pool 2050")}</option><option value="growthAbs">${esc(state.lang === "ru" ? "Абсолютное изменение" : "Absolute change")}</option></select></label>
        <div></div><div></div>${sourceButton()}
      </section>
      <section class="dashboard-grid">
        <section class="panel"><div class="pane-header"><div><h2>${esc(state.lang === "ru" ? "Глобальная карта образовательных рынков" : "Global education-market map")}</h2>${scaleLegend()}</div><span class="badge verified">UN WPP 2024</span></div><div id="demographyMap" class="map map-tall"></div></section>
        <section class="panel"><div class="pane-header"><div><h2>${esc(state.lang === "ru" ? "Рынки с наибольшим ростом" : "Fastest-growing markets")}</h2><p>${esc(state.lang === "ru" ? "Темп не заменяет масштаб: используйте карту и квадрант совместно." : "Growth does not replace scale: use the map and quadrant together.")}</p></div></div>${table(growing.slice(0, 20), [{ label: t("country"), render: (row) => `${flagEmoji(row.iso3)} ${row.country}` }, { label: "2050", render: (row) => fmt0(row.pool2050), num: true }, { label: "2026–2050", render: (row) => pct(row.growthPct), num: true }])}</section>
        <aside id="demographyDetail" class="panel detail-panel"></aside>
      </section>
      <section class="analysis-grid">
        <section class="panel span-7"><div class="pane-header"><div><h2>${esc(state.lang === "ru" ? "Траектория выбранного рынка" : "Selected-market trajectory")}</h2><p>${esc(state.lang === "ru" ? "Фактические оценки и официальная проекция показаны разными линиями." : "Historical estimates and official projection are shown separately.")}</p></div></div><div id="demographyTrend" class="chart small"></div></section>
        <section class="panel span-5"><div class="pane-header"><div><h2>${esc(state.lang === "ru" ? "Возрастно-половая структура 2050" : "Age-sex structure in 2050")}</h2><p>${esc(state.lang === "ru" ? "Целевые группы 15–19 и 20–24 выделены фоном." : "Target groups 15–19 and 20–24 are highlighted.")}</p></div></div><div id="demographyPyramid" class="chart small"></div></section>
        <section class="panel span-12"><div class="pane-header"><div><h2>${esc(state.lang === "ru" ? "Квадрант «масштаб — динамика»" : "Scale–trajectory quadrant")}</h2><p>${esc(state.lang === "ru" ? "Верхняя правая зона — крупные и растущие молодёжные рынки." : "The upper-right zone contains large and expanding youth markets.")}</p></div></div><div id="demographyQuadrant" class="chart"></div></section>
      </section>`;
    document.getElementById("demographyCountry")?.addEventListener("change", (event) => updateSelection(event.target.value));
    document.getElementById("demographyMetric")?.addEventListener("change", () => updateSelection(state.selectedIso));
    bindCommon();
    updateSelection(state.selectedIso);
  }

  function modelMetric(label, value, note, tone = "") {
    return `<article class="metric-card ${tone}"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(note || "")}</small></article>`;
  }

  async function renderModelPage() {
    const payload = await loadCommon();
    const model = payload.gravityModel || {};
    const structural = model.selected_time_holdout_average || model.validation_metrics || {};
    const benchmark = model.persistence_benchmark?.time_holdout_average || {};
    const coefficients = (model.coefficients || []).filter((row) => !String(row.term).startsWith("year_") && !String(row.term).startsWith("region_")).slice(0, 12);
    const candidates = Object.entries(model.candidate_validation || {}).map(([specification, value]) => ({ specification, ...(value.time_holdout_average || {}), selection_score: value.selection_score }));
    $("#app").innerHTML = `
      ${pageHero({
        kicker: state.lang === "ru" ? "Задача 5.2.4 · объяснительная модель" : "Task 5.2.4 · explanatory model",
        title: t("modelTitle"),
        note: t("modelNotice"),
        evidenceTitle: state.lang === "ru" ? "Роль модели" : "Model role",
        evidenceValue: state.lang === "ru" ? "Объяснение структуры и недопредставленности" : "Structural allocation and under-representation",
        evidenceNote: state.lang === "ru" ? "Инерционный ориентир используется для проверки прогнозной точности, но не создаёт структурный потенциал." : "The continuity benchmark checks predictive performance but does not define structural potential.",
      })}
      <section class="metric-grid">
        ${modelMetric(state.lang === "ru" ? "Наблюдений" : "Observations", fmt0(model.n_observations), `${fmt0(model.n_origins)} ${state.lang === "ru" ? "стран происхождения" : "origins"}`)}
        ${modelMetric(state.lang === "ru" ? "Период оценки" : "Estimation period", `${model.full_fit_period?.[0] || ""}–${model.full_fit_period?.[1] || ""}`, state.lang === "ru" ? "неполные годы исключены" : "incomplete years excluded")}
        ${modelMetric(state.lang === "ru" ? "MAE структурной модели" : "Structural-model MAE", fmt0(structural.mae_students || structural.mae), state.lang === "ru" ? "проверка на отложенных годах" : "time holdout")}
        ${modelMetric(state.lang === "ru" ? "MAE инерционного ориентира" : "Continuity-benchmark MAE", fmt0(benchmark.mae_students), state.lang === "ru" ? "контроль прогнозной точности" : "predictive benchmark", "positive")}
        ${modelMetric(state.lang === "ru" ? "Симуляций неопределённости" : "Uncertainty draws", fmt0(model.forecast_uncertainty?.parameter_draws), "95%")}
      </section>
      <section class="decision-flow" aria-label="${esc(state.lang === "ru" ? "Логика модели" : "Model logic")}">
        <article><span>1</span><strong>${esc(state.lang === "ru" ? "Наблюдаемый контингент UIS" : "Observed UIS stock")}</strong><small>${esc(state.lang === "ru" ? "зависимая переменная" : "dependent variable")}</small></article>
        <i aria-hidden="true">→</i><article><span>2</span><strong>${esc(state.lang === "ru" ? "Рынок, мобильность, расстояние" : "Market, mobility, distance")}</strong><small>${esc(state.lang === "ru" ? "лагированные признаки" : "lagged covariates")}</small></article>
        <i aria-hidden="true">→</i><article><span>3</span><strong>PPML</strong><small>${esc(state.lang === "ru" ? "кластерная ковариация" : "clustered covariance")}</small></article>
        <i aria-hidden="true">→</i><article><span>4</span><strong>${esc(state.lang === "ru" ? "Структурные доли" : "Structural shares")}</strong><small>${esc(state.lang === "ru" ? "не точечный прогноз" : "not a point forecast")}</small></article>
        <i aria-hidden="true">→</i><article><span>5</span><strong>${esc(state.lang === "ru" ? "Разрыв и вероятность" : "Gap and probability")}</strong><small>${esc(state.lang === "ru" ? "600 симуляций" : "600 simulations")}</small></article>
      </section>
      <section class="analysis-grid">
        <section class="panel span-7"><div class="pane-header"><div><h2>${esc(state.lang === "ru" ? "Коэффициенты структурной модели" : "Structural-model coefficients")}</h2><p>${esc(state.lang === "ru" ? "Точки — оценки; линии — 95-процентные интервалы. Фиксированные эффекты скрыты для читаемости." : "Points are estimates; lines are 95% intervals. Fixed effects are hidden for readability.")}</p></div><span class="badge modelled">PPML</span></div><div id="modelCoefficientChart" class="chart"></div></section>
        <section class="panel span-5"><div class="pane-header"><div><h2>${esc(state.lang === "ru" ? "Структурная модель и прогнозный ориентир" : "Structural model vs benchmark")}</h2><p>${esc(state.lang === "ru" ? "Инерционный ориентир лучше прогнозирует краткосрочный уровень; PPML отвечает на объяснительный вопрос." : "The benchmark predicts near-term levels better; PPML answers the explanatory question.")}</p></div></div><div id="modelBenchmarkChart" class="chart small"></div><div class="model-warning">${esc(state.lang === "ru" ? "Не интерпретируйте структурную ёмкость как гарантированное число будущих зачислений." : "Do not interpret structural capacity as guaranteed future enrolment.")}</div></section>
        <section class="panel span-7"><div class="pane-header"><div><h2>${esc(state.lang === "ru" ? "Сравнение спецификаций" : "Specification comparison")}</h2><p>${esc(state.lang === "ru" ? "Выбор основан на проверке на отложенных годах и странах." : "Selection uses time and country holdouts.")}</p></div></div>${table(candidates, [
          { label: state.lang === "ru" ? "Спецификация" : "Specification", render: (row) => specificationLabel(row.specification) },
          { label: "MAE", render: (row) => fmt0(row.mae_students), num: true },
          { label: "Spearman", render: (row) => fmt1(row.spearman_rank_correlation), num: true },
          { label: "Top-20 recall", render: (row) => pct(100 * num(row.top20_recall)), num: true },
          { label: state.lang === "ru" ? "Критерий выбора" : "Selection score", render: (row) => fmt1(row.selection_score), num: true },
        ])}</section>
        <section class="panel span-5"><div class="pane-header"><div><h2>${esc(state.lang === "ru" ? "Карточка модели" : "Model card")}</h2><p>${esc(state.lang === "ru" ? "Ключевые ограничения и воспроизводимость." : "Key limitations and reproducibility.")}</p></div></div><dl class="definition-list"><div><dt>${esc(state.lang === "ru" ? "Оцениватель" : "Estimator")}</dt><dd>${esc(modelEstimatorLabel(model.estimator))}</dd></div><div><dt>${esc(state.lang === "ru" ? "Зависимая переменная" : "Dependent variable")}</dt><dd>${esc(state.lang === "ru" ? "Численность зачисленных международно мобильных студентов в России" : model.dependent_variable_semantics || "")}</dd></div><div><dt>${esc(state.lang === "ru" ? "Будущие признаки" : "Future covariates")}</dt><dd>${esc(state.lang === "ru" ? "Меняется демография; остальные признаки фиксируются на последнем наблюдении." : model.diagnostics?.future_covariate_policy || "")}</dd></div><div><dt>${esc(state.lang === "ru" ? "Неопределённость" : "Uncertainty")}</dt><dd>${esc(state.lang === "ru" ? "Ковариация коэффициентов; не полный прогнозный интервал." : model.forecast_uncertainty?.method || "")}</dd></div></dl>${sourceButton(state.lang === "ru" ? "Открыть паспорта" : "Open passports")}</section>
      </section>`;
    plot("modelCoefficientChart", [{
      x: coefficients.map((row) => num(row.estimate)),
      y: coefficients.map((row) => coefficientLabel(row.term)),
      type: "scatter",
      mode: "markers",
      marker: { size: 10, color: "#0b4f8a" },
      error_x: { type: "data", symmetric: false, array: coefficients.map((row) => num(row.conf_high) - num(row.estimate)), arrayminus: coefficients.map((row) => num(row.estimate) - num(row.conf_low)), color: "#7f9dbb", thickness: 1.5, width: 4 },
      hovertemplate: "%{y}<br>%{x:.3f}<extra></extra>",
    }], { xaxis: { title: state.lang === "ru" ? "Коэффициент" : "Coefficient", zeroline: true, zerolinecolor: "#c99b2e" }, yaxis: { automargin: true } });
    plot("modelBenchmarkChart", [{
      x: [state.lang === "ru" ? "Структурная PPML" : "Structural PPML", state.lang === "ru" ? "Инерционный ориентир" : "Continuity benchmark"],
      y: [num(structural.mae_students || structural.mae), num(benchmark.mae_students)],
      type: "bar",
      marker: { color: ["#718096", "#16775d"] },
      text: [fmt0(structural.mae_students || structural.mae), fmt0(benchmark.mae_students)],
      textposition: "outside",
      hovertemplate: "%{x}<br>MAE: %{y:,.0f}<extra></extra>",
    }], { yaxis: { title: "MAE", rangemode: "tozero" }, margin: { l: 54, r: 18, t: 24, b: 75 } });
    bindCommon();
  }

  function renderFriendlinessSelection(rows, selectedIso) {
    const row = rows.find((item) => item.iso3 === selectedIso) || rows[0];
    if (!row) return;
    const detail = document.getElementById("friendlinessDetail");
    if (detail) detail.innerHTML = `<p class="panel-kicker">${esc(t("countryDetail"))}</p><div class="country-heading"><span class="country-flag">${flagEmoji(row.iso3)}</span><h2>${esc(row.displayCountry)}</h2></div><div class="score-lockup"><span>${esc(state.lang === "ru" ? "Индекс" : "Index")}</span><strong>${fmt1(row.score)}</strong><small>${fmt1(row.low)}–${fmt1(row.high)}</small></div><div class="badge-row"><span class="badge ${row.reliability === "moderate" || row.reliability === "high" ? "verified" : ""}">${esc(state.lang === "ru" ? "Надёжность" : "Reliability")}: ${esc(reliabilityLabel(row.reliability))}</span><span class="badge">${esc(state.lang === "ru" ? "Покрытие" : "Coverage")}: ${pct(100 * row.coverage)}</span></div><dl class="definition-list"><div><dt>${esc(state.lang === "ru" ? "Доступные компоненты" : "Available components")}</dt><dd>${esc(componentLabel(row.componentsAvailable))}</dd></div><div><dt>${esc(state.lang === "ru" ? "Отсутствующие компоненты" : "Missing components")}</dt><dd>${esc(componentLabel(row.componentsMissing))}</dd></div><div><dt>${esc(state.lang === "ru" ? "Точный ранг" : "Point rank")}</dt><dd>${esc(state.lang === "ru" ? "Скрыт при неидентифицируемом интервале ранга" : "Hidden when the rank interval is not identifiable")}</dd></div></dl>`;
  }

  async function renderFriendlinessPage() {
    await loadCommon();
    const rawRows = await loadCsv("friendliness");
    const rows = rawRows.map((row) => ({
      ...row,
      score: num(row.friendliness_ex_ante_score),
      low: num(row.conservative_lower_bound),
      high: num(row.optimistic_upper_bound),
      coverage: num(row.component_coverage_score),
      reliability: row.evidence_reliability_class,
      displayCountry: localizedCountry(row.iso3, row.country),
      componentsAvailable: row.components_available,
      componentsMissing: row.components_missing,
    })).filter((row) => row.score > 0).sort((a, b) => b.score - a.score);
    const reliable = rows.filter((row) => ["high", "moderate"].includes(row.reliability));
    const survey = rows.filter((row) => String(row.survey_component_available).toLowerCase() === "true");
    const selectedDefault = reliable[0] || rows[0];
    state.selectedIso = selectedDefault?.iso3;
    const renderFilter = () => {
      const reliability = document.getElementById("friendlinessReliability")?.value || "all";
      const filtered = reliability === "all" ? rows : rows.filter((row) => row.reliability === reliability);
      const visible = filtered.slice(0, 35);
      document.getElementById("friendlinessTable").innerHTML = table(visible, [
        { label: t("country"), render: (row) => `${flagEmoji(row.iso3)} ${row.displayCountry}` },
        { label: state.lang === "ru" ? "Индекс" : "Index", render: (row) => fmt1(row.score), num: true },
        { label: state.lang === "ru" ? "Интервал" : "Bounds", render: (row) => `${fmt1(row.low)}–${fmt1(row.high)}`, num: true },
        { label: t("coverage"), render: (row) => pct(100 * row.coverage), num: true },
        { label: t("reliability"), render: (row) => reliabilityLabel(row.reliability) },
      ]);
      renderWorldMap("friendlinessMap", filtered, { isoKey: "iso3", valueKey: "score", labelKey: "displayCountry", selectedIso: state.selectedIso, onSelect: (row) => { state.selectedIso = row.iso3; document.getElementById("friendlinessCountry").value = row.iso3; renderFriendlinessSelection(rows, row.iso3); } });
      const uncertainty = visible.slice(0, 24).reverse();
      plot("friendlinessUncertainty", [{
        x: uncertainty.map((row) => row.score), y: uncertainty.map((row) => row.displayCountry), type: "scatter", mode: "markers", marker: { color: uncertainty.map((row) => row.coverage), colorscale: "Blues", cmin: 0, cmax: 1, size: 9, showscale: true, colorbar: { title: state.lang === "ru" ? "Покрытие" : "Coverage", thickness: 10 } },
        error_x: { type: "data", symmetric: false, array: uncertainty.map((row) => row.high - row.score), arrayminus: uncertainty.map((row) => row.score - row.low), color: "#93a7bc", thickness: 1.2, width: 3 }, hovertemplate: "%{y}<br>%{x:.1f}<extra></extra>",
      }], { xaxis: { range: [0,100], title: state.lang === "ru" ? "Индекс и границы" : "Index and bounds" }, yaxis: { automargin: true }, margin: { l: 150, r: 60, t: 14, b: 42 } });
    };
    $("#app").innerHTML = `
      ${pageHero({
        kicker: state.lang === "ru" ? "Задача 5.2.5 · доказательный профиль страны" : "Task 5.2.5 · country evidence profile",
        title: t("friendlinessTitle"),
        note: t("friendlinessNotice"),
        evidenceTitle: state.lang === "ru" ? "Политика интерпретации" : "Interpretation policy",
        evidenceValue: state.lang === "ru" ? "Интервалы и покрытие вместо ложной точности" : "Bounds and coverage instead of false precision",
        evidenceNote: state.lang === "ru" ? "Фактический контингент студентов исключён из ex-ante индекса и показан только как описательный исход." : "Observed student stock is excluded from the ex-ante index and shown only as a descriptive outcome.",
      })}
      <section class="kpi-strip">
        ${kpi(state.lang === "ru" ? "Стран в профиле" : "Countries profiled", fmt0(rows.length), state.lang === "ru" ? "без обязательного точного ранга" : "without mandatory point ranks")}
        ${kpi(state.lang === "ru" ? "Надёжность не ниже средней" : "Moderate/high reliability", fmt0(reliable.length), state.lang === "ru" ? "достаточно для осторожного сравнения" : "usable for cautious comparison")}
        ${kpi(state.lang === "ru" ? "Есть опросный компонент" : "Survey component available", fmt0(survey.length), state.lang === "ru" ? "международные опросы" : "international surveys")}
        ${kpi(state.lang === "ru" ? "Медианное покрытие" : "Median coverage", pct(100 * rows.map((row)=>row.coverage).sort((a,b)=>a-b)[Math.floor(rows.length/2)]), state.lang === "ru" ? "доля плановых весов" : "share of planned weights")}
        ${kpi(state.lang === "ru" ? "Точный ранг" : "Point rank", state.lang === "ru" ? "скрыт" : "hidden", state.lang === "ru" ? "если интервал неидентифицируем" : "when interval is not identifiable")}
      </section>
      <section class="filter-toolbar">
        <label class="control-field"><span>${esc(t("country"))}</span><select id="friendlinessCountry">${rows.slice().sort((a,b)=>a.displayCountry.localeCompare(b.displayCountry)).map((row) => `<option value="${row.iso3}" ${row.iso3 === state.selectedIso ? "selected" : ""}>${esc(row.displayCountry)}</option>`).join("")}</select></label>
        <label class="control-field"><span>${esc(t("reliability"))}</span><select id="friendlinessReliability"><option value="all">${esc(t("all"))}</option><option value="moderate">${esc(reliabilityLabel("moderate"))}</option><option value="low">${esc(reliabilityLabel("low"))}</option><option value="limited">${esc(reliabilityLabel("limited"))}</option></select></label>
        <div></div><div></div>${sourceButton()}
      </section>
      <section class="dashboard-grid">
        <section class="panel"><div class="pane-header"><div><h2>${esc(state.lang === "ru" ? "Карта образовательной восприимчивости" : "Educational-receptivity map")}</h2>${scaleLegend()}</div><span class="badge modelled">ex ante</span></div><div id="friendlinessMap" class="map map-tall"></div></section>
        <section class="panel"><div class="pane-header"><div><h2>${esc(state.lang === "ru" ? "Сопоставимые профили" : "Comparable profiles")}</h2><p>${esc(state.lang === "ru" ? "Сортировка по точечной оценке не заменяет анализ интервала." : "Sorting by point estimate does not replace bound analysis.")}</p></div></div><div id="friendlinessTable"></div></section>
        <aside id="friendlinessDetail" class="panel detail-panel"></aside>
      </section>
      <section class="analysis-grid">
        <section class="panel span-8"><div class="pane-header"><div><h2>${esc(state.lang === "ru" ? "Неопределённость страновых профилей" : "Country-profile uncertainty")}</h2><p>${esc(state.lang === "ru" ? "Ширина линии показывает диапазон при отсутствующих компонентах; цвет точки — покрытие." : "Line width reflects missing-component bounds; point color shows coverage.")}</p></div></div><div id="friendlinessUncertainty" class="chart"></div></section>
        <section class="panel span-4"><h2>${esc(state.lang === "ru" ? "Компоненты индекса" : "Index components")}</h2><div class="component-list"><article><span>01</span><strong>${esc(state.lang === "ru" ? "Отношение к России" : "Attitudes to Russia")}</strong><small>${esc(state.lang === "ru" ? "международные опросы, где доступны" : "international surveys where available")}</small></article><article><span>02</span><strong>${esc(state.lang === "ru" ? "Дипломатическая согласованность" : "Diplomatic alignment")}</strong><small>${esc(state.lang === "ru" ? "голосования ГА ООН" : "UN General Assembly voting")}</small></article><article><span>03</span><strong>${esc(state.lang === "ru" ? "Институциональные связи" : "Institutional ties")}</strong><small>MGIMO</small></article><article><span>04</span><strong>${esc(state.lang === "ru" ? "Русскоязычная среда" : "Russian-language environment")}</strong><small>CLDR</small></article><article><span>05</span><strong>${esc(state.lang === "ru" ? "Правовой доступ" : "Policy access")}</strong><small>${esc(state.lang === "ru" ? "проверяемые институциональные данные" : "verified institutional data")}</small></article></div></section>
      </section>`;
    document.getElementById("friendlinessCountry")?.addEventListener("change", (event) => { state.selectedIso = event.target.value; renderFriendlinessSelection(rows, state.selectedIso); });
    document.getElementById("friendlinessReliability")?.addEventListener("change", renderFilter);
    bindCommon();
    renderFriendlinessSelection(rows, state.selectedIso);
    renderFilter();
  }

  async function renderForecastPage() {
    const payload = await loadCommon();
    const rows = await loadCsv("forecast");
    const years = [...new Set(rows.map((row) => Number(row.year)).filter(Boolean))].sort((a, b) => a - b);
    const scenarios = {
      constrained: { key: "potential_students_constrained", ru: "Сдержанный", en: "Constrained" },
      demographic: { key: "potential_students_demographic", ru: "Демографический", en: "Demographic" },
      accelerated: { key: "potential_students_accelerated", ru: "Ускоренный", en: "Accelerated" },
    };
    state.selectedYear = 2050;
    state.forecastScenario = "demographic";
    const scenarioLabel = (id) => scenarios[id]?.[state.lang] || id;
    const valueOf = (row) => num(row[scenarios[state.forecastScenario].key] || row.potential_students);
    const totalsByScenario = Object.fromEntries(Object.entries(scenarios).map(([id, meta]) => [id, years.map((year) => ({ year, value: rows.filter((row) => Number(row.year) === year).reduce((sum, row) => sum + num(row[meta.key] || row.potential_students), 0) }))]));

    const renderCountryDetail = (row) => {
      const target = document.getElementById("forecastDetail");
      if (!target || !row) return;
      const country = localizedCountry(row.origin_iso3, row.origin_country);
      target.innerHTML = `<p class="panel-kicker">${esc(t("countryDetail"))}</p><div class="country-heading"><span class="country-flag">${flagEmoji(row.origin_iso3)}</span><h2>${esc(country)}</h2></div><div class="score-lockup"><span>${esc(scenarioLabel(state.forecastScenario))}</span><strong>${fmt0(valueOf(row))}</strong><small>${esc(state.lang === "ru" ? "эквивалент структурной ёмкости" : "structural capacity equivalent")}</small></div><div class="badge-row"><span class="badge modelled">${esc(t("modelled"))}</span><span class="badge">95%: ${fmt0(row.capacity_parameter_interval_low)}–${fmt0(row.capacity_parameter_interval_high)}</span><span class="badge">P(${esc(state.lang === "ru" ? "разрыв > 0" : "gap > 0")}): ${pct(100 * num(row.probability_positive_representation_gap))}</span></div><p class="decision-summary">${esc(state.lang === "ru" ? "Это сценарная структурная ёмкость при заданной совокупной траектории России, а не обещанное число будущих зачислений." : "This is scenario-based structural capacity under an assumed Russia-wide path, not a promised number of future enrolments.")}</p>${passportCard(row, t("passport"))}`;
      bindCommon();
    };

    const renderYear = () => {
      const selected = rows.filter((row) => Number(row.year) === Number(state.selectedYear)).map((row) => ({ ...row, displayCountry: localizedCountry(row.origin_iso3, row.origin_country), scenarioValue: valueOf(row) })).sort((a, b) => b.scenarioValue - a.scenarioValue);
      const leader = selected[0];
      const total = selected.reduce((sum, row) => sum + row.scenarioValue, 0);
      document.getElementById("forecastTotal").textContent = fmt0(total);
      document.getElementById("forecastLeader").textContent = leader?.displayCountry || missingLabel();
      document.getElementById("forecastLeaderValue").textContent = leader ? `${fmt0(leader.scenarioValue)} · 95% ${fmt0(leader.capacity_parameter_interval_low)}–${fmt0(leader.capacity_parameter_interval_high)}` : missingLabel();
      document.getElementById("forecastScenarioKpi").textContent = scenarioLabel(state.forecastScenario);
      document.getElementById("forecastTop").innerHTML = table(selected.slice(0, 18), [
        { label: state.lang === "ru" ? "Порядок" : "Order", render: (_, index) => index + 1, num: true },
        { label: t("country"), render: (row) => `${flagEmoji(row.origin_iso3)} ${row.displayCountry}` },
        { label: state.lang === "ru" ? "Сценарная ёмкость" : "Scenario capacity", render: (row) => fmt0(row.scenarioValue), num: true },
        { label: state.lang === "ru" ? "Интервал параметров" : "Parameter interval", render: (row) => `${fmt0(row.capacity_parameter_interval_low)}–${fmt0(row.capacity_parameter_interval_high)}`, num: true },
      ], { label: state.lang === "ru" ? "Страны по сценарной ёмкости" : "Countries by scenario capacity" });
      renderWorldMap("forecastMap", selected.slice(0, 160), { isoKey: "origin_iso3", valueKey: "scenarioValue", labelKey: "displayCountry", selectedIso: leader?.origin_iso3, onSelect: renderCountryDetail });
      renderHorizontalBar("forecastBarChart", selected, "displayCountry", "scenarioValue", state.lang === "ru" ? "Сценарная ёмкость" : "Scenario capacity");
      renderCountryDetail(leader);
    };

    $("#app").innerHTML = `
      ${pageHero({
        kicker: state.lang === "ru" ? "Задача 5.2.7 · сценарии до 2050 года" : "Task 5.2.7 · scenarios to 2050",
        title: t("forecastTitle"),
        note: t("forecastNotice"),
        evidenceTitle: state.lang === "ru" ? "Три траектории общей ёмкости" : "Three aggregate-capacity paths",
        evidenceValue: state.lang === "ru" ? "Сдержанная · демографическая · ускоренная" : "Constrained · demographic · accelerated",
        evidenceNote: state.lang === "ru" ? "PPML распределяет заданную совокупную ёмкость между странами; 600 симуляций отражают неопределённость коэффициентов." : "PPML allocates an assumed aggregate capacity across countries; 600 simulations reflect coefficient uncertainty.",
      })}
      <section class="scenario-toolbar">
        <div class="scenario-switch" role="group" aria-label="${esc(t("scenario"))}">${Object.keys(scenarios).map((id) => `<button type="button" data-forecast-scenario="${id}" class="${id === state.forecastScenario ? "active" : ""}">${esc(scenarioLabel(id))}</button>`).join("")}</div>
        <div class="timeline"><div class="timeline-years"><span>${years[0]}</span><strong id="forecastSelectedYear">${state.selectedYear}</strong><span>${years.at(-1)}</span></div><input id="forecastYear" type="range" min="${years[0]}" max="${years.at(-1)}" value="${state.selectedYear}" step="1" aria-label="${esc(state.lang === "ru" ? "Год сценария" : "Scenario year")}"></div>
      </section>
      <section class="kpi-strip">
        <article class="kpi"><span>${esc(state.lang === "ru" ? "Совокупная ёмкость" : "Aggregate capacity")}</span><strong id="forecastTotal">—</strong><small>${esc(state.lang === "ru" ? "выбранный год и сценарий" : "selected year and scenario")}</small></article>
        <article class="kpi"><span>${esc(state.lang === "ru" ? "Максимум центральной оценки" : "Highest central estimate")}</span><strong id="forecastLeader">—</strong><small id="forecastLeaderValue">—</small></article>
        <article class="kpi"><span>${esc(state.lang === "ru" ? "Текущий сценарий" : "Current scenario")}</span><strong id="forecastScenarioKpi">—</strong><small>${esc(state.lang === "ru" ? "анализ чувствительности" : "sensitivity analysis")}</small></article>
        ${kpi(state.lang === "ru" ? "Страновых рядов" : "Country series", fmt0(new Set(rows.map((row) => row.origin_iso3)).size), `${years[0]}–${years.at(-1)}`)}
        ${kpi(state.lang === "ru" ? "Симуляций" : "Parameter draws", fmt0(payload.gravityModel.forecast_uncertainty?.parameter_draws), state.lang === "ru" ? "ковариация коэффициентов" : "coefficient covariance")}
      </section>
      <section class="dashboard-grid">
        <section class="panel"><div class="pane-header"><div><h2>${esc(state.lang === "ru" ? "Карта сценарной ёмкости" : "Scenario-capacity map")}</h2>${scaleLegend()}</div><span class="badge modelled">PPML</span></div><div id="forecastMap" class="map map-tall"></div></section>
        <section class="panel ranking-panel"><div class="pane-header"><div><h2>${esc(t("forecastTop"))}</h2><p>${esc(state.lang === "ru" ? "Порядок строится по центральной сценарной оценке; перекрывающиеся интервалы не доказывают устойчивый ранг." : "The order uses the central scenario estimate; overlapping intervals do not establish rank stability.")}</p></div></div><div id="forecastTop"></div></section>
        <aside class="panel detail-panel" id="forecastDetail"></aside>
      </section>
      <section class="analysis-grid">
        <section class="panel span-7"><div class="pane-header"><div><h2>${esc(state.lang === "ru" ? "Совокупные траектории России" : "Russia-wide aggregate paths")}</h2><p>${esc(state.lang === "ru" ? "Сравнение трёх допущений о динамике общей ёмкости." : "Comparison of three assumptions about aggregate capacity.")}</p></div></div><div id="forecastTrendChart" class="chart"></div></section>
        <section class="panel span-5"><div class="pane-header"><div><h2>${esc(state.lang === "ru" ? "Верхние значения выбранного среза" : "Highest values in the selected slice")}</h2><p>${esc(state.lang === "ru" ? "Значения являются эквивалентом структурной ёмкости; порядок не является устойчивым рангом без учёта интервалов." : "Values are structural capacity equivalents; the order is not a stable rank without interval review.")}</p></div></div><div id="forecastBarChart" class="chart"></div></section>
        <section class="panel span-12"><h2>${esc(state.lang === "ru" ? "Как читать прогноз" : "How to read the forecast")}</h2><div class="interpretation-grid"><article><strong>${esc(state.lang === "ru" ? "Меняется" : "Varies")}</strong><p>${esc(state.lang === "ru" ? "Демографический образовательный пул и общая сценарная ёмкость России." : "Demographic education pool and Russia-wide scenario capacity.")}</p></article><article><strong>${esc(state.lang === "ru" ? "Фиксируется" : "Held constant")}</strong><p>${esc(state.lang === "ru" ? "Последние наблюдаемые значения мобильности, высшего образования и дипломатической согласованности." : "Latest observed mobility, tertiary and diplomatic-alignment covariates.")}</p></article><article><strong>${esc(state.lang === "ru" ? "Не утверждается" : "Not claimed")}</strong><p>${esc(state.lang === "ru" ? "Гарантированное число будущих студентов или причинный эффект кампании." : "Guaranteed future student counts or causal campaign effects.")}</p></article></div>${downloadLinks(payload.downloads)}</section>
      </section>`;
    document.querySelectorAll("[data-forecast-scenario]").forEach((button) => button.addEventListener("click", () => {
      state.forecastScenario = button.dataset.forecastScenario;
      document.querySelectorAll("[data-forecast-scenario]").forEach((item) => item.classList.toggle("active", item === button));
      renderYear();
    }));
    document.getElementById("forecastYear").addEventListener("input", (event) => { state.selectedYear = Number(event.target.value); document.getElementById("forecastSelectedYear").textContent = state.selectedYear; renderYear(); });
    plot("forecastTrendChart", Object.entries(totalsByScenario).map(([id, series], index) => ({ x: series.map((row) => row.year), y: series.map((row) => row.value), type: "scatter", mode: "lines", name: scenarioLabel(id), line: { width: id === "demographic" ? 4 : 2, dash: id === "demographic" ? "solid" : "dot", color: ["#718096", "#0b4f8a", "#16775d"][index] } })), { yaxis: { title: state.lang === "ru" ? "Эквивалент ёмкости" : "Capacity equivalent", separatethousands: true }, legend: { orientation: "h", y: 1.12 } });
    bindCommon();
    renderYear();
  }

  async function renderGapPage() {
    const payload = await loadCommon();
    const rows = (await loadCsv("gap"))
      .filter((row) => String(row.excluded_from_rank).toLowerCase() !== "true")
      .map((row) => ({ ...row, displayCountry: localizedCountry(row.origin_iso3, row.origin_country) }));
    const robust = rows
      .filter((row) => num(row.probability_positive_representation_gap) >= .8 && num(row.gap_parameter_q50 || row.gap_abs) > 0)
      .sort((a, b) => {
        const rankA = Number(a.rank_robust_unrealized_potential);
        const rankB = Number(b.rank_robust_unrealized_potential);
        if (Number.isFinite(rankA) && rankA > 0 && Number.isFinite(rankB) && rankB > 0) return rankA - rankB;
        if (Number.isFinite(rankA) && rankA > 0) return -1;
        if (Number.isFinite(rankB) && rankB > 0) return 1;
        return num(b.gap_parameter_q50 || b.gap_abs) - num(a.gap_parameter_q50 || a.gap_abs);
      });
    const selected = robust[0] || rows.slice().sort((a, b) => num(b.gap_parameter_q50 || b.gap_abs) - num(a.gap_parameter_q50 || a.gap_abs))[0];
    const totalPositiveMedian = rows.reduce((sum, row) => sum + Math.max(0, num(row.gap_parameter_q50 || row.gap_abs)), 0);
    const updateSelection = (row) => {
      if (!row) return;
      state.selectedIso = row.origin_iso3;
      document.getElementById("gapDetail").innerHTML = detailCountry({ ...row, origin_country: row.displayCountry });
      document.getElementById("gapPassport").innerHTML = passportCard(row, t("passport"));
      renderGapWaterfall(row);
      bindCommon();
    };
    $("#app").innerHTML = `
      ${pageHero({
        kicker: state.lang === "ru" ? "Задача 5.2.8 · факт против структурной ёмкости" : "Task 5.2.8 · observed stock vs structural capacity",
        title: t("gapTitle"),
        note: t("gapNotice"),
        evidenceTitle: state.lang === "ru" ? "Критерий устойчивости" : "Robustness criterion",
        evidenceValue: state.lang === "ru" ? "Вероятность положительного разрыва" : "Probability of a positive gap",
        evidenceNote: state.lang === "ru" ? "Ранг строится только по проверенному факту UIS и 600 совместным симуляциям коэффициентов." : "Ranks use verified UIS actuals and 600 joint coefficient simulations only.",
      })}
      <section class="kpi-strip">
        ${kpi(state.lang === "ru" ? "Стран в оценке" : "Countries assessed", fmt0(rows.length), state.lang === "ru" ? "после формальных исключений" : "after formal exclusions")}
        ${kpi(state.lang === "ru" ? "Устойчиво положительный разрыв" : "Robust positive gap", fmt0(robust.length), "P > 80%")}
        ${kpi(state.lang === "ru" ? "Сумма медианных положительных разрывов" : "Sum of positive median gaps", fmt0(totalPositiveMedian), state.lang === "ru" ? "эквивалент структурной ёмкости" : "structural capacity equivalent")}
        ${kpi(state.lang === "ru" ? "Последний фактический срез" : "Latest factual slice", String(payload.russiaInbound.latestYear), "UNESCO UIS")}
        ${kpi(state.lang === "ru" ? "Симуляций" : "Simulations", fmt0(payload.gravityModel.forecast_uncertainty?.parameter_draws), state.lang === "ru" ? "параметрическая неопределённость" : "parameter uncertainty")}
      </section>
      <section class="dashboard-grid">
        <section class="panel"><div class="pane-header"><div><h2>${esc(state.lang === "ru" ? "Карта нереализованного потенциала" : "Unrealized-potential map")}</h2>${scaleLegend()}</div><div class="badge-row"><span class="badge verified">UIS</span><span class="badge modelled">PPML</span></div></div><div id="gapMap" class="map map-tall"></div></section>
        <section class="panel ranking-panel"><div class="pane-header"><div><h2>${esc(state.lang === "ru" ? "Приоритеты по устойчивому разрыву" : "Priorities by robust gap")}</h2><p>${esc(state.lang === "ru" ? "Показаны вероятность знака и медиана распределения, а не только точечная оценка." : "Sign probability and distribution median are shown, not only a point estimate.")}</p></div></div><div id="gapRanking">${table(robust.slice(0, 24), [
          { label: t("rank"), render: (row) => fmt0(row.rank_robust_unrealized_potential || row.rank_unrealized_potential), num: true },
          { label: t("country"), render: (row) => `${flagEmoji(row.origin_iso3)} ${row.displayCountry}` },
          { label: state.lang === "ru" ? "Факт" : "Actual", render: (row) => fmt0(row.actual_students_latest), num: true },
          { label: state.lang === "ru" ? "Медиана разрыва" : "Median gap", render: (row) => fmt0(row.gap_parameter_q50 || row.gap_abs), num: true },
          { label: state.lang === "ru" ? "Вероятность" : "Probability", render: (row) => pct(100 * num(row.probability_positive_representation_gap)), num: true },
        ])}</div></section>
        <aside class="panel detail-panel" id="gapDetail"></aside>
      </section>
      <section class="analysis-grid">
        <section class="panel span-7"><div class="pane-header"><div><h2>${esc(state.lang === "ru" ? "Квадрант «факт — структурная ёмкость»" : "Actual–structural-capacity quadrant")}</h2><p>${esc(state.lang === "ru" ? "Точки выше диагонали имеют положительную структурную недопредставленность." : "Points above the diagonal have positive structural under-representation.")}</p></div></div><div id="gapScatter" class="chart"></div></section>
        <section class="panel span-5"><div class="pane-header"><div><h2>${esc(state.lang === "ru" ? "Декомпозиция выбранной страны" : "Selected-country decomposition")}</h2><p>${esc(state.lang === "ru" ? "Факт плюс разрыв образуют структурную ёмкость." : "Actual stock plus the gap form structural capacity.")}</p></div></div><div id="gapWaterfall" class="chart small"></div></section>
        <section class="panel span-12" id="gapPassport"></section>
      </section>`;
    document.querySelectorAll("#gapRanking tbody tr").forEach((tr) => tr.addEventListener("click", () => updateSelection(robust[Number(tr.dataset.rowIndex)])));
    renderWorldMap("gapMap", rows, { isoKey: "origin_iso3", valueKey: "gap_abs", labelKey: "displayCountry", selectedIso: selected.origin_iso3, onSelect: updateSelection });
    const maxAxis = Math.max(...rows.flatMap((row) => [num(row.actual_students_latest), num(row.model_based_attraction_capacity || row.potential_students)]));
    plot("gapScatter", [
      { x: [0, maxAxis], y: [0, maxAxis], type: "scatter", mode: "lines", name: state.lang === "ru" ? "Факт = ёмкость" : "Actual = capacity", line: { color: "#94a3b8", dash: "dot" }, hoverinfo: "skip" },
      { x: rows.map((row) => num(row.actual_students_latest)), y: rows.map((row) => num(row.model_based_attraction_capacity || row.potential_students)), mode: "markers", type: "scatter", name: state.lang === "ru" ? "Страны" : "Countries", text: rows.map((row) => row.displayCountry), marker: { size: rows.map((row) => Math.max(7, Math.min(24, Math.sqrt(Math.max(0, num(row.gap_abs))) / 5))), color: rows.map((row) => num(row.probability_positive_representation_gap)), colorscale: "Blues", cmin: 0, cmax: 1, showscale: true, colorbar: { title: "P+", thickness: 10 }, opacity: .8, line: { color: "#fff", width: 1 } }, hovertemplate: "%{text}<br>" + (state.lang === "ru" ? "Факт" : "Actual") + ": %{x:,.0f}<br>" + (state.lang === "ru" ? "Ёмкость" : "Capacity") + ": %{y:,.0f}<extra></extra>" },
    ], { xaxis: { title: t("fact"), type: "log" }, yaxis: { title: t("potential"), type: "log" }, legend: { orientation: "h", y: 1.12 } });
    bindCommon();
    updateSelection(selected);
  }

  function renderGapWaterfall(row) {
    plot("gapWaterfall", [{ type: "waterfall", x: [t("fact"), t("gap"), t("potential")], y: [num(row.actual_students_latest), num(row.gap_abs), 0], measure: ["absolute", "relative", "total"], marker: { color: ["#217346", "#d6a51f", "#0b4f8a"] } }]);
  }

  async function renderMatrixPage() {
    await loadCommon();
    const rows = (await loadCsv("matrix")).map((row) => ({
      ...row,
      displayCountry: localizedCountry(row.iso3, row.country),
      displayProgram: programLabel(row),
      displayTier: decisionTierLabel(row.priority_decision_tier),
      displayInstrument: recruitmentInstrumentLabel(row.recruitment_instrument),
      displayLanguage: languageLabel(row.teaching_language),
    })).sort((a, b) => num(a.rank_country_program_priority) - num(b.rank_country_program_priority));
    const byProgram = Object.values(rows.reduce((acc, row) => {
      const key = row.program_group;
      acc[key] = acc[key] || { program_group: key, displayProgram: row.displayProgram, program_labor_demand_score: num(row.program_labor_demand_score), rows: 0, combined: 0 };
      acc[key].rows += 1;
      acc[key].combined += num(row.combined_country_program_priority_score);
      return acc;
    }, {})).map((row) => ({ ...row, average_combined_priority: row.combined / Math.max(1, row.rows) })).sort((a, b) => b.program_labor_demand_score - a.program_labor_demand_score);
    const tierCounts = Object.entries(rows.reduce((acc, row) => { acc[row.priority_decision_tier] = (acc[row.priority_decision_tier] || 0) + 1; return acc; }, {}));

    const recommendationCards = (filtered) => `<div class="recommendation-grid">${filtered.slice(0, 9).map((row) => `<article class="recommendation-card"><header><div><p class="section-kicker">${esc(row.displayTier)}</p><h3>${flagEmoji(row.iso3)} ${esc(row.displayCountry)}</h3></div><span class="score-pill">${fmt1(row.combined_country_program_priority_score)}</span></header><p class="recommendation-program">${esc(row.displayProgram)}</p><dl><dt>${esc(state.lang === "ru" ? "Язык" : "Language")}</dt><dd>${esc(row.displayLanguage)}</dd><dt>${esc(state.lang === "ru" ? "Инструмент" : "Instrument")}</dt><dd>${esc(row.displayInstrument)}</dd><dt>${esc(state.lang === "ru" ? "Доказательный диапазон" : "Evidence range")}</dt><dd>${fmt1(row.priority_evidence_low)}–${fmt1(row.priority_evidence_high)}</dd><dt>${esc(state.lang === "ru" ? "Вероятность разрыва" : "Gap probability")}</dt><dd>${pct(100 * num(row.probability_positive_representation_gap))}</dd></dl><p class="evaluation-note">${esc(state.lang === "ru" ? "Числовой эффект не заявляется: требуется проспективная оценка кампании." : "No numerical effect is claimed: prospective campaign evaluation is required.")}</p></article>`).join("")}</div>`;

    const matrixTableHtml = (filtered) => table(filtered.slice(0, 100), [
      { label: t("rank"), render: (row) => row.rank_country_program_priority, num: true },
      { label: t("country"), render: (row) => `${flagEmoji(row.iso3)} ${row.displayCountry}` },
      { label: state.lang === "ru" ? "Программа" : "Program", render: (row) => row.displayProgram },
      { label: state.lang === "ru" ? "Индекс" : "Index", render: (row) => fmt1(row.combined_country_program_priority_score), num: true },
      { label: state.lang === "ru" ? "Диапазон" : "Range", render: (row) => `${fmt1(row.priority_evidence_low)}–${fmt1(row.priority_evidence_high)}`, num: true },
      { label: state.lang === "ru" ? "Класс решения" : "Decision tier", render: (row) => row.displayTier },
      { label: state.lang === "ru" ? "Инструмент" : "Instrument", render: (row) => row.displayInstrument },
    ], { label: state.lang === "ru" ? "Полная стратегическая матрица" : "Full strategic matrix" });

    $("#app").innerHTML = `
      ${pageHero({
        kicker: state.lang === "ru" ? "Задача 5.2.9 · управленческий синтез" : "Task 5.2.9 · management synthesis",
        title: t("matrixTitle"),
        note: state.lang === "ru" ? "Страновая возможность, восприимчивость, программное соответствие и спрос по отдельным вакансиям «Работы в России» объединены в прозрачный сценарный индекс." : "Country opportunity, receptivity, program fit and record-level Jobs in Russia demand are combined in a transparent scenario index.",
        evidenceTitle: state.lang === "ru" ? "Ожидаемый эффект" : "Expected effect",
        evidenceValue: state.lang === "ru" ? "Не определён до проведения пилота" : "Not identified ex ante",
        evidenceNote: state.lang === "ru" ? "Платформа рекомендует дизайн пилота и KPI, но не выдумывает прирост набора." : "The platform recommends a pilot design and KPIs but does not invent an enrolment uplift.",
      })}
      <section class="kpi-strip">
        ${kpi(state.lang === "ru" ? "Комбинаций" : "Combinations", fmt0(rows.length), state.lang === "ru" ? "страна × программа" : "country × program")}
        ${kpi(state.lang === "ru" ? "Стран" : "Countries", fmt0(new Set(rows.map((row) => row.iso3)).size), state.lang === "ru" ? "с доступными входами" : "with available inputs")}
        ${kpi(state.lang === "ru" ? "Групп программ" : "Program groups", fmt0(byProgram.length), state.lang === "ru" ? "привязаны к трудовому спросу" : "linked to labor demand")}
        ${kpi(state.lang === "ru" ? "Классов решений" : "Decision tiers", fmt0(tierCounts.length), tierCounts.map(([tier,count]) => `${decisionTierLabel(tier)}: ${count}`).join(" · "))}
        ${kpi(state.lang === "ru" ? "Лидер" : "Leader", rows[0]?.displayCountry || missingLabel(), rows[0]?.displayProgram || "")}
      </section>
      <section class="filter-toolbar">
        <label class="control-field"><span>${esc(t("search"))}</span><input id="matrixSearch" type="search" placeholder="${esc(state.lang === "ru" ? "Страна, программа или инструмент" : "Country, program or instrument")}"></label>
        <label class="control-field"><span>${esc(state.lang === "ru" ? "Группа программ" : "Program group")}</span><select id="matrixProgram"><option value="">${esc(t("all"))}</option>${byProgram.map((row) => `<option value="${esc(row.program_group)}">${esc(row.displayProgram)}</option>`).join("")}</select></label>
        <label class="control-field"><span>${esc(state.lang === "ru" ? "Класс решения" : "Decision tier")}</span><select id="matrixTier"><option value="">${esc(t("all"))}</option>${tierCounts.map(([tier]) => `<option value="${esc(tier)}">${esc(decisionTierLabel(tier))}</option>`).join("")}</select></label>
        <label class="control-field"><span>${esc(state.lang === "ru" ? "Языковая политика" : "Language policy")}</span><select disabled><option>${esc(state.lang === "ru" ? "Проверяемая рекомендация в каждой строке" : "Verified recommendation per row")}</option></select></label>
        <button id="matrixReset" class="reset-button" type="button">${esc(t("reset"))}</button>
      </section>
      <section class="analysis-grid">
        <section class="panel span-12"><div class="pane-header"><div><h2>${esc(state.lang === "ru" ? "Рекомендуемые комбинации для проверки" : "Recommended combinations for validation")}</h2><p>${esc(state.lang === "ru" ? "Карточки показывают не обещание результата, а наиболее устойчивые управленческие гипотезы." : "Cards show the most robust management hypotheses, not promised outcomes.")}</p></div><span class="badge modelled">v5</span></div><div id="matrixCards">${recommendationCards(rows)}</div></section>
        <section class="panel span-7"><div class="pane-header"><div><h2>${esc(state.lang === "ru" ? "Связь страны, программы и инструмента" : "Country–program–instrument links")}</h2><p>${esc(state.lang === "ru" ? "Диаграмма ограничена верхними строками после фильтрации." : "The diagram is limited to the leading filtered rows.")}</p></div></div><div id="matrixSankey" class="chart"></div></section>
        <section class="panel span-5"><div class="pane-header"><div><h2>${esc(t("laborDemandSignal"))}</h2><p>${esc(state.lang === "ru" ? "Относительный индекс по отдельным вакансиям, а не сумма поисковых результатов." : "A relative record-level index, not a sum of query totals.")}</p></div></div><div id="matrixProgramBar" class="chart"></div></section>
        <section class="panel span-12"><details class="data-disclosure"><summary>${esc(state.lang === "ru" ? "Открыть полную таблицу и трассировку" : "Open full table and trace")}</summary><p class="model-warning">${esc(state.lang === "ru" ? "Заголовочный индекс — медиана четырёх сценариев; диапазон учитывает параметрическую неопределённость, пропуски, bootstrap трудового спроса и чувствительность к весам." : "The headline index is the median of four scenarios; its range incorporates parameter uncertainty, missingness, labor-demand bootstrap and weight sensitivity.")}</p><div id="matrixTable">${matrixTableHtml(rows)}</div></details></section>
      </section>`;

    const refresh = () => {
      const query = (document.getElementById("matrixSearch")?.value || "").trim().toLowerCase();
      const program = document.getElementById("matrixProgram")?.value || "";
      const tier = document.getElementById("matrixTier")?.value || "";
      const filtered = rows.filter((row) => {
        const queryOk = !query || [row.displayCountry, row.iso3, row.displayProgram, row.displayInstrument].join(" ").toLowerCase().includes(query);
        return queryOk && (!program || row.program_group === program) && (!tier || row.priority_decision_tier === tier);
      });
      document.getElementById("matrixCards").innerHTML = recommendationCards(filtered);
      document.getElementById("matrixTable").innerHTML = matrixTableHtml(filtered);
      renderMatrixSankey(filtered.slice(0, 18));
    };
    document.getElementById("matrixSearch").addEventListener("input", refresh);
    document.getElementById("matrixProgram").addEventListener("change", refresh);
    document.getElementById("matrixTier").addEventListener("change", refresh);
    document.getElementById("matrixReset").addEventListener("click", () => { document.getElementById("matrixSearch").value = ""; document.getElementById("matrixProgram").value = ""; document.getElementById("matrixTier").value = ""; refresh(); });
    renderHorizontalBar("matrixProgramBar", byProgram, "displayProgram", "program_labor_demand_score", t("laborDemandSignal"));
    renderMatrixSankey(rows.slice(0, 18));
    bindCommon();
  }

  function renderMatrixSankey(rows) {
    const target = document.getElementById("matrixSankey");
    if (!target) return;
    if (window.innerWidth < 700) {
      target.classList.add("matrix-mobile-links");
      target.innerHTML = rows.slice(0, 10).map((row) => `
        <article>
          <strong>${flagEmoji(row.iso3)} ${esc(row.displayCountry || localizedCountry(row.iso3, row.country))}</strong>
          <span>${esc(row.displayProgram || programLabel(row))}</span>
          <small>${esc(recruitmentInstrumentLabel(row.recruitment_instrument))}</small>
          <b>${fmt1(row.combined_country_program_priority_score || row.expected_effect_value)}</b>
        </article>`).join("");
      return;
    }
    target.classList.remove("matrix-mobile-links");
    target.innerHTML = "";
    const wrap = (value, width = 24) => {
      const words = String(value || "").split(/\s+/).filter(Boolean);
      const lines = [];
      let line = "";
      words.forEach((word) => {
        const next = line ? `${line} ${word}` : word;
        if (next.length > width && line) { lines.push(line); line = word; } else { line = next; }
      });
      if (line) lines.push(line);
      return lines.slice(0, 3).join("<br>");
    };
    const labels = [];
    const index = new Map();
    const add = (label) => {
      const plain = String(label || "");
      if (!index.has(plain)) {
        index.set(plain, labels.length);
        labels.push(wrap(plain));
      }
      return index.get(plain);
    };
    const links = new Map();
    rows.forEach((r) => {
      const a = add(r.displayCountry || localizedCountry(r.iso3, r.country));
      const b = add(r.displayProgram || programLabel(r));
      const c = add(r.displayInstrument || recruitmentInstrumentLabel(r.recruitment_instrument));
      const key1 = `${a}-${b}`;
      const key2 = `${b}-${c}`;
      links.set(key1, { source: a, target: b, value: (links.get(key1)?.value || 0) + Math.max(1, num(r.combined_country_program_priority_score || r.expected_effect_value)) });
      links.set(key2, { source: b, target: c, value: (links.get(key2)?.value || 0) + Math.max(1, num(r.combined_country_program_priority_score || r.expected_effect_value)) });
    });
    const arr = [...links.values()];
    plot("matrixSankey", [{ type: "sankey", arrangement: "snap", node: { label: labels, pad: 16, thickness: 13, line: { color: "rgba(255,255,255,.9)", width: 1 } }, link: { source: arr.map((x) => x.source), target: arr.map((x) => x.target), value: arr.map((x) => x.value) } }], { margin: { l: 6, r: 6, t: 8, b: 8 }, font: { size: 9, color: "#17233a" } });
  }

  async function renderVacanciesPage() {
    await loadCommon({ needGeo: true });
    const data = await getJson(DATA_URLS.trudvsemV2);
    const matrixRows = await loadCsv("matrix");
    const metadata = data.metadata || {};
    const snapshot = metadata.snapshot_metadata || {};
    const programs = (data.programDemand || []).map((row) => ({ ...row, displayProgram: programLabel(row) })).sort((a, b) => num(b.program_labor_demand_score) - num(a.program_labor_demand_score));
    const records = data.classifiedVacancySample || data.verifiedRecordSchemaSnapshot || [];
    const evidence = data.classificationEvidenceSample || data.skillRows || [];
    const evidenceFieldLabels = {
      job_name: { ru: "название вакансии", en: "job title" },
      skills: { ru: "явные навыки", en: "explicit skills" },
      requirements: { ru: "требования", en: "requirements" },
      duty: { ru: "обязанности", en: "duties" },
      qualification: { ru: "квалификация", en: "qualification" },
      professional_sphere: { ru: "профессиональная сфера", en: "professional sphere" },
      "job or typical position": { ru: "должность или типовая позиция", en: "job or typical position" },
      "record context": { ru: "контекст записи", en: "record context" },
      "explicit skills": { ru: "явно указанные навыки", en: "explicit skills" },
      job_or_typical_position: { ru: "должность или типовая позиция", en: "job or typical position" },
      record_context: { ru: "контекст записи", en: "record context" },
      explicit_skills: { ru: "явно указанные навыки", en: "explicit skills" },
    };
    const evidenceSummary = Object.values(evidence.reduce((acc, row) => {
      const key = row.evidence_field || row.skill_source || "other";
      acc[key] = acc[key] || { key, count: 0 };
      acc[key].count += 1;
      return acc;
    }, {})).sort((a, b) => b.count - a.count);
    const evidenceFieldLabel = (key) => evidenceFieldLabels[key]?.[state.lang] || String(key || "").replaceAll("_", " ");
    const priority = matrixRows.slice().map((row) => ({ ...row, displayCountry: localizedCountry(row.iso3, row.country), displayProgram: programLabel(row) })).sort((a, b) => num(a.rank_country_program_priority) - num(b.rank_country_program_priority));
    const signals = data.keywordSearchSignals || [];
    const classifiedShare = num(metadata.input_unique_vacancies) > 0 ? 100 * num(metadata.classified_unique_vacancies) / num(metadata.input_unique_vacancies) : 0;
    const totalProgramVacancies = programs.reduce((sum, row) => sum + num(row.classified_unique_vacancies || row.verified_fixture_vacancy_matches), 0);
    $("#app").innerHTML = `
      ${pageHero({
        kicker: state.lang === "ru" ? "Задача 5.2.6 · вакансии и компетенции" : "Task 5.2.6 · vacancies and competencies",
        title: t("vacanciesTitle"),
        note: state.lang === "ru" ? "Официальные обезличенные записи классифицируются на уровне вакансии. Результаты поисковых запросов используются только для диагностики доступа и не входят в итоговый индекс." : "Official sanitized records are classified at vacancy level. Query totals are access diagnostics only and do not enter the final index.",
        evidenceTitle: state.lang === "ru" ? "Рекордный уровень" : "Record-level evidence",
        evidenceValue: `${fmt0(metadata.input_unique_vacancies || snapshot.unique_vacancy_count)} ${state.lang === "ru" ? "уникальных вакансий" : "unique vacancies"}`,
        evidenceNote: state.lang === "ru" ? "Контактные лица, телефоны, email, ИНН, КПП, ОГРН и точные адреса удаляются до сохранения." : "Contact names, phones, email, tax identifiers and exact addresses are removed before storage.",
      })}
      <section class="kpi-strip">
        ${kpi(state.lang === "ru" ? "Уникальных обезличенных вакансий" : "Unique sanitized vacancies", fmt0(metadata.input_unique_vacancies || snapshot.unique_vacancy_count), snapshot.retrieved_at || metadata.retrieved_at || "")}
        ${kpi(state.lang === "ru" ? "Классифицированных вакансий" : "Classified vacancies", fmt0(metadata.classified_unique_vacancies), pct(classifiedShare))}
        ${kpi(state.lang === "ru" ? "Строк доказательств" : "Evidence rows", fmt0(metadata.classification_evidence_rows), state.lang === "ru" ? "поле + совпавший паттерн" : "field + matched pattern")}
        ${kpi(state.lang === "ru" ? "Групп программ" : "Program groups", fmt0(metadata.program_group_count || programs.length), state.lang === "ru" ? "фиксированная таксономия" : "fixed taxonomy")}
        ${kpi(state.lang === "ru" ? "Вакансий в программных группах" : "Vacancies in program groups", fmt0(totalProgramVacancies), state.lang === "ru" ? "сумма непересекающихся присвоений" : "sum of assigned records")}
      </section>
      <section class="analysis-grid">
        <section class="panel span-12"><div class="pane-header"><div><h2>${esc(state.lang === "ru" ? "Спрос по направлениям МГИМО" : "Demand across MGIMO program areas")}</h2><p>${esc(state.lang === "ru" ? "Балл отражает относительный спрос внутри тематического снимка и сопровождается бутстрэп-интервалом." : "The score reflects relative demand within the thematic snapshot and includes a bootstrap interval.")}</p></div><span class="badge verified">${esc(state.lang === "ru" ? "уровень вакансий" : "record-level")}</span></div><div class="program-demand-grid">${programs.map((row) => `<article class="program-demand-card"><h3>${esc(row.displayProgram)}</h3><strong>${fmt1(row.program_labor_demand_score)}</strong><small>${fmt1(row.labor_demand_score_p05)}–${fmt1(row.labor_demand_score_p95)}</small><div class="progress-track"><i style="width:${Math.max(2,Math.min(100,num(row.program_labor_demand_score)))}%"></i></div><dl><div><dt>${esc(state.lang === "ru" ? "Вакансий" : "Vacancies")}</dt><dd>${fmt0(row.classified_unique_vacancies || row.verified_fixture_vacancy_matches)}</dd></div><div><dt>${esc(state.lang === "ru" ? "Запросов" : "Queries")}</dt><dd>${fmt0(row.acquisition_query_count ?? row.query_count)}</dd></div></dl></article>`).join("")}</div></section>
        <section class="panel span-7"><div class="pane-header"><div><h2>${esc(state.lang === "ru" ? "Относительный индекс программного спроса" : "Relative program-demand index")}</h2><p>${esc(state.lang === "ru" ? "Поисковые количества не суммируются; используются подтверждённые классификации вакансий." : "Query counts are not summed; verified vacancy classifications are used.")}</p></div></div><div id="vacancyProgramBar" class="chart"></div></section>
        <section class="panel span-5"><div class="pane-header"><div><h2>${esc(state.lang === "ru" ? "Как устроена классификация" : "How classification works")}</h2><p>${esc(state.lang === "ru" ? "Консервативные правила требуют содержательного совпадения в названии, навыках, требованиях или обязанностях." : "Conservative rules require substantive evidence in title, skills, requirements or duties.")}</p></div></div><div class="decision-flow vertical-flow"><article><span>1</span><strong>${esc(state.lang === "ru" ? "Обезличенная вакансия" : "Sanitized vacancy")}</strong><small>record_code</small></article><article><span>2</span><strong>${esc(state.lang === "ru" ? "Поля доказательств" : "Evidence fields")}</strong><small>${esc(state.lang === "ru" ? "название · навыки · требования · обязанности" : "title · skills · requirements · duties")}</small></article><article><span>3</span><strong>${esc(state.lang === "ru" ? "Консервативная таксономия" : "Conservative taxonomy")}</strong><small>${esc(state.lang === "ru" ? "паттерн и исключающие правила" : "patterns and exclusion rules")}</small></article><article><span>4</span><strong>${esc(state.lang === "ru" ? "Программная группа" : "Program group")}</strong><small>${esc(state.lang === "ru" ? "с трассировкой каждой строки" : "with row-level trace")}</small></article></div></section>
        <section class="panel span-7"><div class="pane-header"><div><h2>${esc(state.lang === "ru" ? "Примеры официальных обезличенных записей" : "Examples of official sanitized records")}</h2><p>${esc(state.lang === "ru" ? "Публичный интерфейс показывает только безопасные аналитические поля; персональные и регистрационные данные удалены." : "The public interface shows safe analytical fields only; personal and registration data have been removed.")}</p></div></div>${table(records.slice(0, 12), [
          { label: state.lang === "ru" ? "Код записи" : "Record code", render: (row) => publicVacancyCode(row) },
          { label: state.lang === "ru" ? "Вакансия" : "Vacancy", render: (row) => safeVacancyField(row, "job_name") },
          { label: t("region"), render: (row) => safeVacancyField(row, "region_name") },
          { label: state.lang === "ru" ? "Сфера" : "Sphere", render: (row) => safeVacancyField(row, "professional_sphere") },
          { label: state.lang === "ru" ? "Образование" : "Education", render: (row) => safeVacancyField(row, "education") },
          { label: state.lang === "ru" ? "Зарплата от" : "Salary from", render: (row) => fmt0(row.salary_min), num: true },
        ], { label: state.lang === "ru" ? "Обезличенные вакансии" : "Sanitized vacancies" })}</section>
        <section class="panel span-5"><div class="pane-header"><div><h2>${esc(state.lang === "ru" ? "Доказательная трассировка" : "Evidence trace")}</h2><p>${esc(state.lang === "ru" ? "Распределение совпадений по полям вакансии; технические строки раскрываются по запросу." : "Distribution of matches across vacancy fields; technical rows are disclosed on demand.")}</p></div><span class="badge verified">${fmt0(metadata.classification_evidence_rows)}</span></div><div class="evidence-summary-list">${evidenceSummary.slice(0, 6).map((item) => `<div><span>${esc(evidenceFieldLabel(item.key))}</span><strong>${fmt0(item.count)}</strong></div>`).join("")}</div><details class="data-disclosure compact-disclosure"><summary>${esc(state.lang === "ru" ? "Показать примеры технической трассировки" : "Show technical trace examples")}</summary>${table(evidence.slice(0, 12), [
          { label: state.lang === "ru" ? "Код записи" : "Record code", render: (row) => publicVacancyCode(row) },
          { label: state.lang === "ru" ? "Поле" : "Field", render: (row) => evidenceFieldLabel(row.evidence_field || row.skill_source) },
          { label: state.lang === "ru" ? "Совпадение" : "Matched evidence", render: (row) => safeEvidenceMatch(row) },
        ], { label: state.lang === "ru" ? "Примеры трассировки классификации" : "Classification trace examples" })}</details></section>
        <section class="panel span-8"><div class="pane-header"><div><h2>${esc(state.lang === "ru" ? "Связь со стратегической матрицей" : "Link to the strategic matrix")}</h2><p>${esc(state.lang === "ru" ? "Трудовой спрос — один из компонентов управленческого индекса, а не основание ранжировать страны напрямую." : "Labor demand is one component of the management index, not a direct country ranking.")}</p></div></div>${table(priority.slice(0, 20), [
          { label: t("rank"), render: (row) => row.rank_country_program_priority, num: true },
          { label: t("country"), render: (row) => `${flagEmoji(row.iso3)} ${row.displayCountry}` },
          { label: state.lang === "ru" ? "Программа" : "Program", render: (row) => row.displayProgram },
          { label: t("combinedPriority"), render: (row) => fmt1(row.combined_country_program_priority_score), num: true },
        ])}</section>
        <section class="panel span-4"><details class="data-disclosure"><summary>${esc(state.lang === "ru" ? "Диагностические поисковые сигналы" : "Diagnostic query signals")}</summary>${table(signals, [
          { label: state.lang === "ru" ? "Группа" : "Group", render: (row) => programLabel(row) },
          { label: state.lang === "ru" ? "Запрос" : "Query", render: (row) => row.keyword },
          { label: state.lang === "ru" ? "Ответ API" : "API results", render: (row) => fmt0(row.api_search_result_count), num: true },
        ])}<p class="model-warning">${esc(t("vacanciesNotice"))}</p></details><h2>${esc(t("methodology"))}</h2><p>${esc(state.lang === "ru" ? "Индекс строится по уникальным классифицированным вакансиям. Правила требуют содержательного совпадения и применяют исключающие паттерны; пересекающиеся поисковые ответы не суммируются." : "The index is built from unique classified vacancies. Rules require substantive evidence and apply exclusion patterns; overlapping query responses are not summed.")}</p><details class="technical-passport"><summary>${esc(state.lang === "ru" ? "Технический паспорт набора" : "Technical dataset passport")}</summary><p><strong>source_key:</strong> <code>trudvsem_open_data_api</code></p><p><strong>privacy:</strong> ${esc(metadata.privacy_policy || "")}</p></details>${sourceButton()}</section>
      </section>`;
    renderHorizontalBar("vacancyProgramBar", programs, "displayProgram", "program_labor_demand_score", t("laborDemandSignal"));
    bindCommon();
  }

  function renderReport(payload) {
    if (window.MGIMOExecutiveReport?.mount?.({
      root: $("#app"),
      payload,
      countries: state.countries,
      lang: state.lang,
      diagnosticsHtml: modelDiagnostics(payload.gravityModel),
      downloadsHtml: downloadLinks(payload.downloads),
    })) {
      bindCommon();
      return;
    }
    const gapLeader = payload.factPotentialGap.top?.[0] || {};
    const finalTotal = payload.potentialForecast.yearTotals?.at(-1) || {};
    const findings = [
      { number: "01", title: state.lang === "ru" ? "Фактический контингент" : "Observed stock", text: state.lang === "ru" ? `Последний содержательный сопоставимый срез UIS по России — ${payload.russiaInbound.latestYear} год.` : `The latest meaningful comparable UIS slice for Russia is ${payload.russiaInbound.latestYear}.`, href: "migration.html" },
      { number: "02", title: state.lang === "ru" ? "Молодёжные рынки" : "Youth markets", text: state.lang === "ru" ? "Рост образовательного рынка до 2050 года концентрируется в ограниченном наборе стран Африки и Азии." : "Growth in education markets to 2050 is concentrated in a limited group of African and Asian countries.", href: "demography.html" },
      { number: "03", title: state.lang === "ru" ? "Нереализованный потенциал" : "Unrealized potential", text: state.lang === "ru" ? `${localizedCountry(gapLeader.origin_iso3, gapLeader.origin_country)} возглавляет текущий устойчивый срез; медиана разрыва — ${fmt0(gapLeader.gap_parameter_q50 || gapLeader.gap_abs)}.` : `${localizedCountry(gapLeader.origin_iso3, gapLeader.origin_country)} leads the current robust slice; median gap is ${fmt0(gapLeader.gap_parameter_q50 || gapLeader.gap_abs)}.`, href: "gap.html" },
      { number: "04", title: state.lang === "ru" ? "Сценарии 2050" : "2050 scenarios", text: state.lang === "ru" ? `Базовая совокупная структурная ёмкость в финальном году сценария составляет ${fmt0(finalTotal.potential_students)} эквивалентов.` : `Baseline aggregate structural capacity in the final scenario year is ${fmt0(finalTotal.potential_students)} equivalents.`, href: "forecast.html" },
      { number: "05", title: state.lang === "ru" ? "Управленческая матрица" : "Management matrix", text: state.lang === "ru" ? `${fmt0(payload.countryProgramMatrix.rows?.length)} комбинаций связывают страну, программу, язык, инструмент и дизайн проверки эффекта.` : `${fmt0(payload.countryProgramMatrix.rows?.length)} combinations link country, program, language, instrument and effect-evaluation design.`, href: "matrix.html" },
    ];
    const sections = state.lang === "ru"
      ? ["Резюме для руководства", "Контингент UIS", "Рынки до 2050 года", "Гравитационная модель", "Рейтинг разрыва", "Матрица программ", "Рынок компетенций", "Приложение по источникам"]
      : ["Executive summary", "Observed UIS stock", "Markets to 2050", "Gravity model", "Gap ranking", "Program matrix", "Competency market", "Source appendix"];
    const limitations = state.lang === "ru"
      ? ["UIS OPRI измеряет контингент зачисленных международно мобильных студентов, а не новые ежегодные зачисления.", "Сценарии до 2050 года являются оценками структурной ёмкости и анализом чувствительности, а не гарантированным прогнозом набора.", "Трудовой модуль использует обезличенный тематический снимок и не заявляет перепись всех вакансий России.", "Фактические и модельные значения не суммируются в один наблюдаемый показатель."]
      : ["UIS OPRI measures enrolled internationally mobile student stock, not new annual enrolments.", "2050 scenarios are structural-capacity estimates and sensitivity analysis, not guaranteed enrolment forecasts.", "The labor module uses a sanitized thematic snapshot and does not claim a census of all Russian vacancies.", "Observed and modelled values are never summed into one factual measure."];
    $("#app").innerHTML = `
      ${pageHero({
        kicker: state.lang === "ru" ? "Задача 5.2.12 · материал для руководства" : "Task 5.2.12 · executive deliverable",
        title: state.lang === "ru" ? "Глобальная карта образовательной миграции в Россию" : "Global map of educational migration to Russia",
        note: state.lang === "ru" ? "Новые рынки, сценарии до 2050 года и управленческая модель привлечения иностранных студентов — из единого проверяемого контура данных." : "New markets, scenarios to 2050 and a management model for international student recruitment from one traceable evidence chain.",
        evidenceTitle: state.lang === "ru" ? "Статус документа" : "Document status",
        evidenceValue: state.lang === "ru" ? "Воспроизводимый аналитический доклад" : "Reproducible analytical report",
        evidenceNote: state.lang === "ru" ? "Все таблицы и выводы должны собираться из тех же канонических артефактов, что и дашборд." : "All tables and findings must be generated from the same canonical artifacts as the dashboard.",
        actions: `<a class="action-button primary" href="reports/mgimo_global_education_migration_report.md" download>${esc(state.lang === "ru" ? "Скачать Markdown" : "Download Markdown")}</a>${sourceButton()}`,
      })}
      <section class="executive-finding-grid">${findings.map((item) => `<a class="executive-finding-card" href="${item.href}"><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p><small>${esc(state.lang === "ru" ? "Перейти к доказательствам" : "Open evidence")} →</small></a>`).join("")}</section>
      <section class="analysis-grid">
        <section class="panel span-5"><div class="pane-header"><div><h2>${esc(state.lang === "ru" ? "Состав доклада" : "Report composition")}</h2><p>${esc(state.lang === "ru" ? "Выберите разделы для предварительного просмотра." : "Select sections for the preview.")}</p></div></div><div class="check-list">${sections.map((label, index) => `<label><input type="checkbox" checked data-report-section="${index}"> <span>${esc(label)}</span></label>`).join("")}</div><div class="report-actions"><button id="printReport" class="primary-action" type="button">${esc(state.lang === "ru" ? "Печать / PDF" : "Print / PDF")}</button><a class="text-button" href="data/platform2/country_program_priority_v5.csv" download>${esc(state.lang === "ru" ? "Матрица CSV" : "Matrix CSV")}</a></div></section>
        <section class="panel span-7"><div class="pane-header"><div><h2>${esc(state.lang === "ru" ? "Предварительный вид для руководства" : "Executive preview")}</h2><p>${esc(state.lang === "ru" ? "Краткая версия без технического шума." : "Concise version without technical noise.")}</p></div><span class="badge verified">MGIMO</span></div><article id="reportPreview" class="print-preview executive-preview"></article></section>
        <section class="panel span-7"><div class="pane-header"><div><h2>${esc(state.lang === "ru" ? "Диагностика научной основы" : "Scientific-basis diagnostics")}</h2><p>${esc(state.lang === "ru" ? "Роль и качество модели раскрываются отдельно от управленческих выводов." : "Model role and quality are separated from management findings.")}</p></div></div>${modelDiagnostics(payload.gravityModel)}</section>
        <section class="panel span-5"><div class="pane-header"><div><h2>${esc(t("downloads"))}</h2><p>${esc(state.lang === "ru" ? "Машиночитаемые результаты и паспорта." : "Machine-readable outputs and passports.")}</p></div></div>${downloadLinks(payload.downloads)}</section>
        <section class="panel span-8"><div class="pane-header"><div><h2>${esc(t("auditCenter"))}</h2><p>${esc(state.lang === "ru" ? "Ключевые источники, даты извлечения и контрольные суммы." : "Key sources, retrieval dates and checksums.")}</p></div></div>${table(payload.sourceRegistry.sources.slice(0, 30), [
          { label: state.lang === "ru" ? "Источник" : "Source", render: (row) => publicSourceTitle(row.source_title || row.source_id) },
          { label: t("retrieved"), render: (row) => row.retrieved_at_utc },
          { label: state.lang === "ru" ? "Строк" : "Rows", render: (row) => fmt0(row.row_count), num: true },
          { label: "SHA-256", render: (row) => row.sha256 },
        ])}</section>
        <section class="panel span-4"><div class="pane-header"><div><h2>${esc(t("limitations"))}</h2><p>${esc(state.lang === "ru" ? "Обязательная часть управленческого чтения." : "Mandatory management reading.")}</p></div></div><ul class="limitation-list">${limitations.map((item) => `<li>${esc(item)}</li>`).join("")}</ul></section>
      </section>`;
    const updatePreview = () => {
      const selected = [...document.querySelectorAll("[data-report-section]")].map((box, index) => ({ checked: box.checked, label: sections[index] })).filter((item) => item.checked);
      document.getElementById("reportPreview").innerHTML = `<div class="report-cover"><p>${esc(state.lang === "ru" ? "Аналитический доклад" : "Analytical report")}</p><h2>${esc(state.lang === "ru" ? "Международная образовательная миграция в Россию" : "International educational migration to Russia")}</h2><span>${esc(state.lang === "ru" ? "МГИМО МИД России · ФНИСЦ РАН · 2026" : "MGIMO University · FCTAS RAS · 2026")}</span></div><h3>${esc(state.lang === "ru" ? "Ключевые выводы" : "Key findings")}</h3>${findings.map((item) => `<p><strong>${esc(item.title)}.</strong> ${esc(item.text)}</p>`).join("")}<h3>${esc(state.lang === "ru" ? "Разделы" : "Sections")}</h3><ol>${selected.map((item) => `<li>${esc(item.label)}</li>`).join("")}</ol><p class="report-footnote">${esc(state.lang === "ru" ? `Паспортов источников: ${payload.sourceRegistry.sources.length}. Последний фактический год: ${payload.russiaInbound.latestYear}.` : `Source passports: ${payload.sourceRegistry.sources.length}. Latest factual year: ${payload.russiaInbound.latestYear}.`)}</p>`;
    };
    document.querySelectorAll("[data-report-section]").forEach((box) => box.addEventListener("change", updatePreview));
    document.getElementById("printReport")?.addEventListener("click", () => window.print());
    updatePreview();
    bindCommon();
  }

  async function renderLaborPage() {
    await loadCommon({ needGeo: false });
    const data = await getJson(DATA_URLS.labor);
    if (!state.laborGeo) state.laborGeo = await getJson(DATA_URLS.laborRegions);
    $("#app").innerHTML = `
      ${statusBand(t("laborTitle"), `${t("laborNotice")} ${data.forecast_period}; ${fmt0(data.counts.forecast_rows)} rows.`)}
      <section id="laborApp" class="labor-shell">
        <aside class="panel filter-rail">
          <h2>${esc(state.lang === "ru" ? "Фильтры" : "Filters")}</h2>
          <label class="control-field"><span>${esc(t("year"))}</span><select id="laborYear">${data.time_series.map((r) => `<option value="${r.forecast_year}" ${Number(r.forecast_year) === 2050 ? "selected" : ""}>${r.forecast_year}</option>`).join("")}</select></label>
          <label class="control-field"><span>${esc(t("region"))}</span><select id="laborRegion"><option>${esc(t("all"))}</option>${data.top_regions_2050.map((r) => `<option>${esc(r.territory_name)}</option>`).join("")}</select></label>
          <label class="control-field"><span>OKVED</span><select id="laborSector"><option>${esc(t("all"))}</option>${data.top_sectors_2050.map((r) => `<option>${esc(r.okved_section)}</option>`).join("")}</select></label>
          <p class="note">${esc(t("mobileNote"))}</p>
        </aside>
        <section class="panel"><div class="pane-header"><div><h2>${esc(t("laborTitle"))}</h2>${scaleLegend()}</div><span class="badge modelled">${esc(t("modelled"))}</span></div><div id="laborMap" class="map map-tall"></div></section>
        <aside class="panel"><h2>${esc(t("sourcePassports"))}</h2>${data.source_passports.map(sourceCard).join("")}</aside>
      </section>
      <section class="kpi-strip">${data.kpis.map((item) => kpi(item.label_ru || item.field, fmt0(item.value), `${item.unit}; ${item.observation_status}`, item)).join("")}</section>
      <section class="analysis-grid">
        <section class="panel span-7"><h2>${esc(state.lang === "ru" ? "Горизонт 2025-2050" : "2025-2050 horizon")}</h2><div id="laborTrend" class="chart small" data-chart></div></section>
        <section class="panel span-5"><h2>${esc(t("laborSectorYear"))}</h2><div data-chart>${bars(data.top_sectors_2050, "activity_name", "recommended_annual_quota_persons", 8)}</div><div class="sector-grid">${data.top_sectors_2050.slice(0, 12).map((r) => `<article class="sector-tile"><span>${esc(r.okved_section)}</span><strong>${esc(r.activity_name)}</strong><small>${fmt0(r.recommended_annual_quota_persons)}</small></article>`).join("")}</div></section>
        <section class="panel span-6"><h2>${esc(t("laborRegionYear"))}</h2>${table(data.top_regions_2050, [
          { label: t("region"), render: (r) => r.territory_name },
          { label: t("year"), render: (r) => r.forecast_year, num: true },
          { label: state.lang === "ru" ? "Годовая квота" : "Annual quota", render: (r) => fmt0(r.recommended_annual_quota_persons), num: true },
        ])}</section>
        <section class="panel span-6"><h2>${esc(t("vacancyCompetency"))}</h2><p>${esc(state.lang === "ru" ? "Трудовой слой связывается с матрицей компетенций через ОКВЭД и программные группы; страны не ранжируются по российской трудовой потребности напрямую." : "The labor layer connects to competencies through OKVED and program groups; countries are not ranked directly by Russia-side labor demand.")}</p><p class="note">source: Foreign labor migration v5; OKVED crosswalk; passport hashes above.</p>${downloadLinks(data.downloads)}</section>
      </section>`;
    renderRussiaMap("laborMap", data);
    renderTrend("laborTrend", data.time_series, "forecast_year", "recommended_annual_quota_persons", state.lang === "ru" ? "Годовая квота" : "Annual quota");
    bindCommon();
  }

  async function route() {
    clearMaps();
    delete document.documentElement.dataset.uiReady;
    delete document.documentElement.dataset.uiError;
    $("#app").innerHTML = `<section class="status-band loading-state"><div class="loading-indicator" aria-hidden="true"></div><div><strong>${esc(t("loading"))}</strong><p>${esc(state.lang === "ru" ? "Проверяем источники и строим визуализации…" : "Validating sources and rendering visualizations…")}</p></div></section>`;
    try {
      if (VIEW === "migration") {
        await renderMigration();
      } else if (VIEW === "demography") {
        await renderDemographyPage();
      } else if (VIEW === "model") {
        await renderModelPage();
      } else if (VIEW === "friendliness") {
        await renderFriendlinessPage();
      } else if (VIEW === "forecast") {
        await renderForecastPage();
      } else if (VIEW === "gap") {
        await renderGapPage();
      } else if (VIEW === "matrix") {
        await renderMatrixPage();
      } else if (VIEW === "report") {
        const payload = await loadCommon({ needGeo: false });
        renderReport(payload);
      } else if (VIEW === "labor") {
        await renderLaborPage();
      } else if (VIEW === "vacancies") {
        await renderVacanciesPage();
      } else {
        const payload = await loadCommon();
        await renderOverview(payload);
      }
      document.documentElement.dataset.uiReady = "true";
      window.dispatchEvent(new CustomEvent("mgimo:ui-ready", { detail: { view: VIEW, lang: state.lang } }));
    } catch (error) {
      document.documentElement.dataset.uiError = "true";
      $("#app").innerHTML = `<section class="status-band error-state"><div><strong>${esc(state.lang === "ru" ? "Ошибка загрузки данных" : "Data load error")}</strong><p>${esc(error.message)}</p></div>${sourceButton()}</section>`;
      bindCommon();
      console.error(error);
    }
  }

  renderHeader();
  route();
})();
