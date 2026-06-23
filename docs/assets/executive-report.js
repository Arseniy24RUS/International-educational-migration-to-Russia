/* MGIMO Platform 2.0 — deterministic executive report generator. 2026-06-23. */
(() => {
  "use strict";

  const VERSION = "20260623-report2";
  const DEFAULT_TITLES = {
    ru: "Международная образовательная миграция в Россию",
    en: "International educational migration to Russia",
  };
  const DEFAULT_TITLE = DEFAULT_TITLES.ru;
  const SECTION_ORDER = [
    ["method", "Методология и доказательная архитектура"],
    ["inbound", "Наблюдаемый контингент иностранных студентов"],
    ["demography", "Демографическая база образовательных рынков"],
    ["model", "Гравитационная модель и её диагностика"],
    ["forecast", "Сценарии структурной ёмкости и разрыв"],
    ["receptivity", "Восприимчивость, компетенции и рынок труда"],
    ["matrix", "Матрица страна — программа — инструмент"],
    ["profiles", "Страновые профили"],
    ["sources", "Паспорта источников"],
    ["technical", "Технические приложения"],
  ];
  const SECTION_LABELS = {
    ru: Object.fromEntries(SECTION_ORDER),
    en: {
      method: "Methodology and evidence architecture",
      inbound: "Observed international student stock",
      demography: "Demographic base of education markets",
      model: "Gravity model and diagnostics",
      forecast: "Structural capacity scenarios and gap",
      receptivity: "Receptivity, competencies and labor market",
      matrix: "Country-program-instrument matrix",
      profiles: "Country profiles",
      sources: "Source passports",
      technical: "Technical appendix",
    },
  };
  const SPECIAL_SECTION_LABELS = {
    ru: { front: "Вводная часть", toc: "Содержание", report: "Аналитический доклад" },
    en: { front: "Front matter", toc: "Contents", report: "Analytical report" },
  };
  const SECTION_DESCRIPTIONS = {
    en: {
      method: "Units, formulas, uncertainty and ranking rules.",
      inbound: "UIS stock evidence and country-of-origin structure.",
      demography: "Youth-market scale and UN population projections to 2050.",
      model: "PPML specification, coefficients, validation and limits.",
      forecast: "National capacity scenarios, structural shares and representation gaps.",
      receptivity: "Receptivity components and privacy-safe competency demand.",
      matrix: "Scenario weights and translation into management actions.",
      profiles: "One reproducible evidence card for each selected country.",
      sources: "URLs, retrieval dates, access terms, row counts and checksums.",
      technical: "Field dictionary, quality checks and reproducibility manifest.",
    },
  };
  const DEFAULT_SECTIONS = SECTION_ORDER.map(([key]) => key);

  let activeContext = null;
  let currentReport = null;
  let composerState = {
    titleCustom: false,
    titleByLang: {},
    profileCount: 60,
    sections: null,
    reportWasOpen: false,
  };

  const q = (selector, root = document) => root.querySelector(selector);
  const qa = (selector, root = document) => [...root.querySelectorAll(selector)];
  const esc = (value) => String(value ?? "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
  const num = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const hasCyrillic = (value) => /[А-Яа-яЁё]/.test(String(value ?? ""));
  const normalizedLang = (value) => value === "en" ? "en" : "ru";
  const reportLang = () => normalizedLang(activeContext?.lang);
  const reportLocale = (lang = reportLang()) => lang === "en" ? "en-US" : "ru-RU";
  const fmt0 = (value) => new Intl.NumberFormat(reportLocale(), { maximumFractionDigits: 0 }).format(num(value));
  const fmt1 = (value) => new Intl.NumberFormat(reportLocale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(num(value));
  const fmt2 = (value) => new Intl.NumberFormat(reportLocale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num(value));
  const pct = (value, digits = 1) => `${new Intl.NumberFormat(reportLocale(), { maximumFractionDigits: digits }).format(num(value) * 100)}%`;
  const dateRu = (value) => {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value || "—") : new Intl.DateTimeFormat(reportLocale(), { day: "2-digit", month: "long", year: "numeric" }).format(d);
  };
  const clamp = (value, min, max) => Math.max(min, Math.min(max, num(value)));
  const sum = (rows, accessor) => rows.reduce((acc, row) => acc + num(accessor(row)), 0);
  const mean = (rows, accessor) => rows.length ? sum(rows, accessor) / rows.length : 0;
  const chunks = (rows, size) => Array.from({ length: Math.ceil(rows.length / size) }, (_, index) => rows.slice(index * size, (index + 1) * size));
  const truncate = (value, length = 140) => String(value ?? "").length > length ? `${String(value).slice(0, length - 1)}…` : String(value ?? "");
  const defaultTitle = (lang = reportLang()) => DEFAULT_TITLES[normalizedLang(lang)];
  const readableCode = (value) => String(value ?? "")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
  const sectionLabelFor = (key, lang = reportLang()) => SECTION_LABELS[normalizedLang(lang)]?.[key]
    || SPECIAL_SECTION_LABELS[normalizedLang(lang)]?.[key]
    || (normalizedLang(lang) === "en" ? readableCode(key) : key);
  const sourceCitation = (value) => {
    const text = String(value ?? "—");
    return hasCyrillic(text) && reportLang() === "en"
      ? `<span data-source-citation lang="ru">${esc(text)}</span>`
      : esc(text);
  };

  function countryName(iso3, fallback = "") {
    const ref = activeContext?.data?.countryMap?.get(iso3);
    if (ref?.iso2 && typeof Intl.DisplayNames === "function") {
      try {
        const name = new Intl.DisplayNames([reportLang()], { type: "region" }).of(ref.iso2);
        if (name && name !== ref.iso2) return name;
      } catch (_) { /* fallback below */ }
    }
    if (reportLang() === "en") return ref?.iso3 || iso3 || fallback || "—";
    return fallback || ref?.name || iso3 || "—";
  }

  const PROGRAM_LABELS_EN = {
    international_relations: "International relations",
    economics_management: "Economics and management",
    law_governance: "Law and governance",
    media_communications: "Media and communications",
    languages_regional: "Languages and area studies",
  };

  function programLabel(row) {
    if (reportLang() === "en") {
      return row?.program_label_en
        || PROGRAM_LABELS_EN[row?.program_group]
        || PROGRAM_LABELS_EN[row?.keyword_group]
        || readableCode(row?.program_group || row?.keyword_group || "");
    }
    return row?.program_label_ru || row?.program_group || row?.keyword_group || "—";
  }

  const HUMAN_CODES = {
    english_plus_russian_preparatory_year: "английский + русский подготовительный год",
    english_with_optional_russian_preparatory_module: "английский + опциональный русский модуль",
    english_plus_russian_preparatory_year_plus_target_region_language: "английский + русский год + язык региона",
    english_with_optional_russian_preparatory_module_plus_target_region_language: "английский + русский модуль + язык региона",
    russian_or_bilingual_russian_english: "русский или билингвальный русско-английский формат",
    russian_or_bilingual_russian_english_plus_target_region_language: "русский/билингвальный формат + язык целевого региона",
    targeted_digital_campaign_with_local_partner_validation: "цифровая кампания + локальный партнёр",
    employer_linked_program_campaign_and_case_competitions: "работодатели + кейс-чемпионаты",
    digital_recruitment_scholarship_and_olympiad: "цифровой рекрутинг + стипендия + олимпиада",
    russian_language_track_alumni_and_school_network: "русский трек + выпускники + школы",
    pre_registered_country_program_campaign_with_matched_comparison_or_stepped_wedge_rollout: "предрегистрация; сопоставимая группа или ступенчатое внедрение",
    uncertainty_adjusted_management_priority_index_not_predicted_student_count: "сравнительный индекс с учётом неопределённости; не прогноз числа студентов",
    qualified_leads: "лиды", applications: "заявки", offers: "офферы", enrolments: "зачисления", yield: "yield", cost_per_enrolment: "стоимость зачисления",
    B_targeted_validation: "B — целевая верификация", C_monitor_and_test: "C — мониторинг и тест", D_insufficient_or_unstable_evidence: "D — недостаточные или нестабильные доказательства",
  };
  const HUMAN_CODES_EN = {
    english_plus_russian_preparatory_year: "English plus Russian preparatory year",
    english_with_optional_russian_preparatory_module: "English with optional Russian module",
    english_plus_russian_preparatory_year_plus_target_region_language: "English plus Russian year plus target-region language",
    english_with_optional_russian_preparatory_module_plus_target_region_language: "English with optional Russian module plus target-region language",
    russian_or_bilingual_russian_english: "Russian or bilingual Russian-English format",
    russian_or_bilingual_russian_english_plus_target_region_language: "Russian/bilingual format plus target-region language",
    targeted_digital_campaign_with_local_partner_validation: "Targeted digital campaign plus local partner validation",
    employer_linked_program_campaign_and_case_competitions: "Employer-linked program campaign and case competitions",
    digital_recruitment_scholarship_and_olympiad: "Digital recruitment, scholarship and olympiad",
    russian_language_track_alumni_and_school_network: "Russian-language track, alumni and school network",
    pre_registered_country_program_campaign_with_matched_comparison_or_stepped_wedge_rollout: "Pre-registered country-program campaign with matched comparison or stepped-wedge rollout",
    uncertainty_adjusted_management_priority_index_not_predicted_student_count: "Uncertainty-adjusted management priority index, not a predicted student count",
    qualified_leads: "qualified leads",
    applications: "applications",
    offers: "offers",
    enrolments: "enrolments",
    yield: "yield",
    cost_per_enrolment: "cost per enrolment",
    B_targeted_validation: "B - targeted validation",
    C_monitor_and_test: "C - monitor and test",
    D_insufficient_or_unstable_evidence: "D - insufficient or unstable evidence",
  };

  function humanCode(value) {
    const raw=String(value ?? "").trim();
    if(!raw)return "—";
    const dict = reportLang() === "en" ? HUMAN_CODES_EN : HUMAN_CODES;
    if(dict[raw])return dict[raw];
    if(raw.includes(";"))return raw.split(";").map(part=>dict[part]||(reportLang()==="en"?readableCode(part):part.replaceAll("_"," "))).join("; ");
    return reportLang() === "en" ? readableCode(raw) : raw.replaceAll("_"," ");
  }

  function evidenceTag(label, kind = "model") {
    return `<span class="report-evidence-tag is-${esc(kind)}">${esc(label)}</span>`;
  }

  function metric(label, value, note = "", kind = "") {
    return `<div class="report-metric ${kind ? `is-${esc(kind)}` : ""}"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(note)}</small></div>`;
  }

  function metrics(items) {
    return `<div class="report-metric-grid">${items.map((item) => metric(item[0], item[1], item[2], item[3])).join("")}</div>`;
  }

  function sourceLine(text) {
    const label = reportLang() === "en" ? "Source and status:" : "Источник и статус:";
    return `<p class="report-source-line"><strong>${esc(label)}</strong> ${sourceCitation(text)}</p>`;
  }

  function table(rows, columns, options = {}) {
    const widths = options.widths || [];
    const body = rows.map((row, rowIndex) => `<tr>${columns.map((column, colIndex) => {
      const value = typeof column.value === "function" ? column.value(row, rowIndex) : row[column.value];
      const cls = column.num ? "is-num" : "";
      return `<td class="${cls}"${widths[colIndex] ? ` style="width:${esc(widths[colIndex])}"` : ""}>${column.html ? value : esc(value ?? "—")}</td>`;
    }).join("")}</tr>`).join("");
    const empty = reportLang() === "en" ? "No rows for the selected slice." : "Нет строк для выбранного среза.";
    return `<div class="report-table-wrap"><table class="report-table ${options.dense ? "is-dense" : ""}">${options.caption ? `<caption>${esc(options.caption)}</caption>` : ""}<thead><tr>${columns.map((column, index) => `<th class="${column.num ? "is-num" : ""}"${widths[index] ? ` style="width:${esc(widths[index])}"` : ""}>${esc(column.label)}</th>`).join("")}</tr></thead><tbody>${body || `<tr><td colspan="${columns.length}">${esc(empty)}</td></tr>`}</tbody></table></div>`;
  }

  function barChart(rows, labelAccessor, valueAccessor, options = {}) {
    const data = rows.slice(0, options.limit || 12).map((row) => ({ label: String(labelAccessor(row)), value: num(valueAccessor(row)) }));
    const width = 760;
    const rowHeight = options.rowHeight || 31;
    const left = options.left || 225;
    const right = 72;
    const top = 18;
    const height = Math.max(110, top * 2 + data.length * rowHeight);
    const max = Math.max(1, ...data.map((d) => Math.abs(d.value)));
    const bars = data.map((d, i) => {
      const y = top + i * rowHeight;
      const barWidth = (width - left - right) * Math.abs(d.value) / max;
      return `<text x="${left - 9}" y="${y + 17}" text-anchor="end" font-size="12" fill="#334156">${esc(truncate(d.label, 31))}</text><rect x="${left}" y="${y + 4}" width="${Math.max(1, barWidth)}" height="18" rx="3" fill="#174f86"></rect><text x="${Math.min(width - 4, left + barWidth + 7)}" y="${y + 17}" font-size="11" fill="#17243a">${esc(options.format ? options.format(d.value) : fmt0(d.value))}</text>`;
    }).join("");
    const aria = options.aria || (reportLang() === "en" ? "Bar chart" : "Столбчатая диаграмма");
    return `<div class="report-chart-box"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(aria)}">${bars}</svg>${options.caption ? `<p class="report-chart-caption">${esc(options.caption)}</p>` : ""}</div>`;
  }

  function lineChart(series, xAccessor, lines, options = {}) {
    const width = 760, height = options.height || 300, left = 58, right = 24, top = 22, bottom = 42;
    const xs = series.map((row) => num(xAccessor(row)));
    const allY = lines.flatMap((line) => series.map((row) => num(line.value(row))));
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = options.zero ? 0 : Math.min(...allY);
    const maxY = Math.max(...allY, minY + 1);
    const sx = (x) => left + (width - left - right) * ((x - minX) / Math.max(1, maxX - minX));
    const sy = (y) => top + (height - top - bottom) * (1 - (y - minY) / Math.max(1, maxY - minY));
    const grid = Array.from({ length: 5 }, (_, i) => {
      const value = minY + (maxY - minY) * i / 4;
      const y = sy(value);
      return `<line x1="${left}" x2="${width - right}" y1="${y}" y2="${y}" stroke="#d7dee7"/><text x="${left - 8}" y="${y + 4}" text-anchor="end" font-size="10" fill="#5c6878">${esc(options.formatY ? options.formatY(value) : fmt0(value))}</text>`;
    }).join("");
    const palette = ["#174f86", "#b78a2d", "#2f765f", "#984343"];
    const paths = lines.map((line, index) => {
      const points = series.map((row) => `${sx(num(xAccessor(row)))},${sy(num(line.value(row)))}`).join(" ");
      const color = palette[index % palette.length];
      return `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`;
    }).join("");
    const xTicks = [minX, Math.round((minX + maxX) / 2), maxX].map((x) => `<text x="${sx(x)}" y="${height - 15}" text-anchor="middle" font-size="10" fill="#5c6878">${esc(x)}</text>`).join("");
    const legend = lines.map((line, index) => `<g transform="translate(${left + index * 180},8)"><rect width="14" height="4" y="-3" fill="${palette[index % palette.length]}"></rect><text x="20" y="1" font-size="10" fill="#334156">${esc(line.label)}</text></g>`).join("");
    const aria = options.aria || (reportLang() === "en" ? "Line chart" : "Линейная диаграмма");
    return `<div class="report-chart-box"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(aria)}">${grid}${paths}${xTicks}${legend}</svg>${options.caption ? `<p class="report-chart-caption">${esc(options.caption)}</p>` : ""}</div>`;
  }

  function page(section, title, body, options = {}) {
    return {
      section,
      title,
      shortTitle: options.shortTitle || title,
      className: options.className || "",
      source: options.source || "",
      body,
      toc: options.toc !== false,
    };
  }

  function divider(section, number, title, deck, stats = []) {
    const word = reportLang() === "en" ? "Chapter" : "Раздел";
    return page(section, title, `<span class="report-page-kicker">${esc(word)} ${esc(number)}</span><div class="report-divider-number">${esc(number)}</div><h1>${esc(title)}</h1><p class="report-page-deck">${esc(deck)}</p><div class="report-divider-grid">${stats.map((item) => `<div><span>${esc(item[0])}</span><strong>${esc(item[1])}</strong></div>`).join("")}</div>`, { className: "report-divider-page" });
  }

  function prepareData(payload, countries) {
    const countryRows = countries?.countries || [];
    const countryMap = new Map(countryRows.map((row) => [row.iso3, row]));
    const inboundMap = new Map((payload.russiaInbound?.topOrigins || []).map((row) => [row.origin_iso3, row]));
    const gapMap = new Map((payload.factPotentialGap?.top || []).map((row) => [row.origin_iso3, row]));
    const friendMap = new Map((payload.friendlinessIndex?.rows || []).map((row) => [row.iso3, row]));
    const matrixByCountry = new Map();
    for (const row of payload.countryProgramMatrix?.rows || []) {
      if (!matrixByCountry.has(row.iso3)) matrixByCountry.set(row.iso3, []);
      matrixByCountry.get(row.iso3).push(row);
    }
    for (const rows of matrixByCountry.values()) rows.sort((a, b) => num(a.rank_country_program_priority, 9999) - num(b.rank_country_program_priority, 9999));
    const profileCountries = [...matrixByCountry.entries()].map(([iso3, rows]) => ({
      iso3,
      rows,
      best: rows[0],
      ref: countryMap.get(iso3),
      inbound: inboundMap.get(iso3),
      gap: gapMap.get(iso3),
      friend: friendMap.get(iso3),
    })).sort((a, b) => num(a.best?.rank_country_program_priority, 9999) - num(b.best?.rank_country_program_priority, 9999));
    const sourceMap = new Map((payload.sourceRegistry?.sources || []).map((row) => [row.source_id, row]));
    return { payload, countries, countryRows, countryMap, inboundMap, gapMap, friendMap, matrixByCountry, profileCountries, sourceMap };
  }

  function buildFrontPages(data, cfg) {
    const p = data.payload;
    const latestObserved = (p.russiaInbound?.yearTotals || []).filter((r) => num(r.students_observed) > 0).at(-1) || {};
    const firstGap = p.factPotentialGap?.top?.[0] || {};
    const matrixRows = p.countryProgramMatrix?.rows || [];
    const programCount = new Set(matrixRows.map((r) => r.program_group)).size;
    const countryCount = new Set(matrixRows.map((r) => r.iso3)).size;
    const cover = page("front", cfg.title, `
      <div class="report-cover-layout">
        <div class="report-cover-logos"><img src="assets/mgimo-home.png" alt="МГИМО"><img src="assets/fnisc.png" alt="ФНИСЦ РАН"></div>
        <div class="report-cover-copy"><span class="report-page-kicker">Аналитический доклад для руководства</span><h1>${esc(cfg.title)}</h1><p>Наблюдаемые данные, сценарии до 2050 года, структурная модель международной образовательной миграции и матрица управленческих решений.</p></div>
        <div class="report-cover-meta"><div><span>Версия платформы</span><strong>${esc(p.metadata?.model_upgrade || "scientific_models_v5")}</strong></div><div><span>Дата формирования</span><strong>${esc(dateRu(new Date().toISOString()))}</strong></div><div><span>Режим</span><strong>Автоматическая сборка из канонических артефактов</strong></div></div>
      </div>`, { className: "report-cover-page", toc: false });

    const passport = page("front", "Паспорт документа", `
      <span class="report-page-kicker">Паспорт выпуска</span><h1>Паспорт документа</h1><p class="report-page-deck">Доклад сформирован в браузере без серверной генерации текста. Все значения извлечены из того же JSON-пакета, который использует интерфейс платформы.</p>
      ${metrics([
        ["Фактический год UIS", latestObserved.year || p.russiaInbound?.latestYear || "—", `${fmt0(latestObserved.students_observed)} студентов`, "official"],
        ["Стран в справочнике", fmt0(data.countryRows.length), "демографический контур WPP", "official"],
        ["Стран в матрице", fmt0(countryCount), `${programCount} программных групп`, "model"],
        ["Паспортов источников", fmt0(p.sourceRegistry?.sources?.length), "контрольные суммы SHA-256", "official"],
      ])}
      <dl class="report-definition-list">
        <div><dt>Идентификатор</dt><dd>${esc(cfg.documentId)}</dd></div>
        <div><dt>Дата данных</dt><dd>${esc(p.metadata?.generated_at || "—")}</dd></div>
        <div><dt>Статус релиза</dt><dd>${esc(p.metadata?.release_status || "—")}</dd></div>
        <div><dt>Принцип сборки</dt><dd>Детерминированные шаблоны, таблицы и SVG-графики; никакие числовые выводы не создаются генеративной моделью.</dd></div>
        <div><dt>Единица анализа</dt><dd>Страна происхождения, год, программная группа и сценарий — в зависимости от раздела.</dd></div>
        <div><dt>Ограничение</dt><dd>Сценарная структурная ёмкость не является гарантированным прогнозом набора; фактический контингент и модельные эквиваленты показаны раздельно.</dd></div>
      </dl>
      <div class="report-callout is-blue"><strong>Правило интерпретации.</strong> Зелёный статус означает официальную или справочную строку; синий — модельный результат; жёлтый — ограничение или неполное покрытие.</div>`, { toc: false, source: "metadata, sourceRegistry, russiaInbound, countryProgramMatrix" });

    const summary1 = page("front", "Резюме для руководства: факты", `
      <span class="report-page-kicker">Резюме для руководства</span><h1>Что платформа устанавливает на фактических данных</h1>
      ${metrics([
        ["Контингент в России", fmt0(latestObserved.students_observed), `UIS, ${latestObserved.year || p.russiaInbound?.latestYear}`, "official"],
        ["Крупнейший источник", countryName(p.russiaInbound?.topOrigins?.[0]?.origin_iso3, p.russiaInbound?.topOrigins?.[0]?.origin_name), fmt0(p.russiaInbound?.topOrigins?.[0]?.students_observed), "official"],
        ["Вакансий во входе", fmt0(p.vacancyCompetency?.inputUniqueVacancies), "обезличенные уникальные записи", "official"],
        ["Классифицировано", fmt0(p.vacancyCompetency?.classifiedUniqueVacancies), `${pct(num(p.vacancyCompetency?.classifiedUniqueVacancies) / Math.max(1, num(p.vacancyCompetency?.inputUniqueVacancies)))}`, "model"],
      ])}
      <div class="report-card-grid">
        <article class="report-card is-green"><h3>Наблюдаемый контингент</h3><p>Базовый показатель — численность зачисленных международно мобильных студентов из страны происхождения, обучающихся в России. Это запас контингента, а не ежегодный приток и не число виз.</p>${evidenceTag("официальная строка UIS", "official")}</article>
        <article class="report-card is-blue"><h3>Демографическая база</h3><p>Масштаб потенциальных образовательных рынков описывается возрастными группами населения и производным студенческим пулом. Исторические оценки и проекции не смешиваются.</p>${evidenceTag("WPP 2024", "official")}</article>
        <article class="report-card is-gold"><h3>Трудовой сигнал</h3><p>Тематическая выборка вакансий показывает относительный спрос по пяти программным группам. Количества поисковой выдачи не суммируются и не трактуются как перепись рынка труда.</p>${evidenceTag("обезличенный снимок", "warning")}</article>
        <article class="report-card is-red"><h3>Неизбежное ограничение</h3><p>Даже качественная структурная модель не заменяет оперативный прогноз набора. Для краткосрочного планирования требуется отдельно учитывать инерцию уже сложившихся потоков.</p>${evidenceTag("структурная, не оперативная модель", "warning")}</article>
      </div>`, { toc: false, source: "russiaInbound, public_country_reference, vacancyCompetency" });

    const summary2 = page("front", "Резюме для руководства: решения", `
      <span class="report-page-kicker">Резюме для руководства</span><h1>Какие управленческие решения поддерживает модуль</h1>
      ${metrics([
        ["Комбинаций страна–программа", fmt0(matrixRows.length), `${countryCount} стран × ${programCount} программ`, "model"],
        ["Лидер разрыва", countryName(firstGap.origin_iso3, firstGap.origin_country), fmt0(firstGap.gap_parameter_q50 || firstGap.gap_abs), "model"],
        ["Профилей в докладе", fmt0(cfg.profileCount), "по одной странице на страну", "model"],
        ["Горизонт", "2050", "три сценария чувствительности", "model"],
      ])}
      <ol>
        <li><strong>Выделить рынки для верификации.</strong> Высокий структурный разрыв используется как основание для дальнейшего исследования, а не как автоматическая квота.</li>
        <li><strong>Сопоставить рынок с программой.</strong> Для каждой страны показаны сценарные баллы, программное соответствие, трудовой сигнал и диапазон неопределённости.</li>
        <li><strong>Выбрать инструмент.</strong> Матрица предлагает формат рекрутинга и дизайн оценки эффекта; ожидаемый эффект не выдумывается до проведения вмешательства.</li>
        <li><strong>Назначить владельца проверки.</strong> Страновой профиль превращает рейтинг в проверяемую карточку: гипотеза, данные, риск, KPI и контрольная дата.</li>
        <li><strong>Обновлять доклад вместе с платформой.</strong> После замены канонического JSON достаточно повторно сформировать документ; таблицы, графики, номера страниц и манифест пересобираются автоматически.</li>
      </ol>
      <div class="report-callout is-green"><strong>Рекомендуемый цикл:</strong> аналитический скрининг → экспертная верификация → пилот → измерение результата → пересмотр весов и инструментов.</div>
      ${table((p.countryProgramMatrix?.rows || []).slice().sort((a,b) => num(a.rank_country_program_priority,9999)-num(b.rank_country_program_priority,9999)).slice(0,5), [
        { label: "Место", value: r => fmt0(r.rank_country_program_priority), num: true },
        { label: "Страна", value: r => countryName(r.iso3, r.country) },
        { label: "Программа", value: programLabel },
        { label: "Индекс", value: r => fmt1(r.combined_country_program_priority_score), num: true },
        { label: "Уровень", value: r => humanCode(r.priority_decision_tier) },
      ], { caption: "Первые строки управленческой матрицы", dense: true })}`, { toc: false, source: "countryProgramMatrix, factPotentialGap" });

    const guide = page("front", "Как читать доклад", `
      <span class="report-page-kicker">Навигация</span><h1>Как читать доклад</h1><p class="report-page-deck">Документ организован от определения показателей к решениям. Каждая страница содержит статус данных и ссылку на источник или модельный артефакт.</p>
      <div class="report-card-grid">
        ${SECTION_ORDER.map(([key, label], index) => `<article class="report-card ${index % 3 === 0 ? "is-blue" : index % 3 === 1 ? "is-gold" : "is-green"}"><h3>${index + 1}. ${esc(label)}</h3><p>${esc({method:"Единицы измерения, формулы, неопределённость и правила ранжирования.",inbound:"Фактический контингент UIS и его распределение по странам.",demography:"Возрастная база рынков и проекции ООН до 2050 года.",model:"PPML-спецификация, коэффициенты, валидация и границы применения.",forecast:"Сценарии национальной ёмкости, структурные доли и разрыв представительства.",receptivity:"Компоненты восприимчивости и обезличенный спрос на компетенции.",matrix:"Сценарные веса и перевод аналитики в управленческие действия.",profiles:"По одной воспроизводимой карточке на каждую выбранную страну.",sources:"URL, даты получения, лицензии, объём и контрольные суммы.",technical:"Словарь полей, контроль качества и манифест воспроизводимости."}[key])}</p></article>`).join("")}
      </div>
      <div class="report-callout"><strong>Важно.</strong> Номер места — средство навигации по доказательствам. Он не заменяет содержательное решение и не должен использоваться без просмотра интервала, покрытия и статуса строки.</div>`, { toc: false });
    return [cover, passport, summary1, summary2, guide];
  }

  function buildMethodPages(data) {
    const p = data.payload;
    const g = p.gravityModel || {};
    const pages = [divider("method", "01", "Методология и доказательная архитектура", "Определения, формулы, правила сопоставления и воспроизводимость расчётов.", [["Источников", fmt0(p.sourceRegistry?.sources?.length)], ["Наблюдений PPML", fmt0(g.n_observations)], ["Стран происхождения", fmt0(g.n_origins)]])];
    pages.push(page("method", "Классы доказательств", `
      <span class="report-page-kicker">01 · Методология</span><h1>Классы доказательств и запрет на смешение</h1>
      <div class="report-card-grid">
        <article class="report-card is-green"><h3>Наблюдаемое</h3><p>Опубликованная строка официального или справочного источника, сохранённая с исходной единицей, периодом, URL/файлом и контрольной суммой.</p>${evidenceTag("observed / official", "official")}</article>
        <article class="report-card is-blue"><h3>Рассчитанное</h3><p>Воспроизводимое преобразование наблюдаемых данных: агрегирование, нормализация, индекс или модельная оценка.</p>${evidenceTag("calculated / modelled", "model")}</article>
        <article class="report-card is-gold"><h3>Сценарное</h3><p>Условный путь при заданных параметрах. Сценарий отвечает на вопрос «что будет при предпосылке», а не заявляет факт будущего.</p>${evidenceTag("scenario", "warning")}</article>
        <article class="report-card is-red"><h3>Управленческое</h3><p>Рекомендация, требующая экспертной проверки, назначения ответственности и последующей оценки эффекта.</p>${evidenceTag("decision hypothesis", "warning")}</article>
      </div>
      <h3>Основное правило</h3><p>Численность UIS, модельная структурная ёмкость, демографический ориентир и управленческий индекс никогда не суммируются в один «общий» показатель. Для каждого числа сохраняются семантика, единица и статус наблюдения.</p>`, { source: "metadata.observed_modelled_policy; sourceRegistry.data_storage_policy" }));
    pages.push(page("method", "Контур данных", `
      <span class="report-page-kicker">01 · Методология</span><h1>Контур данных: от источника к решению</h1>
      <ol>
        <li><strong>Получение.</strong> Файл или API фиксируются датой извлечения и контрольной суммой.</li>
        <li><strong>Нормализация.</strong> Названия стран приводятся к ISO3; годы, единицы и пропуски сохраняются явно.</li>
        <li><strong>Валидация.</strong> Проверяются диапазоны, уникальность ключей, полнота покрытия и логические ограничения.</li>
        <li><strong>Модель.</strong> Производные признаки и оценки записываются в отдельные артефакты с model_id.</li>
        <li><strong>Публикация.</strong> Интерфейс и этот доклад читают один канонический JSON, поэтому расхождение между экраном и PDF исключается на уровне архитектуры.</li>
      </ol>
      <div class="report-formula">Source → Raw artifact → Validated table → Model output → Decision matrix → A4 report<small>Каждая стрелка должна иметь скрипт преобразования, дату и проверяемый артефакт.</small></div>
      ${metrics([["Строк UIS", fmt0(data.sourceMap.get("unesco_uis_opri_202602")?.row_count), "реестр источников", "official"],["Строк WPP", fmt0(data.sourceMap.get("un_wpp2024_population_by_single_age_sex")?.row_count), "реестр источников", "official"],["Строк вакансий", fmt0(data.sourceMap.get("trudvsem_open_data_api")?.row_count), "после обезличивания", "official"],["Строк матрицы", fmt0(p.countryProgramMatrix?.rows?.length), "расчётный выход", "model"]])}`, { source: "sourceRegistry; metadata; countryProgramMatrix" }));
    pages.push(page("method", "Единицы анализа и ключи", `
      <span class="report-page-kicker">01 · Методология</span><h1>Единицы анализа и ключи сопоставления</h1>
      <dl class="report-definition-list">
        <div><dt>Страна</dt><dd>ISO 3166-1 alpha-3; отображаемое название локализуется отдельно и не участвует в соединении таблиц.</dd></div>
        <div><dt>Контингент</dt><dd>origin_iso3 × destination_iso3 × year × education_level × flow_or_stock.</dd></div>
        <div><dt>Демография</dt><dd>iso3 × year × age/indicator × variant; прогнозный вариант фиксируется в паспорте.</dd></div>
        <div><dt>Модель</dt><dd>origin_iso3 × year × model_id; фактический и модельный периоды хранятся в разных полях.</dd></div>
        <div><dt>Матрица</dt><dd>iso3 × program_group × scenario; язык обучения пока агрегирован, если нет проверенного разреза.</dd></div>
        <div><dt>Источник</dt><dd>source_key/source_id связывает каждую публикационную строку с паспортом и SHA-256.</dd></div>
      </dl>
      <div class="report-callout is-blue">Любое соединение по текстовому названию страны считается потенциально ошибочным. Канонический ключ — ISO3.</div>`, { source: "public_country_reference.schema_version; payload trace fields" }));
    pages.push(page("method", "Формула студенческого пула", `
      <span class="report-page-kicker">01 · Методология</span><h1>Демографический студенческий пул</h1>
      <p>Для сравнения возрастной базы образовательных рынков используется производный показатель, объединяющий основную возрастную группу 15–24 лет и часть группы 25–29 лет.</p>
      <div class="report-formula">P<sub>c,t</sub> = Pop<sub>15–24,c,t</sub> + 0,45 × Pop<sub>25–29,c,t</sub><small>P — демографический студенческий пул страны c в году t. Коэффициент 0,45 является аналитической предпосылкой, а не официальным показателем ООН.</small></div>
      <h3>Интерпретация</h3><p>Показатель не равен числу студентов и не задаёт вероятность обучения за рубежом. Он стандартизирует возрастной масштаб рынков для дальнейшего моделирования. Чувствительность к коэффициенту должна проверяться при методическом обновлении.</p>
      ${metrics([["Стран", fmt0(data.countryRows.length), "единый справочник", "official"],["Опорные годы", "2026 · 2035 · 2050", "средний вариант WPP", "official"],["Вес 25–29", "0,45", "аналитическая предпосылка", "warning"],["Единица", "человек", "не прогноз набора", "warning"]])}`, { source: "un_wpp2024_population_by_single_age_sex; public_country_reference.demography" }));
    pages.push(page("method", "PPML-спецификация", `
      <span class="report-page-kicker">01 · Методология</span><h1>Структурная PPML-спецификация</h1>
      <div class="report-formula">E(Y<sub>c,t</sub>|X) = exp(β₀ + β₁ ln P<sub>c,t</sub> + β₂ ln D<sub>c</sub> + β₃ ln O<sub>c,t</sub> + β₄ T<sub>c,t</sub> + β₅ A<sub>c,t</sub> + γ<sub>region</sub> + δ<sub>year</sub>)<small>Y — наблюдаемый контингент UIS; P — студенческий пул; D — расстояние; O — исходящая мобильность; T — охват высшим образованием; A — согласованность голосования; γ и δ — фиксированные эффекты.</small></div>
      <p>Пропуски в отдельных объясняющих переменных сопровождаются индикаторами отсутствия. Оценивание выполняется методом пуассоновского псевдомаксимального правдоподобия; ковариационная матрица кластеризуется по стране происхождения.</p>
      ${metrics([["Наблюдений", fmt0(g.n_observations), `${g.n_origins} стран × ${g.n_years} лет`, "model"],["Положительных строк", fmt0(g.n_positive_flows), "нулевые значения сохранены", "model"],["Параметров", fmt0(g.n_parameters), "включая фиксированные эффекты", "model"],["Период", esc(g.full_fit_period || g.training_period || "—"), "финальная оценка", "model"]])}`, { source: `${g.model_id}; ${g.formula}; ${g.estimator}` }));
    pages.push(page("method", "Структурное распределение", `
      <span class="report-page-kicker">01 · Методология</span><h1>От предсказанных интенсивностей к структурным долям</h1>
      <p>Модельные интенсивности нормируются внутри каждого года, чтобы получить долю каждой страны в заданной совокупной ёмкости.</p>
      <div class="report-formula">s<sub>c,t</sub> = exp(X<sub>c,t</sub>β) / Σ<sub>j</sub> exp(X<sub>j,t</sub>β)</div>
      <div class="report-formula">A<sub>c,t</sub> = C<sub>t</sub> × s<sub>c,t</sub><small>A — структурная ёмкость страны; C — общий сценарный объём, одинаковый для всех стран в данном году.</small></div>
      <p>Такая нормировка означает, что положительные и отрицательные отклонения между странами являются перераспределительными. Их нельзя складывать как дополнительный национальный набор.</p>
      <div class="report-callout is-red"><strong>Запрещённая интерпретация:</strong> «сумма всех положительных разрывов — это ещё столько-то студентов для России». Разрыв отражает относительную недопредставленность внутри общей ёмкости.</div>`, { source: "potentialForecast.semantics; gravityModel.model_role" }));
    pages.push(page("method", "Сценарии общей ёмкости", `
      <span class="report-page-kicker">01 · Методология</span><h1>Три сценария общей ёмкости</h1>
      <div class="report-formula">C<sub>t</sub><sup>(ε)</sup> = S<sub>2023</sub> × R<sub>t</sub><sup>ε</sup><small>S₍₂₀₂₃₎ — наблюдаемый общий контингент; Rₜ — относительное изменение совокупного студенческого пула; ε ∈ {0,5; 1,0; 1,5}.</small></div>
      <div class="report-card-grid"><article class="report-card is-green"><h3>Сдержанный, ε=0,5</h3><p>Общая ёмкость реагирует на демографический рынок слабее пропорционально.</p></article><article class="report-card is-blue"><h3>Демографический, ε=1,0</h3><p>Изменение общей ёмкости пропорционально изменению совокупного пула.</p></article><article class="report-card is-gold"><h3>Ускоренный, ε=1,5</h3><p>Предполагается усиленная реакция системы на расширение возрастной базы.</p></article><article class="report-card is-red"><h3>Не прогноз бюджета</h3><p>Сценарии не учитывают автоматически квоты, стоимость, визовые ограничения и институциональные мощности.</p></article></div>`, { source: "potentialForecast.capacityScenarios; capacity_scenario_policy" }));
    pages.push(page("method", "Неопределённость", `
      <span class="report-page-kicker">01 · Методология</span><h1>Интервалы и неопределённость</h1>
      <p>Параметрическая неопределённость структурного распределения оценивается симуляцией коэффициентов из многомерного нормального распределения с ковариационной матрицей финальной PPML-модели.</p>
      <div class="report-formula">β<sup>(b)</sup> ~ N(β̂, V̂), &nbsp; b = 1,…,600</div>
      <p>Для каждой симуляции пересчитываются доли, ёмкость и разрыв. Публикуются медиана и квантили 2,5%/97,5%, а также вероятность положительного разрыва и попадания в топ-10/топ-20.</p>
      ${metrics([["Симуляций", "600", "коэффициентные выборки", "model"],["Интервал", "95%", "2,5–97,5 перцентиль", "model"],["Что охвачено", "параметры", "ковариация коэффициентов", "model"],["Что не охвачено", "все будущие шоки", "не полный predictive interval", "warning"]])}
      <div class="report-callout"><strong>Терминологическая точность.</strong> В релизе это интервал параметрической неопределённости на ограниченном структурном распределении, а не полный прогнозный интервал будущего набора.</div>`, { source: "potentialForecast.parameter_draw_count; prediction_interval_semantics" }));
    pages.push(page("method", "Методика рейтингов", `
      <span class="report-page-kicker">01 · Методология</span><h1>Правила рейтингов и подавление ложной точности</h1>
      <ol>
        <li>В фактический рейтинг разрыва входят строки с подтверждённым контингентом и модельной ёмкостью.</li>
        <li>Основной порядок задаётся устойчивым рангом и медианным разрывом; рядом показываются вероятность положительного разрыва и диапазон ранга.</li>
        <li>Для восприимчивости точный ранг не должен трактоваться как устойчивый при широком интервале или низком компонентном покрытии.</li>
        <li>Для матрицы итоговый балл — медиана по нескольким сценариям весов; диапазон сценариев публикуется обязательно.</li>
        <li>Равенства и пропуски не «разрешаются» искусственными десятичными знаками.</li>
      </ol>
      <div class="report-formula">Robust rank = rank{median score, coverage, interval width, scenario stability}</div>
      <div class="report-callout is-blue">Рейтинг — это упорядочивание для скрининга. Причинный эффект рекрутингового инструмента может быть установлен только после пилота и дизайна оценки.</div>`, { source: "friendlinessIndex.rankPolicy; factPotentialGap.semantics; countryProgramMatrix.model" }));
    pages.push(page("method", "Ограничения", `
      <span class="report-page-kicker">01 · Методология</span><h1>Методические ограничения</h1>
      <ul>
        <li>UIS измеряет зачисленный контингент международно мобильных студентов, а не новые ежегодные зачисления.</li>
        <li>Периоды публикации источников различаются; последний доступный год не всегда одинаков для всех переменных.</li>
        <li>Демографический пул не включает поведенческие решения домохозяйств и институтов.</li>
        <li>Структурная PPML-модель предназначена для объяснения распределения, а не для оперативного точечного прогноза.</li>
        <li>Индекс восприимчивости объединяет неоднородные компоненты; отсутствие опроса остаётся отсутствием данных, а не нулевой установкой.</li>
        <li>Тематическая выборка вакансий не является переписью российского рынка труда.</li>
        <li>Матрица приоритетов зависит от весов; поэтому публикуются сценарии и диапазон устойчивости.</li>
        <li>Ни один индекс не заменяет правовую, финансовую и репутационную экспертизу конкретного решения.</li>
      </ul>`, { source: "metadata; module semantics and model cards" }));
    return pages;
  }

  function buildInboundPages(data) {
    const p = data.payload;
    const rows = p.russiaInbound?.topOrigins || [];
    const years = (p.russiaInbound?.yearTotals || []).filter((r) => num(r.students_observed) > 0);
    const latest = years.at(-1) || {};
    const pages = [divider("inbound", "02", "Наблюдаемый контингент иностранных студентов", "Фактические строки UIS: масштаб, происхождение, динамика и покрытие.", [["Последний год", latest.year || p.russiaInbound?.latestYear], ["Контингент", fmt0(latest.students_observed)], ["Стран в топ-таблице", fmt0(rows.length)]])];
    pages.push(page("inbound", "Динамика общего контингента", `
      <span class="report-page-kicker">02 · Наблюдаемый контингент</span><h1>Общий контингент по годам</h1>
      ${lineChart(years, r => r.year, [{ label: "Студенты UIS", value: r => r.students_observed }], { zero: true, caption: "Наблюдаемый зачисленный контингент международно мобильных студентов в России. Нулевые технические годы после последнего содержательного среза исключены из графика." })}
      ${metrics([["Начало ряда", years[0]?.year || "—", fmt0(years[0]?.students_observed), "official"],["Последний год", latest.year || "—", fmt0(latest.students_observed), "official"],["Изменение", years.length > 1 ? pct(num(latest.students_observed) / Math.max(1,num(years[0].students_observed)) - 1) : "—", "за весь доступный ряд", "official"],["Тип", "контингент", "не годовой приток", "warning"]])}`, { source: "unesco_uis_opri_202602; russiaInbound.yearTotals" }));
    pages.push(page("inbound", "Крупнейшие страны происхождения", `
      <span class="report-page-kicker">02 · Наблюдаемый контингент</span><h1>Крупнейшие страны происхождения</h1>
      ${barChart(rows.slice(0,15), r => countryName(r.origin_iso3, r.origin_name), r => r.students_observed, { limit: 15, caption: `Срез ${p.russiaInbound?.latestYear} года; только наблюдаемые строки UIS.` })}`, { source: "russiaInbound.topOrigins; UNESCO UIS OPRI" }));
    chunks(rows, 10).forEach((part, index) => pages.push(page("inbound", `Рейтинг стран происхождения — часть ${index + 1}`, `
      <span class="report-page-kicker">02 · Наблюдаемый контингент</span><h1>Рейтинг стран происхождения · ${index + 1}</h1>
      ${table(part, [
        { label: "Место", value: (_, i) => index * 10 + i + 1, num: true },
        { label: "Страна", value: r => countryName(r.origin_iso3, r.origin_name) },
        { label: "ISO3", value: "origin_iso3" },
        { label: "Год", value: "year", num: true },
        { label: "Студенты", value: r => fmt0(r.students_observed), num: true },
        { label: "Статус", value: r => r.observation_status || "official" },
      ], { caption: `Наблюдаемый контингент, строки ${index * 10 + 1}–${index * 10 + part.length}` })}
      <p class="report-source-line"><strong>Проверяемость:</strong> каждая строка содержит trace_id, исходное значение, единицу, период, checksum и transform_script в каноническом JSON.</p>`, { source: "unesco_uis_opri_202602; russiaInbound.topOrigins" })));
    const byRegion = new Map();
    rows.forEach((row) => {
      const region = data.countryMap.get(row.origin_iso3)?.region || "Не классифицировано";
      if (!byRegion.has(region)) byRegion.set(region, []);
      byRegion.get(region).push(row);
    });
    const regional = [...byRegion.entries()].map(([region, items]) => ({ region, students: sum(items, r => r.students_observed), countries: items.length })).sort((a,b) => b.students-a.students);
    pages.push(page("inbound", "Региональная структура", `
      <span class="report-page-kicker">02 · Наблюдаемый контингент</span><h1>Региональная структура происхождения</h1>
      ${barChart(regional, r => r.region, r => r.students, { limit: 12, left: 250, caption: "Агрегирование выполнено по региональной классификации публичного справочника стран." })}
      ${table(regional, [{label:"Регион",value:"region"},{label:"Стран",value:r=>fmt0(r.countries),num:true},{label:"Студенты",value:r=>fmt0(r.students),num:true},{label:"Доля",value:r=>pct(r.students/Math.max(1,latest.students_observed)),num:true}], { caption:"Региональные агрегаты" })}`, { source: "russiaInbound.topOrigins; public_country_reference.region" }));
    pages.push(page("inbound", "Семантика показателя UIS", `
      <span class="report-page-kicker">02 · Наблюдаемый контингент</span><h1>Что именно измеряет показатель</h1>
      <dl class="report-definition-list"><div><dt>Объект</dt><dd>Международно мобильный студент, пересёкший национальную границу для получения образования.</dd></div><div><dt>Показатель</dt><dd>Численность зачисленных на программы третичного или высшего образования в стране назначения.</dd></div><div><dt>Направление</dt><dd>Страна происхождения → Российская Федерация.</dd></div><div><dt>Время</dt><dd>Контингент в отчётном году; не кумулятивная сумма и не новые зачисления.</dd></div><div><dt>Исключение</dt><dd>Показатель не равен гражданству всех иностранных обучающихся, если методика источника использует критерий мобильности.</dd></div></dl>
      <div class="report-callout"><strong>Управленческое следствие.</strong> Для оценки рекрутинговой воронки этот показатель следует дополнять заявками, предложениями о зачислении, новыми зачислениями и сохранением контингента.</div>`, { source: "UNESCO UIS OPRI indicator metadata; dependent_variable_semantics" }));
    pages.push(page("inbound", "Покрытие и контроль качества UIS", `
      <span class="report-page-kicker">02 · Наблюдаемый контингент</span><h1>Покрытие и контроль качества</h1>
      ${metrics([["Источник max year", p.russiaInbound?.sourceMaxYear || "—", "максимальный период архива", "official"],["Содержательный год", p.russiaInbound?.latestYear || "—", "используется в рейтинге", "official"],["Checksum", truncate(rows[0]?.sha256_or_etag || "—", 18), "единый сырой архив", "official"],["Лицензия", rows[0]?.license_or_terms || "—", "условия распространения", "official"]])}
      <ul><li>Технические нулевые строки после последнего содержательного года не трактуются как фактическое исчезновение контингента.</li><li>Страны без опубликованной строки не получают искусственный ноль.</li><li>Рейтинг строится только по доступным наблюдаемым строкам выбранного года.</li><li>При обновлении архива требуется повторная проверка схемы, индикатора, единиц и квалификаторов.</li></ul>
      <p>${esc(p.russiaInbound?.coverageNote || "")}</p>`, { source: "russiaInbound.coverageNote; sourceRegistry.unesco_uis_opri_202602" }));
    return pages;
  }

  function buildDemographyPages(data) {
    const rows = data.countryRows.filter((r) => r.demography).map((r) => {
      const d = r.demography || {};
      const p26 = num(d.studentPool2026), p35 = num(d.studentPool2035), p50 = num(d.studentPool2050);
      return { ...r, p26, p35, p50, growth: p26 ? p50 / p26 - 1 : 0, delta: p50 - p26 };
    });
    const top = rows.slice().sort((a,b) => b.p26-a.p26);
    const growth = rows.filter(r => r.p26 > 100000).slice().sort((a,b) => b.delta-a.delta);
    const decline = rows.filter(r => r.p26 > 100000).slice().sort((a,b) => a.delta-b.delta);
    const pages = [divider("demography", "03", "Демографическая база образовательных рынков", "Возрастная структура и официальный средний вариант проекций населения до 2050 года.", [["Стран", fmt0(rows.length)], ["Опорные годы", "2026 · 2035 · 2050"], ["Источник", "UN WPP 2024"]])];
    pages.push(page("demography", "Крупнейшие студенческие пулы", `
      <span class="report-page-kicker">03 · Демография</span><h1>Крупнейшие образовательные рынки в 2026 году</h1>
      ${barChart(top.slice(0,15), r => countryName(r.iso3,r.name), r => r.p26, { limit: 15, caption: "Производный студенческий пул: население 15–24 лет плюс 45% населения 25–29 лет." })}`, { source: "public_country_reference.demography; UN WPP 2024" }));
    pages.push(page("demography", "Рост возрастной базы к 2050 году", `
      <span class="report-page-kicker">03 · Демография</span><h1>Наибольшее абсолютное расширение к 2050 году</h1>
      ${barChart(growth.slice(0,15), r => countryName(r.iso3,r.name), r => r.delta, { limit: 15, format: v => `${v >= 0 ? "+" : ""}${fmt0(v)}`, caption: "Абсолютное изменение производного студенческого пула между 2026 и 2050 годами." })}`, { source: "UN WPP 2024 Medium variant; analytical student-pool transform" }));
    pages.push(page("demography", "Сокращение возрастной базы", `
      <span class="report-page-kicker">03 · Демография</span><h1>Наибольшее абсолютное сокращение к 2050 году</h1>
      ${barChart(decline.slice(0,15), r => countryName(r.iso3,r.name), r => Math.abs(r.delta), { limit: 15, format: v => `−${fmt0(v)}`, caption: "Страны с наибольшим отрицательным изменением; модуль не трактует сокращение как отсутствие рекрутингового потенциала." })}
      <div class="report-callout"><strong>Интерпретация.</strong> Демографическая динамика задаёт масштаб рынка, но не заменяет показатели мобильности, доступности, качества спроса и институциональных связей.</div>`, { source: "UN WPP 2024 Medium variant" }));
    const regionalMap = new Map();
    rows.forEach((r) => {
      const key = r.region || "Не классифицировано";
      if (!regionalMap.has(key)) regionalMap.set(key, { region:key,p26:0,p35:0,p50:0,countries:0 });
      const x = regionalMap.get(key); x.p26 += r.p26; x.p35 += r.p35; x.p50 += r.p50; x.countries += 1;
    });
    const regional = [...regionalMap.values()].sort((a,b)=>b.p26-a.p26);
    pages.push(page("demography", "Региональная траектория", `
      <span class="report-page-kicker">03 · Демография</span><h1>Региональные агрегаты студенческого пула</h1>
      ${table(regional,[{label:"Регион",value:"region"},{label:"Стран",value:r=>fmt0(r.countries),num:true},{label:"2026",value:r=>fmt0(r.p26),num:true},{label:"2035",value:r=>fmt0(r.p35),num:true},{label:"2050",value:r=>fmt0(r.p50),num:true},{label:"2026–2050",value:r=>pct(r.p26?r.p50/r.p26-1:0),num:true}],{caption:"Агрегирование по регионам справочника стран",dense:true})}`, { source: "public_country_reference.region and demography" }));
    chunks(top.slice(0,60),15).forEach((part,index)=>pages.push(page("demography",`Рейтинг демографических рынков — ${index+1}`,`
      <span class="report-page-kicker">03 · Демография</span><h1>Рейтинг образовательных рынков · ${index+1}</h1>
      ${table(part,[{label:"Место",value:(_,i)=>index*15+i+1,num:true},{label:"Страна",value:r=>countryName(r.iso3,r.name)},{label:"Регион",value:r=>r.region||"—"},{label:"2026",value:r=>fmt0(r.p26),num:true},{label:"2035",value:r=>fmt0(r.p35),num:true},{label:"2050",value:r=>fmt0(r.p50),num:true},{label:"Δ, %",value:r=>pct(r.growth),num:true}],{caption:`Производный студенческий пул, строки ${index*15+1}–${index*15+part.length}`,dense:true})}`,{source:"UN WPP 2024; public_country_reference"})));
    const selected = data.profileCountries.slice(0,5).map(x=>x.iso3).filter(iso=>data.countries?.demographySeries?.[iso]);
    if (selected.length) {
      const points = [2026,2030,2035,2040,2045,2050].map(year=>({year}));
      pages.push(page("demography","Траектории приоритетных рынков",`
        <span class="report-page-kicker">03 · Демография</span><h1>Траектории первых приоритетных рынков</h1>
        ${lineChart(points,r=>r.year,selected.slice(0,4).map(iso=>({label:countryName(iso),value:r=>{
          const series=[...(data.countries.demographySeries[iso]?.actual||[]),...(data.countries.demographySeries[iso]?.forecast||[])];
          return series.find(x=>num(x.year)===num(r.year))?.student_pool||0;
        }})),{zero:true,caption:"Ряд построен из канонических демографических серий; страны выбраны по первой строке матрицы приоритетов."})}
        <p>Сопоставление траекторий показывает, почему текущий масштаб и будущая динамика должны анализироваться раздельно: крупный рынок может сокращаться, а меньший — быстро расширяться.</p>`,{source:"public_country_reference.demographySeries; countryProgramMatrix"}));
    }
    pages.push(page("demography","Ограничения демографического слоя",`
      <span class="report-page-kicker">03 · Демография</span><h1>Ограничения демографического слоя</h1>
      <ul><li>Проекции населения являются сценарными оценками, а не наблюдаемыми будущими значениями.</li><li>Возрастная база не измеряет платежеспособность, качество среднего образования, языковую подготовку или намерение учиться за рубежом.</li><li>Коэффициент 0,45 для группы 25–29 лет — прозрачная аналитическая предпосылка платформы.</li><li>Малые государства и территории могут иметь высокие относительные темпы при небольшом абсолютном масштабе.</li><li>Для рекрутингового решения демография используется совместно с фактической мобильностью, структурным разрывом и институциональными ограничениями.</li></ul>
      <div class="report-callout is-blue"><strong>Рекомендуемая проверка.</strong> При ежегодном обновлении публиковать чувствительность рейтинга к альтернативному весу группы 25–29 лет и к вариантам WPP.</div>`,{source:"UN WPP 2024; analytical transform assumptions"}));
    return pages;
  }

  function validationRows(g) {
    const c = g.candidate_validation || {};
    return Object.entries(c).map(([name,value])=>({name,...(value.time_holdout_average||{}),selection:value.selection_score,terms:(value.terms||[]).length})).sort((a,b)=>num(a.selection,9999)-num(b.selection,9999));
  }

  function buildModelPages(data) {
    const g = data.payload.gravityModel || {};
    const coefficients = g.coefficients || [];
    const candidates = validationRows(g);
    const time = g.selected_time_holdout_average || {};
    const country = g.selected_country_holdout_average || {};
    const benchmark = g.persistence_benchmark?.time_holdout_average || {};
    const pages = [divider("model","04","Гравитационная модель и её диагностика","Структурное объяснение распределения контингента, независимая проверка и границы прогнозного использования.",[["Спецификация",g.selected_specification||"—"],["Наблюдений",fmt0(g.n_observations)],["Валидация",(g.validation_period||[]).join("–")]])];
    pages.push(page("model","Назначение модели",`
      <span class="report-page-kicker">04 · Модель</span><h1>Назначение и границы применения</h1>
      ${metrics([["Статус","проверена","структурная модель","model"],["Роль","структурная доля","и недопредставленность","model"],["Зависимая переменная","контингент","международно мобильные студенты","official"],["Бенчмарк лучше?",g.predictive_benchmark_outperforms_structural_model?"да":"нет","для краткого горизонта","warning"]])}
      <div class="report-card-grid"><article class="report-card is-blue"><h3>Для чего используется</h3><p>Оценка структурных долей стран при общей заданной ёмкости; выявление отклонений от демографической инерции; сценарный скрининг рынков.</p></article><article class="report-card is-red"><h3>Для чего не используется</h3><p>Точный краткосрочный прогноз набора, финансовый план, автоматическое назначение квот или причинная оценка рекрутинговой кампании.</p></article></div>
      <p>Модель объясняет структурное распределение стран происхождения и используется для анализа недопредставленности при заданной общей ёмкости.</p>`,{source:`${g.model_id}; gravityModel.model_role and status`}));
    pages.push(page("model","Финальная спецификация",`
      <span class="report-page-kicker">04 · Модель</span><h1>Финальная спецификация theory_ex_ante</h1>
      <div class="report-formula">${esc(g.formula||"students_observed ~ ln_student_pool + ln_distance + ln_outbound + tertiary_share + unga_alignment + region FE + year FE")}</div>
      <dl class="report-definition-list"><div><dt>Оцениватель</dt><dd>${esc(g.estimator||"—")}</dd></div><div><dt>Ковариация</dt><dd>Sandwich covariance с кластеризацией по стране происхождения.</dd></div><div><dt>Фиксированные эффекты</dt><dd>Регион и год; будущий общий временной эффект заменён явным сценарием совокупной ёмкости.</dd></div><div><dt>Пропуски</dt><dd>${esc(g.diagnostics?.missingness_policy||"—")}</dd></div><div><dt>ПО</dt><dd>${esc(g.software||"—")}</dd></div></dl>`,{source:`${g.model_id}; gravityModel.formula, estimator, diagnostics`}));
    chunks(coefficients,10).forEach((part,index)=>pages.push(page("model",`Коэффициенты — часть ${index+1}`,`
      <span class="report-page-kicker">04 · Модель</span><h1>Оценённые коэффициенты · ${index+1}</h1>
      ${table(part,[{label:"Термин",value:"term"},{label:"Оценка",value:r=>fmt2(r.estimate),num:true},{label:"Ст. ошибка",value:r=>fmt2(r.std_error),num:true},{label:"p-value",value:r=>num(r.p_value)<0.001?"<0,001":fmt2(r.p_value),num:true},{label:"95% low",value:r=>fmt2(r.conf_low),num:true},{label:"95% high",value:r=>fmt2(r.conf_high),num:true},{label:"Преобразование",value:r=>truncate(r.transform,45)}],{caption:`PPML-коэффициенты, строки ${index*10+1}–${index*10+part.length}`,dense:true})}
      <p class="report-source-line"><strong>Интерпретация:</strong> коэффициенты относятся к условному среднему при заданной спецификации. Для логарифмированных непрерывных признаков оценка близка к эластичности; фиктивные переменные требуют экспоненцирования.</p>`,{source:`${g.model_id}; gravityModel.coefficients`})));
    pages.push(page("model","Сравнение кандидатных спецификаций",`
      <span class="report-page-kicker">04 · Модель</span><h1>Сравнение кандидатных спецификаций</h1>
      ${table(candidates,[{label:"Модель",value:"name"},{label:"Терминов",value:r=>fmt0(r.terms),num:true},{label:"MAE доли, б.п.",value:r=>fmt1(r.share_mae_basis_points),num:true},{label:"Spearman",value:r=>fmt2(r.spearman_rank_correlation),num:true},{label:"Top-20 recall",value:r=>pct(r.top20_recall),num:true},{label:"MAE, чел.",value:r=>fmt0(r.mae_students),num:true},{label:"Selection score",value:r=>fmt1(r.selection),num:true}],{caption:"Средняя time-holdout валидация; меньше selection score — лучше",dense:true})}
      <div class="report-callout is-blue">Финальная спецификация выбиралась по совокупности ошибок распределения и ранговой способности, а не по статистической значимости отдельного коэффициента.</div>`,{source:"gravityModel.candidate_validation and selected_specification"}));
    pages.push(page("model","Time-holdout диагностика",`
      <span class="report-page-kicker">04 · Модель</span><h1>Проверка на последующих годах</h1>
      ${metrics([["MAE доли",`${fmt1(time.share_mae_basis_points)} б.п.`,"средняя абсолютная ошибка доли","model"],["Spearman",fmt2(time.spearman_rank_correlation),"ранговая корреляция","model"],["Top-20 recall",pct(time.top20_recall),"совпадение ведущих стран","model"],["RMSE",fmt0(time.rmse_students),"студентов","model"]])}
      <p>${esc(g.diagnostics?.time_holdout_interpretation||"")}</p>
      ${table(g.candidate_validation?.[g.selected_specification]?.time_holdout_by_year||[],[{label:"Год",value:"year",num:true},{label:"Наблюдений",value:r=>fmt0(r.rows),num:true},{label:"MAE, б.п.",value:r=>fmt1(r.share_mae_basis_points),num:true},{label:"Spearman",value:r=>fmt2(r.spearman_rank_correlation),num:true},{label:"Top-20 recall",value:r=>pct(r.top20_recall),num:true},{label:"RMSE",value:r=>fmt0(r.rmse_students),num:true}],{caption:"Отложенные годы"})}`,{source:"gravityModel.selected_time_holdout_average; candidate_validation"}));
    pages.push(page("model","Country-holdout диагностика",`
      <span class="report-page-kicker">04 · Модель</span><h1>Проверка переноса на удержанные страны</h1>
      ${metrics([["Средний fold",fmt1(country.fold),"групповая валидация","model"],["MAE доли",`${fmt1(country.share_mae_basis_points)} б.п.`,"выше time-holdout","model"],["Spearman",fmt2(country.spearman_rank_correlation),"ранговая связь","model"],["Top-20 recall",pct(country.top20_recall),"в среднем по folds","model"]])}
      <p>Country-holdout проверка отвечает на более сложный вопрос: насколько спецификация переносится на страны, не участвовавшие в оценивании соответствующего fold. Ошибки здесь закономерно выше, поэтому страновые оценки должны сопровождаться интервалами и экспертной проверкой.</p>
      <div class="report-callout"><strong>Управленческий вывод.</strong> Высокий балл для страны с редкими или неполными данными является гипотезой для верификации, а не готовым планом набора.</div>`,{source:"gravityModel.selected_country_holdout_average"}));
    pages.push(page("model","Сравнение с инерционным бенчмарком",`
      <span class="report-page-kicker">04 · Модель</span><h1>Структурная модель и инерционный бенчмарк</h1>
      ${table([{model:"PPML theory_ex_ante",...time},{model:"Инерция долей 2019–2021",...benchmark}],[{label:"Подход",value:"model"},{label:"MAE доли, б.п.",value:r=>fmt1(r.share_mae_basis_points),num:true},{label:"Spearman",value:r=>fmt2(r.spearman_rank_correlation),num:true},{label:"Top-20 recall",value:r=>pct(r.top20_recall),num:true},{label:"MAE, чел.",value:r=>fmt0(r.mae_students),num:true},{label:"RMSE, чел.",value:r=>fmt0(r.rmse_students),num:true}],{caption:"Краткосрочная проверка распределения"})}
      <div class="report-callout is-red"><strong>Результат:</strong> инерционный бенчмарк лучше предсказывает ближайшее распределение. Поэтому PPML не используется как краткосрочный point forecast. Его ценность — структурная интерпретация и поиск недопредставленных рынков без включения лагов самой зависимой переменной.</div>`,{source:"gravityModel.persistence_benchmark; predictive_benchmark_outperforms_structural_model"}));
    pages.push(page("model","Политика будущих ковариат",`
      <span class="report-page-kicker">04 · Модель</span><h1>Как формируются значения до 2050 года</h1>
      <p>${esc(g.diagnostics?.future_covariate_policy||"")}</p>
      <div class="report-card-grid"><article class="report-card is-green"><h3>Меняется</h3><p>Демографический студенческий пул по официальной средней проекции WPP.</p></article><article class="report-card is-blue"><h3>Постоянно</h3><p>Географическое расстояние как инвариантная характеристика.</p></article><article class="report-card is-gold"><h3>Заморожено</h3><p>Исходящая мобильность, охват высшим образованием и дипломатическая согласованность — на последних доступных значениях.</p></article><article class="report-card is-red"><h3>Не моделируется</h3><p>Будущие политические шоки, стоимость обучения, визовые режимы и кампании МГИМО.</p></article></div>
      <p>Такая политика делает сценарий прозрачным и воспроизводимым, но не превращает его в полноценную динамическую модель всех факторов.</p>`,{source:"gravityModel.diagnostics.future_covariate_policy"}));
    pages.push(page("model","Диагностика и аудит",`
      <span class="report-page-kicker">04 · Модель</span><h1>Диагностика и аудит модели</h1>
      <dl class="report-definition-list"><div><dt>Сходимость</dt><dd>${g.diagnostics?.converged?"Да":"Нет"}</dd></div><div><dt>Исключённые годы</dt><dd>${esc(g.diagnostics?.excluded_years||"—")}</dd></div><div><dt>Годовые эффекты</dt><dd>${esc(g.diagnostics?.year_effects||"—")}</dd></div><div><dt>Бенчмарк</dt><dd>${esc(g.diagnostics?.benchmark_policy||"—")}</dd></div><div><dt>MAE in-sample</dt><dd>${fmt0(g.fit_metrics?.mae)} студентов</dd></div><div><dt>RMSE in-sample</dt><dd>${fmt0(g.fit_metrics?.rmse)} студентов</dd></div></dl>
      <div class="report-callout is-green"><strong>Минимальный пакет воспроизводимости:</strong> формула, период оценки, версии библиотек, коэффициенты и ковариация, входные хэши, код преобразования, holdout-метрики и бенчмарк.</div>`,{source:"gravityModel.diagnostics, fit_metrics, software, source_keys"}));
    pages.push(page("model","Корректное управленческое использование",`
      <span class="report-page-kicker">04 · Модель</span><h1>Корректное управленческое использование</h1>
      <ol><li>Использовать структурный разрыв для формирования списка рынков, требующих проверки.</li><li>Сопоставлять оценку с фактическим контингентом, интервалом, покрытием и политико-институциональным контекстом.</li><li>Не планировать бюджет и набор по одной медианной оценке.</li><li>Для горизонта 1–2 года держать рядом инерционный прогноз и операционные данные воронки.</li><li>После пилотной кампании оценивать причинный эффект и обновлять управленческую матрицу.</li></ol>
      <div class="report-formula">Structural evidence + operational pipeline + experiment = defensible decision</div>`,{source:"gravityModel.model_role; persistence_benchmark; countryProgramMatrix evaluation fields"}));
    return pages;
  }

  function buildForecastPages(data) {
    const p = data.payload;
    const scenarios = p.potentialForecast?.capacityScenarios || [];
    const forecast2026 = (p.potentialForecast?.rows || []).filter(r=>num(r.year)===2026).sort((a,b)=>num(b.model_based_attraction_capacity)-num(a.model_based_attraction_capacity));
    const gaps = (p.factPotentialGap?.top || []).filter(r=>!r.excluded_from_rank).sort((a,b)=>num(a.rank_robust_unrealized_potential||a.rank_unrealized_potential,9999)-num(b.rank_robust_unrealized_potential||b.rank_unrealized_potential,9999));
    const selectedYears = scenarios.filter(r=>[2026,2030,2035,2040,2045,2050].includes(num(r.year)));
    const pages=[divider("forecast","05","Сценарии структурной ёмкости и разрыв","Три пути общей ёмкости, структурное распределение стран и устойчивость недопредставленности.",[["Горизонт","2026–2050"],["Сценариев","3"],["Симуляций параметров","600"]])];
    pages.push(page("forecast","Траектория общей ёмкости",`
      <span class="report-page-kicker">05 · Сценарии</span><h1>Общая структурная ёмкость России</h1>
      ${lineChart(scenarios,r=>r.year,[{label:"Сдержанный",value:r=>r.aggregate_capacity_constrained},{label:"Демографический",value:r=>r.aggregate_capacity_demographic},{label:"Ускоренный",value:r=>r.aggregate_capacity_accelerated}],{zero:true,caption:"Все пути привязаны к наблюдаемому общему контингенту 2023 года и различаются эластичностью к совокупному демографическому пулу."})}
      ${metrics([["База 2023",fmt0(scenarios[0]?.baseline_observed_students_2023),"наблюдаемый UIS","official"],["2050, сдержанный",fmt0(scenarios.at(-1)?.aggregate_capacity_constrained),"ε=0,5","model"],["2050, базовый",fmt0(scenarios.at(-1)?.aggregate_capacity_demographic),"ε=1,0","model"],["2050, ускоренный",fmt0(scenarios.at(-1)?.aggregate_capacity_accelerated),"ε=1,5","model"]])}`,{source:"potentialForecast.capacityScenarios; UNESCO UIS + UN WPP"}));
    pages.push(page("forecast","Опорные значения сценариев",`
      <span class="report-page-kicker">05 · Сценарии</span><h1>Опорные значения до 2050 года</h1>
      ${table(selectedYears,[{label:"Год",value:"year",num:true},{label:"WPP ratio",value:r=>fmt2(r.wpp_capacity_ratio),num:true},{label:"Сдержанный",value:r=>fmt0(r.aggregate_capacity_constrained),num:true},{label:"Демографический",value:r=>fmt0(r.aggregate_capacity_demographic),num:true},{label:"Ускоренный",value:r=>fmt0(r.aggregate_capacity_accelerated),num:true},{label:"Статус",value:r=>r.observation_status||"scenario"}],{caption:"Сценарные значения общей ёмкости"})}
      <div class="report-callout"><strong>Необходимое условие чтения.</strong> Это эквиваленты ёмкости при заданной демографической чувствительности. Они не учитывают автоматически бюджет, общежития, визовый режим, качество рекрутинга и институциональные ограничения.</div>`,{source:"potentialForecast.capacityScenarios and semantics"}));
    pages.push(page("forecast","Структурная ёмкость стран",`
      <span class="report-page-kicker">05 · Сценарии</span><h1>Крупнейшие структурные ёмкости в 2026 году</h1>
      ${barChart(forecast2026.slice(0,15),r=>countryName(r.origin_iso3,r.origin_country),r=>r.model_based_attraction_capacity,{limit:15,caption:"Распределение базовой общей ёмкости пропорционально структурным долям PPML; не прогноз фактического набора."})}`,{source:"potentialForecast.rows, year=2026; gravity model"}));
    pages.push(page("forecast","Разрыв: определение",`
      <span class="report-page-kicker">05 · Сценарии</span><h1>Структурная недопредставленность</h1>
      <div class="report-formula">G<sub>c,t</sub> = A<sub>c,t</sub> − B<sub>c,t</sub><small>A — PPML-структурная ёмкость; B — демографический инерционный ориентир при том же общем объёме.</small></div>
      <p>Положительный G означает, что структурная модель отводит стране большую долю, чем демографическое продолжение сложившегося распределения. Отрицательный G означает обратное.</p>
      <div class="report-formula">Σ<sub>c</sub> G<sub>c,t</sub> = 0<small>Разрывы перераспределительны: положительные и отрицательные значения взаимно компенсируются.</small></div>
      <div class="report-callout is-red">Разрыв не равен «упущенным студентам» в бухгалтерском смысле и не может быть автоматически превращён в целевой набор.</div>`,{source:"factPotentialGap.semantics; potentialForecast structural allocation"}));
    pages.push(page("forecast","Лидеры устойчивого разрыва",`
      <span class="report-page-kicker">05 · Сценарии</span><h1>Лидеры устойчивого положительного разрыва</h1>
      ${barChart(gaps.slice(0,15),r=>countryName(r.origin_iso3,r.origin_country),r=>r.gap_parameter_q50||r.gap_abs,{limit:15,caption:"Медиана параметрического распределения разрыва; рядом в таблицах публикуются вероятность положительного значения и диапазон ранга."})}`,{source:"factPotentialGap.top; coefficient simulations"}));
    chunks(gaps,11).forEach((part,index)=>pages.push(page("forecast",`Рейтинг разрыва — часть ${index+1}`,`
      <span class="report-page-kicker">05 · Сценарии</span><h1>Рейтинг структурного разрыва · ${index+1}</h1>
      ${table(part,[{label:"Уст. место",value:r=>fmt0(r.rank_robust_unrealized_potential||r.rank_unrealized_potential),num:true},{label:"Страна",value:r=>countryName(r.origin_iso3,r.origin_country)},{label:"Факт",value:r=>fmt0(r.actual_students_latest),num:true},{label:"Ёмкость",value:r=>fmt0(r.model_based_attraction_capacity),num:true},{label:"Разрыв q50",value:r=>fmt0(r.gap_parameter_q50||r.gap_abs),num:true},{label:"95% интервал",value:r=>`${fmt0(r.gap_parameter_q025)} … ${fmt0(r.gap_parameter_q975)}`},{label:"P(G>0)",value:r=>pct(r.probability_positive_representation_gap),num:true},{label:"Top-20",value:r=>pct(r.probability_top20_unrealized_potential),num:true}],{caption:`Устойчивый рейтинг, строки ${index*11+1}–${index*11+part.length}`,dense:true})}`,{source:"factPotentialGap.top; parameter draws=600"})));
    pages.push(page("forecast","Классы устойчивости разрыва",`
      <span class="report-page-kicker">05 · Сценарии</span><h1>Классы неопределённости</h1>
      ${table(Object.entries(gaps.reduce((acc,r)=>{const k=r.gap_uncertainty_class||"not_classified";acc[k]=(acc[k]||0)+1;return acc;},{})).map(([klass,count])=>({klass,count})),[{label:"Класс",value:"klass"},{label:"Стран",value:r=>fmt0(r.count),num:true},{label:"Интерпретация",value:r=>({stable_positive:"Интервал и вероятность поддерживают положительную недопредставленность",unstable_or_mixed:"Знак или место чувствительны к параметрам",stable_negative:"Структурная доля ниже демографического ориентира",not_classified:"Класс не присвоен"}[r.klass]||"См. модельный паспорт")}],{caption:"Распределение строк по классам"})}
      <p>Приоритет для верификации должен определяться не только медианой, но и вероятностью положительного разрыва, устойчивостью ранга, фактическим масштабом и качеством остальных доказательств.</p>`,{source:"factPotentialGap gap_uncertainty_class and rank quantiles"}));
    pages.push(page("forecast","Порядок использования сценариев",`
      <span class="report-page-kicker">05 · Сценарии</span><h1>Порядок использования в планировании</h1>
      <ol><li>Выбрать сценарий общей ёмкости исходя из стратегического допущения, а не из желаемого результата.</li><li>Рассмотреть структурное распределение стран и его интервал.</li><li>Сопоставить с инерционным ориентиром и фактическим контингентом.</li><li>Отфильтровать строки с недостаточным покрытием восприимчивости или нестабильными программными баллами.</li><li>Для оставшихся рынков сформировать пилот с заранее заданными KPI и контрольной группой/сравнением.</li></ol>
      <div class="report-callout is-green"><strong>Корректный выход раздела:</strong> не «план набора 2050», а ранжированный перечень проверяемых гипотез при нескольких прозрачных сценариях.</div>`,{source:"potentialForecast.semantics; countryProgramMatrix.effect_policy"}));
    return pages;
  }

  function buildReceptivityPages(data) {
    const p=data.payload;
    const rows=(p.friendlinessIndex?.rows||[]).slice();
    const ranked=rows.filter(r=>num(r.component_coverage_score)>0).sort((a,b)=>num(b.friendliness_ex_ante_score)-num(a.friendliness_ex_ante_score));
    const components=[...new Map((p.friendlinessIndex?.components||[]).map(r=>[r.component,{component:r.component,weight:r.component_weight,method:r.normalization_method,source:r.source_key}])).values()].sort((a,b)=>num(b.weight)-num(a.weight));
    const demand=(p.vacancyCompetency?.programDemand||[]).slice().sort((a,b)=>num(b.program_labor_demand_score)-num(a.program_labor_demand_score));
    const pages=[divider("receptivity","06","Восприимчивость, компетенции и рынок труда","Композитный ex ante индекс, границы его идентифицируемости и обезличенный сигнал спроса на программы.",[["Стран в индексе",fmt0(rows.length)],["Компонентов",fmt0(components.length)],["Вакансий во входе",fmt0(p.vacancyCompetency?.inputUniqueVacancies)]])];
    pages.push(page("receptivity","Конструкция индекса восприимчивости",`
      <span class="report-page-kicker">06 · Восприимчивость</span><h1>Компоненты и веса</h1>
      <div class="report-formula">F<sub>c</sub> = 100 × Σ w<sub>k</sub> z<sub>c,k</sub><small>При отсутствии компонента публикуются нейтральная точечная импутация и консервативная/оптимистическая границы; покрытие показывается отдельно.</small></div>
      ${table(components,[{label:"Компонент",value:"component"},{label:"Вес",value:r=>pct(r.weight),num:true},{label:"Нормализация",value:r=>truncate(r.method,100)},{label:"Источник",value:"source"}],{caption:"Компоненты ex ante восприимчивости",dense:true})}`,{source:"friendlinessIndex.components; friendliness_receptivity_ex_ante_v4"}));
    pages.push(page("receptivity","Отсутствующие компоненты",`
      <span class="report-page-kicker">06 · Восприимчивость</span><h1>Пропуски и границы</h1>
      <p>Отсутствие опроса общественного мнения или языкового компонента не превращается в ноль. Точечная оценка использует нейтральное значение 0,5, а границы заменяют отсутствующий компонент на 0 и 1.</p>
      <div class="report-formula">F<sup>point</sup>: z<sub>missing</sub>=0,5; &nbsp; F<sup>low</sup>: z<sub>missing</sub>=0; &nbsp; F<sup>high</sup>: z<sub>missing</sub>=1</div>
      ${metrics([["Политика ранга","подавлен","при широких интервалах","warning"],["Покрытие", "0–1", "сумма доступных весов", "model"],["Опрос", "не интерполируется", "на страны без выборки", "warning"],["Формальный доступ", "не отношение", "административный индикатор", "warning"]])}
      <div class="report-callout is-red">Точечный индекс при низком покрытии нельзя трактовать как измеренную «дружелюбность населения».</div>`,{source:"friendlinessIndex.rankPolicy; component normalization methods"}));
    pages.push(page("receptivity","Ведущие точечные оценки",`
      <span class="report-page-kicker">06 · Восприимчивость</span><h1>Высокие точечные оценки при доступном покрытии</h1>
      ${barChart(ranked.filter(r=>num(r.component_coverage_score)>=0.5).slice(0,15),r=>countryName(r.iso3,r.country),r=>r.friendliness_ex_ante_score,{limit:15,format:v=>fmt1(v),caption:"Точечный балл показан вместе с обязательным требованием смотреть покрытие и диапазон."})}`,{source:"friendlinessIndex.rows"}));
    chunks(ranked.filter(r=>num(r.component_coverage_score)>=0.4).slice(0,40),10).forEach((part,index)=>pages.push(page("receptivity",`Таблица восприимчивости — ${index+1}`,`
      <span class="report-page-kicker">06 · Восприимчивость</span><h1>Профили восприимчивости · ${index+1}</h1>
      ${table(part,[{label:"Страна",value:r=>countryName(r.iso3,r.country)},{label:"Точка",value:r=>fmt1(r.friendliness_ex_ante_score),num:true},{label:"Low",value:r=>fmt1(r.conservative_lower_bound),num:true},{label:"High",value:r=>fmt1(r.optimistic_upper_bound),num:true},{label:"Покрытие",value:r=>pct(r.component_coverage_score),num:true},{label:"Компонентов",value:r=>fmt0(r.component_count_available),num:true},{label:"Надёжность",value:r=>r.evidence_reliability_class||"—"},{label:"Ранг",value:r=>r.rank_for_display||"подавлен"}],{caption:`Строки ${index*10+1}–${index*10+part.length}; точный ранг не считается идентифицированным при широких границах`,dense:true})}`,{source:"friendlinessIndex.rows and rankPolicy"})));
    pages.push(page("receptivity","Спрос на программные компетенции",`
      <span class="report-page-kicker">06 · Компетенции</span><h1>Относительный спрос по программным группам</h1>
      ${barChart(demand,r=>programLabel(r),r=>r.program_labor_demand_score,{limit:8,format:v=>fmt1(v),caption:"Индекс построен на уникальных классифицированных вакансиях; поисковые количества API исключены из балла."})}
      ${table(demand,[{label:"Программа",value:programLabel},{label:"Вакансий",value:r=>fmt0(r.classified_unique_vacancies),num:true},{label:"Работодателей",value:r=>fmt0(r.unique_employers),num:true},{label:"Регионов",value:r=>fmt0(r.unique_regions),num:true},{label:"Балл",value:r=>fmt1(r.program_labor_demand_score),num:true},{label:"p05–p95",value:r=>`${fmt1(r.labor_demand_score_p05)}–${fmt1(r.labor_demand_score_p95)}`}],{caption:"Тематический обезличенный снимок Работа в России",dense:true})}`,{source:"vacancyCompetency.programDemand; trudvsem_open_data_api"}));
    pages.push(page("receptivity","Формула трудового индекса",`
      <span class="report-page-kicker">06 · Компетенции</span><h1>Формула трудового сигнала</h1>
      <div class="report-formula">L = 0,45V + 0,15W + 0,10E + 0,10R + 0,08S + 0,07H + 0,05K<small>V — уникальные вакансии; W — рабочие места; E — работодатели; R — регионы; S — зарплата; H — требование высшего образования; K — явные навыки. Компоненты нормированы эмпирической функцией распределения.</small></div>
      ${metrics([["Уникальных входных",fmt0(p.vacancyCompetency?.inputUniqueVacancies),"после дедупликации","official"],["Классифицированных",fmt0(p.vacancyCompetency?.classifiedUniqueVacancies),"консервативная таксономия","model"],["Бутстрэп",fmt0(p.vacancyCompetency?.model?.bootstrap_draws||800),"интервалы p05–p95","model"],["Query totals","исключены","из итогового балла","warning"]])}
      <p>Классификация требует содержательного совпадения в названии, навыках, требованиях или обязанностях и применяет исключающие паттерны.</p>`,{source:"vacancyCompetency.model and programDemand.score_formula"}));
    pages.push(page("receptivity","Приватность и охват вакансий",`
      <span class="report-page-kicker">06 · Компетенции</span><h1>Приватность, дедупликация и границы охвата</h1>
      <ul><li>Контактные лица, телефоны, email, ИНН, КПП, ОГРН и точные адреса не включаются в публичный аналитический артефакт.</li><li>Единицей счёта является уникальная вакансия после дедупликации, а не строка поискового ответа.</li><li>Одна вакансия может дать несколько строк доказательств, но не должна многократно увеличивать количество уникальных вакансий.</li><li>Выборка тематическая: она предназначена для относительного сравнения программных групп, а не для оценки полного числа вакансий в России.</li><li>Интервал бутстрэпа отражает классификационную и выборочную неопределённость внутри снимка, но не полный охват рынка.</li></ul>
      <div class="report-callout is-green"><strong>Практическое следствие.</strong> Трудовой балл используется только как один компонент матрицы страна–программа и не ранжирует страны напрямую.</div>`,{source:"trudvsem_open_data_api; vacancyCompetency semantics and privacy"}));
    pages.push(page("receptivity","Совместная интерпретация",`
      <span class="report-page-kicker">06 · Восприимчивость</span><h1>Как объединять восприимчивость и трудовой сигнал</h1>
      <div class="report-card-grid"><article class="report-card is-green"><h3>Высокая восприимчивость + высокий спрос</h3><p>Кандидат для содержательной верификации программы и рекрутингового инструмента.</p></article><article class="report-card is-gold"><h3>Высокая восприимчивость + низкий спрос</h3><p>Рынок может быть релевантен для академических задач, но не для трудового сценария.</p></article><article class="report-card is-blue"><h3>Низкая/неясная восприимчивость + высокий спрос</h3><p>Нужны дополнительные данные и осторожный пилот; высокий трудовой балл не устраняет барьеры.</p></article><article class="report-card is-red"><h3>Низкие или ненадёжные сигналы</h3><p>Мониторинг и сбор данных предпочтительнее немедленного масштабирования.</p></article></div>
      <p>Оба слоя включаются в сценарную матрицу вместе со структурной возможностью и программным соответствием.</p>`,{source:"friendlinessIndex; vacancyCompetency; countryProgramMatrix scenarios"}));
    return pages;
  }

  function buildMatrixPages(data) {
    const p = data.payload;
    const model = p.countryProgramMatrix?.model || {};
    const rows = (p.countryProgramMatrix?.rows || []).slice().sort((a,b)=>num(a.rank_country_program_priority,9999)-num(b.rank_country_program_priority,9999));
    const scenarios = Object.entries(model.scenarios || {}).map(([name,w])=>({name,...w,total:Object.values(w).reduce((a,v)=>a+num(v),0)}));
    const tiers = Object.entries(model.decision_tier_counts||{}).map(([tier,count])=>({tier,count}));
    const pages=[divider("matrix","07","Матрица страна — программа — инструмент","Сценарный ансамбль весов, границы доказательств и перевод рейтинга в проверяемые действия.",[["Комбинаций",fmt0(rows.length)],["Стран",fmt0(model.n_countries)],["Программ",fmt0(model.n_program_groups)]])];
    pages.push(page("matrix","Формула управленческого индекса",`
      <span class="report-page-kicker">07 · Матрица</span><h1>Четыре компонента решения</h1>
      <div class="report-formula">M<sub>c,p,s</sub> = w<sub>O,s</sub>O<sub>c</sub> + w<sub>F,s</sub>F<sub>c</sub> + w<sub>P,s</sub>P<sub>c,p</sub> + w<sub>L,s</sub>L<sub>p</sub><small>O — возможность страны; F — восприимчивость; P — соответствие программе; L — трудовой спрос; s — сценарий весов.</small></div>
      <p>Заголовочный показатель — медиана по прозрачным сценариям. Минимум, максимум и диапазон ранга раскрывают чувствительность решения к приоритетам руководства.</p>
      ${metrics([["Сценариев",fmt0(scenarios.length),"равноправные управленческие линзы","model"],["Headline","медиана","по сценарным баллам","model"],["Границы","low–high","данные + параметры + веса","model"],["Эффект","не задан","до prospective evaluation","warning"]])}`,{source:"countryProgramMatrix.model.interpretation and scenarios"}));
    pages.push(page("matrix","Сценарии весов",`
      <span class="report-page-kicker">07 · Матрица</span><h1>Сценарии управленческих весов</h1>
      ${table(scenarios,[{label:"Сценарий",value:"name"},{label:"Возможность",value:r=>pct(r.country_opportunity),num:true},{label:"Восприимчивость",value:r=>pct(r.friendliness),num:true},{label:"Программа",value:r=>pct(r.program_fit),num:true},{label:"Трудовой спрос",value:r=>pct(r.labor_demand),num:true},{label:"Σ",value:r=>fmt2(r.total),num:true}],{caption:"Веса компонентов по сценариям"})}
      <div class="report-card-grid"><article class="report-card is-blue"><h3>Balanced</h3><p>Компромисс между возможностью, программой, восприимчивостью и трудовым спросом.</p></article><article class="report-card is-green"><h3>Recruitment</h3><p>Повышенный вес возможности страны и восприимчивости.</p></article><article class="report-card is-gold"><h3>Labor market</h3><p>Повышенный вес сигнала российского рынка компетенций.</p></article><article class="report-card is-red"><h3>Academic fit</h3><p>Повышенный вес соответствия образовательному профилю.</p></article></div>`,{source:"countryProgramMatrix.model.scenarios"}));
    pages.push(page("matrix","Уровни решений",`
      <span class="report-page-kicker">07 · Матрица</span><h1>Распределение по уровням решения</h1>
      ${barChart(tiers,r=>r.tier,r=>r.count,{limit:10,format:v=>fmt0(v),caption:"Уровни учитывают не только балл, но и требования к покрытию и числу классифицированных вакансий."})}
      ${table(tiers,[{label:"Уровень",value:"tier"},{label:"Комбинаций",value:r=>fmt0(r.count),num:true},{label:"Интерпретация",value:r=>({A_scale_or_prepare:"готовить масштабирование при внешней проверке",B_targeted_validation:"целевая верификация гипотезы",C_monitor_and_test:"мониторинг и ограниченный тест",D_insufficient_or_unstable_evidence:"недостаточные или нестабильные доказательства"}[r.tier]||"см. паспорт модели")}],{caption:"Decision tiers"})}
      <p>${esc(model.tier_a_policy||"")}</p>`,{source:"countryProgramMatrix.model.decision_tier_counts and tier_a_policy"}));
    chunks(rows.slice(0,40),10).forEach((part,index)=>pages.push(page("matrix",`Общий рейтинг матрицы — ${index+1}`,`
      <span class="report-page-kicker">07 · Матрица</span><h1>Ведущие комбинации · ${index+1}</h1>
      ${table(part,[{label:"Место",value:r=>fmt0(r.rank_country_program_priority),num:true},{label:"Страна",value:r=>countryName(r.iso3,r.country)},{label:"Программа",value:programLabel},{label:"Индекс",value:r=>fmt1(r.combined_country_program_priority_score),num:true},{label:"Low–high",value:r=>`${fmt1(r.priority_evidence_low)}–${fmt1(r.priority_evidence_high)}`},{label:"Сценарный диапазон",value:r=>`${fmt1(r.priority_scenario_min)}–${fmt1(r.priority_scenario_max)}`},{label:"Tier",value:r=>humanCode(r.priority_decision_tier)}],{caption:`Матрица, строки ${index*10+1}–${index*10+part.length}`,dense:true})}`,{source:"countryProgramMatrix.rows"})));
    const groups=[...new Set(rows.map(r=>r.program_group))];
    groups.forEach(group=>{
      const part=rows.filter(r=>r.program_group===group).sort((a,b)=>num(a[`rank_${group}`],9999)-num(b[`rank_${group}`],9999)).sort((a,b)=>num(b.combined_country_program_priority_score)-num(a.combined_country_program_priority_score)).slice(0,12);
      pages.push(page("matrix",`Приоритеты программы: ${programLabel(part[0]||{program_group:group})}`,`
        <span class="report-page-kicker">07 · Матрица</span><h1>${esc(programLabel(part[0]||{program_group:group}))}</h1>
        ${barChart(part,r=>countryName(r.iso3,r.country),r=>r.combined_country_program_priority_score,{limit:12,format:v=>fmt1(v),caption:"Страны ранжированы внутри выбранной программной группы по заголовочному сценарному ансамблю."})}
        ${table(part.slice(0,8),[{label:"Страна",value:r=>countryName(r.iso3,r.country)},{label:"Возможность",value:r=>fmt1(r.country_opportunity_score),num:true},{label:"Восприимчивость",value:r=>fmt1(r.friendliness_ex_ante_score),num:true},{label:"Fit",value:r=>fmt1(r.program_fit_score),num:true},{label:"Labor",value:r=>fmt1(r.program_labor_demand_score),num:true},{label:"Индекс",value:r=>fmt1(r.combined_country_program_priority_score),num:true}],{dense:true})}`,{source:`countryProgramMatrix.rows; program_group=${group}`}));
    });
    pages.push(page("matrix","Политика эффекта",`
      <span class="report-page-kicker">07 · Матрица</span><h1>Почему модуль не придумывает эффект</h1>
      <p>${esc(model.effect_policy||"")}</p>
      <div class="report-formula">Effect = E(Y | intervention) − E(Y | credible counterfactual)</div>
      <p>До проведения кампании платформа хранит тип ожидаемого эффекта, целевой показатель, горизонт и рекомендуемый дизайн оценки, но числовое значение эффекта остаётся неидентифицированным.</p>
      <div class="report-card-grid"><article class="report-card is-green"><h3>Допустимо</h3><p>Задать KPI, горизонт, минимально значимый эффект, метод сравнения и правила остановки.</p></article><article class="report-card is-red"><h3>Недопустимо</h3><p>Записать ожидаемое количество дополнительных студентов как установленный факт без пилота.</p></article></div>`,{source:"countryProgramMatrix.model.effect_policy and row evaluation fields"}));
    pages.push(page("matrix","Дизайн проверки решений",`
      <span class="report-page-kicker">07 · Матрица</span><h1>Минимальный дизайн проверки рекрутингового инструмента</h1>
      <ol><li><strong>Единица вмешательства:</strong> страна × канал × программа × когорта.</li><li><strong>Primary KPI:</strong> квалифицированные заявки или новые зачисления, а не показы рекламы.</li><li><strong>Контрфактуал:</strong> рандомизация, ступенчатое внедрение, matched comparison или interrupted time series — в зависимости от масштаба.</li><li><strong>Горизонт:</strong> охват полного цикла решения абитуриента; в строках матрицы сохраняется evaluation_horizon_months.</li><li><strong>Риски:</strong> сезонность, параллельные кампании, изменения визового режима, селекция каналов и неполное отслеживание.</li><li><strong>Решение:</strong> масштабировать, изменить, остановить или продолжить сбор данных по заранее заданному правилу.</li></ol>
      <div class="report-callout is-blue">Страновые страницы ниже уже содержат поле рекомендуемого дизайна и KPI, извлечённые из матрицы.</div>`,{source:"countryProgramMatrix.recommended_evaluation_design, recommended_evaluation_kpis"}));
    return pages;
  }

  function profilePage(item,index,total) {
    const best=item.best||{};
    const ref=item.ref||{};
    const d=ref.demography||{};
    const gap=item.gap||{};
    const friend=item.friend||{};
    const actual=num(item.inbound?.students_observed ?? gap.actual_students_latest);
    const country=countryName(item.iso3,best.country||ref.name);
    const programs=(item.rows||[]).slice().sort((a,b)=>num(b.combined_country_program_priority_score)-num(a.combined_country_program_priority_score));
    const rank=num(best.rank_country_program_priority,index+1);
    const change=num(d.studentPool2026)?num(d.studentPool2050)/num(d.studentPool2026)-1:0;
    const gapValue=gap.gap_parameter_q50 ?? best.representation_gap_q50 ?? best.representation_gap;
    const gapLow=gap.gap_parameter_q025 ?? best.representation_gap_q025;
    const gapHigh=gap.gap_parameter_q975 ?? best.representation_gap_q975;
    const evalDesign=humanCode(best.recommended_evaluation_design||"Предварительная верификация и пилот с контрфактуальным сравнением");
    const kpis=humanCode(best.recommended_evaluation_kpis||"квалифицированные заявки; новые зачисления; конверсия; стоимость результата");
    return page("profiles",country,`
      <div class="report-profile-head"><div><span class="report-page-kicker">08 · Страновой профиль ${index+1} из ${total}</span><h1>${esc(country)}</h1><p>${esc(ref.region||best.macroregion||"—")} · ${esc(ref.incomeGroup||"группа дохода не указана")} · ISO3 ${esc(item.iso3)}</p></div><div class="report-profile-rank"><span>лучшее место комбинации</span><strong>${esc(fmt0(rank))}</strong></div></div>
      <div class="report-profile-grid"><div>
        ${metrics([["Факт UIS",actual?fmt0(actual):"н/д",actual?`${item.inbound?.year||gap.actual_period||""}`:"нет строки в topOrigins",actual?"official":"warning"],["Разрыв q50",Number.isFinite(Number(gapValue))?fmt0(gapValue):"н/д",Number.isFinite(Number(gapLow))?`${fmt0(gapLow)} … ${fmt0(gapHigh)}`:"интервал не доступен","model"],["Восприимчивость",Number.isFinite(Number(friend.friendliness_ex_ante_score))?fmt1(friend.friendliness_ex_ante_score):"н/д",friend.component_coverage_score?`покрытие ${pct(friend.component_coverage_score)}`:"нет покрытия","model"],["Пул 2050",d.studentPool2050?fmt0(d.studentPool2050):"н/д",d.studentPool2026?`${change>=0?"+":""}${pct(change)} к 2026`:"WPP недоступен","official"]])}
        <div class="report-callout ${num(gap.probability_positive_representation_gap)>=.8?"is-green":""}"><strong>Структурная гипотеза.</strong> ${Number.isFinite(Number(gapValue))?`Медианный разрыв составляет ${fmt0(gapValue)} эквивалентов; вероятность положительного разрыва — ${pct(gap.probability_positive_representation_gap)}.`:"Страна представлена в управленческой матрице, но устойчивый фактический рейтинг разрыва отсутствует."}</div>
      </div><div>
        <h3>Лучшая комбинация</h3><p><strong>${esc(programLabel(best))}</strong></p>
        <dl class="report-definition-list"><div><dt>Индекс</dt><dd>${fmt1(best.combined_country_program_priority_score)}</dd></div><div><dt>Диапазон</dt><dd>${fmt1(best.priority_evidence_low)}–${fmt1(best.priority_evidence_high)}</dd></div><div><dt>Tier</dt><dd>${esc(humanCode(best.priority_decision_tier))}</dd></div><div><dt>Язык</dt><dd>${esc(humanCode(best.teaching_language||"агрегированный"))}</dd></div><div><dt>Инструмент</dt><dd>${esc(humanCode(best.recruitment_instrument||"экспертная верификация"))}</dd></div></dl>
        <p class="report-profile-note"><strong>Ограничение:</strong> ${esc(humanCode(best.score_semantics||"Индекс является сравнительным управленческим баллом, а не прогнозом числа студентов."))}</p>
      </div></div>
      <div class="report-profile-programs">${table(programs,[{label:"Программа",value:programLabel},{label:"Opportunity",value:r=>fmt1(r.country_opportunity_score),num:true},{label:"Friend",value:r=>fmt1(r.friendliness_ex_ante_score),num:true},{label:"Fit",value:r=>fmt1(r.program_fit_score),num:true},{label:"Labor",value:r=>fmt1(r.program_labor_demand_score),num:true},{label:"Индекс",value:r=>fmt1(r.combined_country_program_priority_score),num:true},{label:"Сценарии",value:r=>`${fmt1(r.priority_scenario_min)}–${fmt1(r.priority_scenario_max)}`}],{caption:"Сопоставление программных групп",dense:true})}</div>
      <div class="report-card-grid" style="margin-top:3mm"><article class="report-card is-blue"><h3>Дизайн проверки</h3><p>${esc(truncate(evalDesign,260))}</p></article><article class="report-card is-gold"><h3>KPI</h3><p>${esc(truncate(kpis,260))}</p></article></div>`,{shortTitle:`Профиль: ${country}`,source:`countryProgramMatrix; factPotentialGap; friendlinessIndex; public_country_reference; iso3=${item.iso3}`});
  }

  function buildProfilePages(data,cfg) {
    const selected=data.profileCountries.slice(0,cfg.profileCount);
    const pages=[divider("profiles","08","Страновые профили","Автоматически сформированные карточки рынков: факты, модельные интервалы, программы, инструменты и дизайн проверки.",[["Профилей",fmt0(selected.length)],["Страниц на страну","1"],["Программ в карточке","5"]])];
    selected.forEach((item,index)=>pages.push(profilePage(item,index,selected.length)));
    return pages;
  }

  function buildSourcePages(data) {
    const sources=data.payload.sourceRegistry?.sources||[];
    const totalRows=sum(sources,r=>r.row_count);
    const pages=[divider("sources","09","Паспорта источников","Происхождение данных, условия использования, даты извлечения, объём и контрольные суммы.",[["Паспортов",fmt0(sources.length)],["Строк в реестре",fmt0(totalRows)],["Контроль", "SHA-256"]])];
    pages.push(page("sources","Обзор реестра источников",`
      <span class="report-page-kicker">09 · Источники</span><h1>Обзор доказательной базы</h1>
      ${metrics([["Источников",fmt0(sources.length),"официальные и производные","official"],["Сумма row_count",fmt0(totalRows),"не число уникальных объектов","official"],["С лицензией",fmt0(sources.filter(s=>s.license_or_terms).length),"условия сохранены","official"],["С checksum",fmt0(sources.filter(s=>String(s.sha256||"").length>=32).length),"контроль целостности","official"]])}
      ${table(sources.map(s=>({type:s.source_id.startsWith("world_bank_")?"World Bank":s.source_id.startsWith("un_")?"UN":s.source_id.startsWith("unesco_")?"UNESCO":s.source_id.startsWith("trudvsem")?"Работа в России":s.source_id.startsWith("ppml")||s.source_id.includes("increment")||s.source_id.includes("component")?"Производный":"Прочее",rows:num(s.row_count)})).reduce((acc,r)=>{const x=acc.find(a=>a.type===r.type);if(x)x.rows+=r.rows,x.count++;else acc.push({type:r.type,rows:r.rows,count:1});return acc;},[]),[{label:"Группа",value:"type"},{label:"Паспортов",value:r=>fmt0(r.count),num:true},{label:"Row count",value:r=>fmt0(r.rows),num:true}],{caption:"Агрегирование реестра по типу источника"})}
      <div class="report-callout">Сумма row_count предназначена для технического контроля и может включать разные единицы анализа; её нельзя интерпретировать как число стран или наблюдений одной таблицы.</div>`,{source:"sourceRegistry.sources"}));
    chunks(sources,3).forEach((part,index)=>pages.push(page("sources",`Паспорта источников — ${index+1}`,`
      <span class="report-page-kicker">09 · Источники</span><h1>Паспорта источников · ${index+1}</h1>
      ${part.map(s=>`<article class="report-source-card"><h3>${esc(s.source_id)}</h3><div class="source-id">${esc(s.url||"локальный артефакт")}</div><dl><div><dt>Получен</dt><dd>${esc(s.retrieved_at_utc||"—")}</dd></div><div><dt>Строк</dt><dd>${fmt0(s.row_count)}</dd></div><div><dt>Период</dt><dd>${esc([s.year_min,s.year_max].filter(v=>v!==null&&v!==undefined).join("–")||"—")}</dd></div><div><dt>Стран</dt><dd>${esc(s.country_count??"—")}</dd></div><div><dt>Статус</dt><dd>${esc(s.validation_status||"—")}</dd></div><div><dt>Clearance</dt><dd>${esc(s.license_clearance_status||"—")}</dd></div><div><dt>SHA-256</dt><dd>${esc(s.sha256||(s.license_clearance_status==="not_applicable_internal_derived"?"N/A — внутренний производный артефакт":"—"))}</dd></div><div><dt>Размер</dt><dd>${fmt0(s.bytes)} байт</dd></div></dl><p class="source-purpose"><strong>Условия:</strong> ${esc(truncate(s.license_or_terms||s.access_note||"не указаны",260))}</p></article>`).join("")}`,{source:"sourceRegistry.sources; publication URLs and checksums"})));
    chunks(sources,8).forEach((part,index)=>pages.push(page("sources",`Библиография и ссылки — ${index+1}`,`
      <span class="report-page-kicker">09 · Источники</span><h1>Библиография машиночитаемых источников · ${index+1}</h1>
      <div class="report-bibliography">${part.map(s=>`<article><div><strong>${esc(s.source_id)}</strong><small>${esc(s.url||"локальный производный артефакт")}</small><small>Дата получения: ${esc(s.retrieved_at_utc||"—")}; период: ${esc([s.year_min,s.year_max].filter(v=>v!==null&&v!==undefined).join("–")||"—")}.</small></div></article>`).join("")}</div>`,{source:"sourceRegistry.sources",toc:false})));
    return pages;
  }

  function enChapterNumber(key) {
    const index = DEFAULT_SECTIONS.indexOf(key);
    return index >= 0 ? String(index + 1).padStart(2, "0") : "";
  }

  function enKicker(key, label = "") {
    const n = enChapterNumber(key);
    return `${n ? `${n} · ` : ""}${label || sectionLabelFor(key, "en")}`;
  }

  function buildEnglishFrontPages(data, cfg) {
    const p = data.payload;
    const latestObserved = (p.russiaInbound?.yearTotals || []).filter((r) => num(r.students_observed) > 0).at(-1) || {};
    const matrixRows = p.countryProgramMatrix?.rows || [];
    const programCount = new Set(matrixRows.map((r) => r.program_group)).size;
    const countryCount = new Set(matrixRows.map((r) => r.iso3)).size;
    const firstGap = p.factPotentialGap?.top?.[0] || {};
    const cover = page("front", cfg.title, `
      <div class="report-cover-layout">
        <div class="report-cover-logos"><img src="assets/mgimo-home.png" alt="MGIMO"><img src="assets/fnisc.png" alt="FCTAS RAS"></div>
        <div class="report-cover-copy"><span class="report-page-kicker">Executive analytical report</span><h1>${esc(cfg.title)}</h1><p>Observed evidence, scenarios to 2050, a structural model of international educational migration and a management decision matrix.</p></div>
        <div class="report-cover-meta"><div><span>Platform version</span><strong>${esc(p.metadata?.model_upgrade || "scientific_models_v5")}</strong></div><div><span>Generated</span><strong>${esc(dateRu(new Date().toISOString()))}</strong></div><div><span>Mode</span><strong>Deterministic assembly from canonical artifacts</strong></div></div>
      </div>`, { className: "report-cover-page", toc: false });

    const passport = page("front", "Document passport", `
      <span class="report-page-kicker">Release passport</span><h1>Document passport</h1><p class="report-page-deck">The report is generated in the browser from the same canonical JSON package that powers the public interface. Template text is deterministic; no production numbers are generated by an LLM.</p>
      ${metrics([
        ["Latest UIS year", latestObserved.year || p.russiaInbound?.latestYear || "n/a", `${fmt0(latestObserved.students_observed)} students`, "official"],
        ["Countries in reference", fmt0(data.countryRows.length), "country and WPP reference", "official"],
        ["Countries in matrix", fmt0(countryCount), `${programCount} program groups`, "model"],
        ["Source passports", fmt0(p.sourceRegistry?.sources?.length), "SHA-256 checksums", "official"],
      ])}
      <dl class="report-definition-list">
        <div><dt>Document ID</dt><dd>${esc(cfg.documentId)}</dd></div>
        <div><dt>Payload generated at</dt><dd>${esc(p.metadata?.generated_at || "n/a")}</dd></div>
        <div><dt>Release status</dt><dd>${esc(p.metadata?.release_status || "n/a")}</dd></div>
        <div><dt>Assembly rule</dt><dd>Deterministic templates, tables and SVG charts; factual, modelled and decision-support quantities remain separated.</dd></div>
        <div><dt>Unit of analysis</dt><dd>Country of origin, year, program group and scenario, depending on the chapter.</dd></div>
      </dl>`, { toc: false, source: "metadata, sourceRegistry, russiaInbound, countryProgramMatrix" });

    const summary = page("front", "Executive summary", `
      <span class="report-page-kicker">Executive summary</span><h1>What the platform supports</h1>
      ${metrics([
        ["Observed stock", fmt0(latestObserved.students_observed), `UIS, ${latestObserved.year || p.russiaInbound?.latestYear}`, "official"],
        ["Top observed origin", countryName(p.russiaInbound?.topOrigins?.[0]?.origin_iso3, p.russiaInbound?.topOrigins?.[0]?.origin_name), fmt0(p.russiaInbound?.topOrigins?.[0]?.students_observed), "official"],
        ["Gap leader", countryName(firstGap.origin_iso3, firstGap.origin_country), fmt0(firstGap.gap_parameter_q50 || firstGap.gap_abs), "model"],
        ["Matrix rows", fmt0(matrixRows.length), "country-program combinations", "model"],
      ])}
      <div class="report-card-grid">
        <article class="report-card is-green"><h3>Observed evidence</h3><p>UIS OPRI measures enrolled internationally mobile student stock in Russia. It is not an annual flow and not a visa count.</p>${evidenceTag("official observed stock", "official")}</article>
        <article class="report-card is-blue"><h3>Structural evidence</h3><p>The PPML model explains the distribution of observed stock and supports structural shares and representation gaps under stated assumptions.</p>${evidenceTag("model estimate", "model")}</article>
        <article class="report-card is-gold"><h3>Decision support</h3><p>The matrix links country, program group, language/instrument logic and an evaluation protocol. It does not claim an ex-ante causal effect.</p>${evidenceTag("management hypothesis", "warning")}</article>
        <article class="report-card is-red"><h3>What is not claimed</h3><p>The report is not an operational enrolment forecast, not a labor-market census and not a substitute for expert validation.</p>${evidenceTag("interpretation limit", "warning")}</article>
      </div>`, { toc: false, source: "russiaInbound, gravityModel, countryProgramMatrix" });

    const decisions = page("front", "Decision map", `
      <span class="report-page-kicker">Executive summary</span><h1>Recommended reading path</h1>
      <ol>
        <li><strong>Verify observed scale.</strong> Start with UIS stock and country-of-origin concentration.</li>
        <li><strong>Separate market scale from outcomes.</strong> Use UN WPP youth-market indicators as demographic context, not as student counts.</li>
        <li><strong>Use the model for structure.</strong> Interpret PPML outputs as structural shares and gaps, not as guaranteed enrolment levels.</li>
        <li><strong>Translate into pilots.</strong> Use the country-program matrix to define hypotheses, owners, KPIs and evaluation design.</li>
        <li><strong>Audit the sources.</strong> Every headline number has a source/model status, period, unit and checksum trail.</li>
      </ol>
      ${table(matrixRows.slice().sort((a,b) => num(a.rank_country_program_priority,9999)-num(b.rank_country_program_priority,9999)).slice(0,5), [
        { label: "Rank", value: r => fmt0(r.rank_country_program_priority), num: true },
        { label: "Country", value: r => countryName(r.iso3, r.country) },
        { label: "Program", value: programLabel },
        { label: "Index", value: r => fmt1(r.combined_country_program_priority_score), num: true },
        { label: "Tier", value: r => humanCode(r.priority_decision_tier) },
      ], { caption: "Top rows of the management matrix", dense: true })}`, { toc: false, source: "countryProgramMatrix" });

    const guide = page("front", "How to read this report", `
      <span class="report-page-kicker">Navigation</span><h1>How to read this report</h1><p class="report-page-deck">The document moves from definitions and evidence to decisions. Each page exposes its source or model artifact.</p>
      <div class="report-card-grid">
        ${DEFAULT_SECTIONS.map((key, index) => `<article class="report-card ${index % 3 === 0 ? "is-blue" : index % 3 === 1 ? "is-gold" : "is-green"}"><h3>${index + 1}. ${esc(sectionLabelFor(key, "en"))}</h3><p>${esc(SECTION_DESCRIPTIONS.en[key])}</p></article>`).join("")}
      </div>
      <div class="report-callout"><strong>Reading rule:</strong> a rank is an evidence-ordering device. It must be read with interval, coverage and semantic status.</div>`, { toc: false });
    return [cover, passport, summary, decisions, guide];
  }

  function buildEnglishMethodPages(data) {
    const p = data.payload;
    const g = p.gravityModel || {};
    const pages = [divider("method", "01", sectionLabelFor("method", "en"), "Definitions, formulas, ranking rules and reproducible evidence links.", [["Sources", fmt0(p.sourceRegistry?.sources?.length)], ["PPML observations", fmt0(g.n_observations)], ["Origins", fmt0(g.n_origins)]])];
    pages.push(page("method", "Evidence classes", `
      <span class="report-page-kicker">${esc(enKicker("method"))}</span><h1>Evidence classes and separation rules</h1>
      <div class="report-card-grid">
        <article class="report-card is-green"><h3>Observed</h3><p>Published source rows are preserved with unit, period, URL or local reference and checksum.</p>${evidenceTag("observed / official", "official")}</article>
        <article class="report-card is-blue"><h3>Calculated or modelled</h3><p>Aggregations, indices and model estimates are deterministic transformations of observed inputs.</p>${evidenceTag("calculated / modelled", "model")}</article>
        <article class="report-card is-gold"><h3>Scenario</h3><p>A scenario is a conditional path under stated assumptions, not an observed future fact.</p>${evidenceTag("scenario", "warning")}</article>
        <article class="report-card is-red"><h3>Decision hypothesis</h3><p>A recommendation requires expert validation, ownership and subsequent effect evaluation.</p>${evidenceTag("management use", "warning")}</article>
      </div>
      <p>UIS stock, demographic pool, PPML capacity equivalent, receptivity score and management priority index are not merged into a single observed indicator.</p>`, { source: "metadata.observed_modelled_policy; sourceRegistry" }));
    pages.push(page("method", "Data pipeline", `
      <span class="report-page-kicker">${esc(enKicker("method"))}</span><h1>From source to decision</h1>
      <ol><li>Acquisition records retrieval date, access terms, bytes and checksum.</li><li>Normalization uses ISO3 country keys and preserves units, years and missingness.</li><li>Validation checks schema, key uniqueness, ranges and semantic constraints.</li><li>Models write separate outputs with model_id and evidence class.</li><li>The public UI and this report read the same canonical JSON artifacts.</li></ol>
      <div class="report-formula">Source -> raw artifact -> validated table -> model output -> decision matrix -> A4 report</div>
      ${metrics([["UIS source rows", fmt0(data.sourceMap.get("unesco_uis_opri_202602")?.row_count), "source registry", "official"], ["WPP rows", fmt0(data.sourceMap.get("un_wpp2024_population_by_single_age_sex")?.row_count), "source registry", "official"], ["Vacancy rows", fmt0(data.sourceMap.get("trudvsem_open_data_api")?.row_count), "sanitized snapshot", "official"], ["Matrix rows", fmt0(p.countryProgramMatrix?.rows?.length), "model output", "model"]])}`, { source: "sourceRegistry; countryProgramMatrix" }));
    pages.push(page("method", "Core formulas", `
      <span class="report-page-kicker">${esc(enKicker("method"))}</span><h1>Core formulas and units</h1>
      <dl class="report-definition-list">
        <div><dt>Student pool</dt><dd>P = Pop15-24 + 0.45 x Pop25-29. It is a demographic scale measure, not a student count.</dd></div>
        <div><dt>PPML conditional mean</dt><dd>E(Y|X) = exp(X beta + fixed effects), where Y is observed UIS stock.</dd></div>
        <div><dt>Structural share</dt><dd>s = exp(X beta) / sum exp(X beta) inside the relevant year.</dd></div>
        <div><dt>Country capacity equivalent</dt><dd>A = C x s, where C is the aggregate scenario capacity.</dd></div>
        <div><dt>Representation gap</dt><dd>G = A - B, where B is the demographic-continuity baseline.</dd></div>
        <div><dt>Receptivity score</dt><dd>A bounded composite of available ex-ante components with neutral imputation and uncertainty bounds.</dd></div>
      </dl>`, { source: "gravityModel.formula; potentialForecast; friendlinessIndex" }));
    pages.push(page("method", "Uncertainty and ranking", `
      <span class="report-page-kicker">${esc(enKicker("method"))}</span><h1>Uncertainty and ranking discipline</h1>
      ${metrics([["Parameter draws", "600", "coefficient simulations", "model"], ["Interval", "95%", "2.5-97.5 percentiles", "model"], ["Rank stability", "top-10 / top-20", "screening indicator", "model"], ["Missingness", "explicit", "never converted to zero", "warning"]])}
      <ol><li>Scenario paths are sensitivity analysis, not point forecasts.</li><li>Limited evidence does not receive false exact precision.</li><li>Observed stock is never labelled as flow.</li><li>Vacancy search totals are diagnostic query signals, not unique vacancy counts.</li><li>Effect of a recruiting instrument is not identified ex ante.</li></ol>`, { source: "potentialForecast.parameter_draw_count; countryProgramMatrix.score_semantics" }));
    return pages;
  }

  function buildEnglishInboundPages(data) {
    const p = data.payload;
    const rows = p.russiaInbound?.topOrigins || [];
    const years = (p.russiaInbound?.yearTotals || []).filter((r) => num(r.students_observed) > 0);
    const latest = years.at(-1) || {};
    const pages = [divider("inbound", "02", sectionLabelFor("inbound", "en"), "Official UIS stock evidence: scale, origin structure, trend and coverage.", [["Latest year", latest.year || p.russiaInbound?.latestYear], ["Stock", fmt0(latest.students_observed)], ["Top-origin rows", fmt0(rows.length)]])];
    pages.push(page("inbound", "Total observed stock over time", `
      <span class="report-page-kicker">${esc(enKicker("inbound"))}</span><h1>Total observed student stock by year</h1>
      ${lineChart(years, r => r.year, [{ label: "UIS students", value: r => r.students_observed }], { zero: true, caption: "Observed enrolled internationally mobile student stock in Russia. Technical zero years after the last meaningful slice are excluded." })}
      ${metrics([["First year", years[0]?.year || "n/a", fmt0(years[0]?.students_observed), "official"], ["Latest year", latest.year || "n/a", fmt0(latest.students_observed), "official"], ["Change", years.length > 1 ? pct(num(latest.students_observed) / Math.max(1,num(years[0].students_observed)) - 1) : "n/a", "over the available series", "official"], ["Semantic type", "stock", "not annual flow", "warning"]])}`, { source: "unesco_uis_opri_202602; russiaInbound.yearTotals" }));
    pages.push(page("inbound", "Largest countries of origin", `
      <span class="report-page-kicker">${esc(enKicker("inbound"))}</span><h1>Largest countries of origin</h1>
      ${barChart(rows.slice(0,15), r => countryName(r.origin_iso3, r.origin_name), r => r.students_observed, { limit: 15, caption: `Slice for ${p.russiaInbound?.latestYear}; observed UIS rows only.` })}`, { source: "russiaInbound.topOrigins; UNESCO UIS OPRI" }));
    chunks(rows, 15).forEach((part, index) => pages.push(page("inbound", `Origin ranking - part ${index + 1}`, `
      <span class="report-page-kicker">${esc(enKicker("inbound"))}</span><h1>Origin ranking - ${index + 1}</h1>
      ${table(part, [
        { label: "Rank", value: (_, i) => index * 15 + i + 1, num: true },
        { label: "Country", value: r => countryName(r.origin_iso3, r.origin_name) },
        { label: "ISO3", value: "origin_iso3" },
        { label: "Year", value: "year", num: true },
        { label: "Students", value: r => fmt0(r.students_observed), num: true },
        { label: "Status", value: r => r.observation_status || "official" },
      ], { caption: `Observed stock, rows ${index * 15 + 1}-${index * 15 + part.length}`, dense: true })}
      <p class="report-source-line"><strong>Traceability:</strong> each row carries trace/source key, value, unit, period, checksum and transform script in the canonical JSON.</p>`, { source: "unesco_uis_opri_202602; russiaInbound.topOrigins" })));
    pages.push(page("inbound", "UIS indicator semantics", `
      <span class="report-page-kicker">${esc(enKicker("inbound"))}</span><h1>What the UIS indicator measures</h1>
      <dl class="report-definition-list"><div><dt>Object</dt><dd>Internationally mobile student crossing a national border for education.</dd></div><div><dt>Measure</dt><dd>Number enrolled in tertiary or higher education in the destination country.</dd></div><div><dt>Direction</dt><dd>Country of origin to Russian Federation.</dd></div><div><dt>Time</dt><dd>Stock in the reporting year; not a cumulative sum and not new admissions.</dd></div></dl>
      <div class="report-callout"><strong>Management implication:</strong> recruitment-funnel evaluation requires applications, offers, new enrolments and retention data in addition to this stock indicator.</div>`, { source: "UNESCO UIS OPRI indicator metadata" }));
    return pages;
  }

  function buildEnglishDemographyPages(data) {
    const rows = data.countryRows.filter((r) => r.demography).map((r) => {
      const d = r.demography || {};
      const p26 = num(d.studentPool2026), p35 = num(d.studentPool2035), p50 = num(d.studentPool2050);
      return { ...r, p26, p35, p50, growth: p26 ? p50 / p26 - 1 : 0, delta: p50 - p26 };
    });
    const top = rows.slice().sort((a,b) => b.p26-a.p26);
    const growth = rows.filter(r => r.p26 > 100000).slice().sort((a,b) => b.delta-a.delta);
    const pages = [divider("demography", "03", sectionLabelFor("demography", "en"), "Age structure and official UN WPP Medium-variant population projections to 2050.", [["Countries", fmt0(rows.length)], ["Anchor years", "2026 / 2035 / 2050"], ["Source", "UN WPP 2024"]])];
    pages.push(page("demography", "Largest youth-market pools", `
      <span class="report-page-kicker">${esc(enKicker("demography"))}</span><h1>Largest education markets in 2026</h1>
      ${barChart(top.slice(0,15), r => countryName(r.iso3,r.name), r => r.p26, { limit: 15, caption: "Derived student pool: population aged 15-24 plus 45% of population aged 25-29." })}`, { source: "public_country_reference.demography; UN WPP 2024" }));
    pages.push(page("demography", "Growth to 2050", `
      <span class="report-page-kicker">${esc(enKicker("demography"))}</span><h1>Largest absolute expansion by 2050</h1>
      ${barChart(growth.slice(0,15), r => countryName(r.iso3,r.name), r => r.delta, { limit: 15, format: v => `${v >= 0 ? "+" : ""}${fmt0(v)}`, caption: "Absolute change in the derived student pool between 2026 and 2050." })}`, { source: "UN WPP 2024 Medium variant; analytical student-pool transform" }));
    chunks(top.slice(0,60), 15).forEach((part,index)=>pages.push(page("demography", `Demographic-market ranking - ${index+1}`, `
      <span class="report-page-kicker">${esc(enKicker("demography"))}</span><h1>Demographic-market ranking - ${index+1}</h1>
      ${table(part, [{label:"Rank",value:(_,i)=>index*15+i+1,num:true},{label:"Country",value:r=>countryName(r.iso3,r.name)},{label:"Region",value:r=>r.region||"n/a"},{label:"2026",value:r=>fmt0(r.p26),num:true},{label:"2035",value:r=>fmt0(r.p35),num:true},{label:"2050",value:r=>fmt0(r.p50),num:true},{label:"Change",value:r=>pct(r.growth),num:true}], {caption:`Derived student pool, rows ${index*15+1}-${index*15+part.length}`, dense:true})}`, { source:"UN WPP 2024; public_country_reference" })));
    pages.push(page("demography", "Interpretation limits", `
      <span class="report-page-kicker">${esc(enKicker("demography"))}</span><h1>Limits of the demographic layer</h1>
      <ul><li>Population projections are official projection scenarios, not observed future values.</li><li>The student pool does not measure household choice, affordability, language readiness or institutional links.</li><li>The 0.45 weight for ages 25-29 is an analytical assumption and must remain visible.</li><li>Recruitment decisions use demography together with observed mobility, structural gap and receptivity evidence.</li></ul>`, { source:"UN WPP 2024; analytical transform assumptions" }));
    return pages;
  }

  function buildEnglishModelPages(data) {
    const g = data.payload.gravityModel || {};
    const coefficients = g.coefficients || [];
    const candidates = validationRows(g);
    const time = g.selected_time_holdout_average || {};
    const country = g.selected_country_holdout_average || {};
    const benchmark = g.persistence_benchmark?.time_holdout_average || {};
    const pages = [divider("model", "04", sectionLabelFor("model", "en"), "Structural explanation of country-origin distribution, validation evidence and limits of use.", [["Specification", g.selected_specification || "n/a"], ["Observations", fmt0(g.n_observations)], ["Validation", (g.validation_period || []).join("-")]])];
    pages.push(page("model", "Model card", `
      <span class="report-page-kicker">${esc(enKicker("model"))}</span><h1>Purpose and limits</h1>
      ${metrics([["Status", "validated for structure", "not short-run point forecast", "model"], ["Role", "structural share", "and representation gap", "model"], ["Dependent variable", "UIS stock", "internationally mobile students", "official"], ["Benchmark disclosed", g.persistence_benchmark ? "yes" : "no", "short-horizon comparison", "warning"]])}
      <div class="report-card-grid"><article class="report-card is-blue"><h3>Used for</h3><p>Structural shares, representation gaps and scenario screening under stated assumptions.</p></article><article class="report-card is-red"><h3>Not used for</h3><p>Operational enrolment targets, budget allocation, automatic quotas or causal evaluation of campaigns.</p></article></div>`, { source:`${g.model_id}; gravityModel.model_role and status` }));
    pages.push(page("model", "Final PPML specification", `
      <span class="report-page-kicker">${esc(enKicker("model"))}</span><h1>Final theory_ex_ante specification</h1>
      <div class="report-formula">${esc(g.formula || "students_observed ~ ln_student_pool + ln_distance + ln_outbound + tertiary_share + unga_alignment + region FE + year FE")}</div>
      <dl class="report-definition-list"><div><dt>Estimator</dt><dd>${esc(g.estimator || "n/a")}</dd></div><div><dt>Covariance</dt><dd>Sandwich covariance clustered by country of origin.</dd></div><div><dt>Fixed effects</dt><dd>Region and year; future aggregate timing is handled through explicit capacity scenarios.</dd></div><div><dt>Software</dt><dd>${esc(g.software || "n/a")}</dd></div></dl>`, { source:`${g.model_id}; gravityModel.formula, estimator, diagnostics` }));
    chunks(coefficients, 12).forEach((part,index)=>pages.push(page("model", `Coefficients - part ${index+1}`, `
      <span class="report-page-kicker">${esc(enKicker("model"))}</span><h1>Estimated coefficients - ${index+1}</h1>
      ${table(part,[{label:"Term",value:"term"},{label:"Estimate",value:r=>fmt2(r.estimate),num:true},{label:"Std. error",value:r=>fmt2(r.std_error),num:true},{label:"p-value",value:r=>num(r.p_value)<0.001?"<0.001":fmt2(r.p_value),num:true},{label:"95% low",value:r=>fmt2(r.conf_low),num:true},{label:"95% high",value:r=>fmt2(r.conf_high),num:true},{label:"Transform",value:r=>truncate(r.transform,45)}],{caption:`PPML coefficients, rows ${index*12+1}-${index*12+part.length}`, dense:true})}`, { source:`${g.model_id}; gravityModel.coefficients` })));
    pages.push(page("model", "Validation and benchmark", `
      <span class="report-page-kicker">${esc(enKicker("model"))}</span><h1>Validation and benchmark contrast</h1>
      ${metrics([["Time MAE", `${fmt1(time.share_mae_basis_points)} bps`, "share error", "model"], ["Time Spearman", fmt2(time.spearman_rank_correlation), "rank correlation", "model"], ["Top-20 recall", pct(time.top20_recall), "time holdout", "model"], ["Country Spearman", fmt2(country.spearman_rank_correlation), "country holdout", "model"]])}
      ${table([{model:"PPML theory_ex_ante",...time},{model:"Persistence benchmark",...benchmark}], [{label:"Approach",value:"model"},{label:"Share MAE, bps",value:r=>fmt1(r.share_mae_basis_points),num:true},{label:"Spearman",value:r=>fmt2(r.spearman_rank_correlation),num:true},{label:"Top-20 recall",value:r=>pct(r.top20_recall),num:true},{label:"MAE, students",value:r=>fmt0(r.mae_students),num:true}], {caption:"Short-horizon distribution check", dense:true})}
      <div class="report-callout is-red"><strong>Interpretation:</strong> the persistence benchmark can outperform the structural model for short horizons. PPML is therefore used for structure and under-representation, not as a point forecast.</div>`, { source:"gravityModel.selected_time_holdout_average; persistence_benchmark" }));
    pages.push(page("model", "Candidate specifications", `
      <span class="report-page-kicker">${esc(enKicker("model"))}</span><h1>Candidate specification comparison</h1>
      ${table(candidates,[{label:"Model",value:"name"},{label:"Terms",value:r=>fmt0(r.terms),num:true},{label:"Share MAE, bps",value:r=>fmt1(r.share_mae_basis_points),num:true},{label:"Spearman",value:r=>fmt2(r.spearman_rank_correlation),num:true},{label:"Top-20 recall",value:r=>pct(r.top20_recall),num:true},{label:"Selection score",value:r=>fmt1(r.selection),num:true}], {caption:"Average time-holdout validation; lower selection score is better", dense:true})}`, { source:"gravityModel.candidate_validation and selected_specification" }));
    return pages;
  }

  function buildEnglishForecastPages(data) {
    const p = data.payload;
    const scenarios = p.potentialForecast?.capacityScenarios || [];
    const forecast2026 = (p.potentialForecast?.rows || []).filter(r=>num(r.year)===2026).sort((a,b)=>num(b.model_based_attraction_capacity)-num(a.model_based_attraction_capacity));
    const gaps = p.factPotentialGap?.top || [];
    const pages = [divider("forecast", "05", sectionLabelFor("forecast", "en"), "Capacity paths, structural shares and representation gaps under explicit assumptions.", [["Scenario years", fmt0(scenarios.length)], ["Gap rows", fmt0(gaps.length)], ["Horizon", "2050"]])];
    pages.push(page("forecast", "Aggregate scenario paths", `
      <span class="report-page-kicker">${esc(enKicker("forecast"))}</span><h1>Aggregate capacity scenarios</h1>
      ${lineChart(scenarios, r=>r.year, [{label:"Constrained",value:r=>r.potential_students_constrained||r.constrained_students||r.potential_students_low},{label:"Base",value:r=>r.potential_students||r.base_students||r.potential_students_base},{label:"Accelerated",value:r=>r.potential_students_accelerated||r.accelerated_students||r.potential_students_high}], {zero:true, caption:"Scenario paths are conditional structural-capacity equivalents, not guaranteed enrolment forecasts."})}
      <div class="report-callout"><strong>Frozen/changing covariates:</strong> the demographic pool changes with UN WPP projections; other covariates follow the published future-covariate policy in the model card.</div>`, { source:"potentialForecast.capacityScenarios; gravityModel.diagnostics.future_covariate_policy" }));
    pages.push(page("forecast", "Top structural capacity equivalents", `
      <span class="report-page-kicker">${esc(enKicker("forecast"))}</span><h1>Top country capacity equivalents in 2026</h1>
      ${barChart(forecast2026.slice(0,15), r=>countryName(r.origin_iso3||r.iso3,r.origin_country||r.country), r=>r.model_based_attraction_capacity, {limit:15, caption:"Model-based capacity equivalent for the base structural distribution."})}`, { source:"potentialForecast.rows" }));
    chunks(gaps.slice(0,60), 15).forEach((part,index)=>pages.push(page("forecast", `Representation-gap ranking - ${index+1}`, `
      <span class="report-page-kicker">${esc(enKicker("forecast"))}</span><h1>Representation-gap ranking - ${index+1}</h1>
      ${table(part,[{label:"Rank",value:(_,i)=>index*15+i+1,num:true},{label:"Country",value:r=>countryName(r.origin_iso3,r.origin_country)},{label:"Actual",value:r=>fmt0(r.actual_students_latest),num:true},{label:"Gap q50",value:r=>fmt0(r.gap_parameter_q50||r.gap_abs),num:true},{label:"2.5%",value:r=>fmt0(r.gap_parameter_q025),num:true},{label:"97.5%",value:r=>fmt0(r.gap_parameter_q975),num:true},{label:"P(gap>0)",value:r=>pct(r.probability_positive_representation_gap),num:true}], {caption:`Robust gap rows ${index*15+1}-${index*15+part.length}`, dense:true})}`, { source:"factPotentialGap.top" })));
    pages.push(page("forecast", "Scenario semantics", `
      <span class="report-page-kicker">${esc(enKicker("forecast"))}</span><h1>What the scenario layer means</h1>
      <ul><li>A scenario answers "what follows under these assumptions"; it is not an observed future value.</li><li>Positive and negative gaps are redistributive within aggregate capacity and must not be summed as extra national enrolment.</li><li>Intervals describe parameter uncertainty for the structural distribution; they are not full predictive intervals for all future shocks.</li></ul>`, { source:"potentialForecast.semantics; factPotentialGap.semantics" }));
    return pages;
  }

  function buildEnglishReceptivityPages(data) {
    const p = data.payload;
    const rows = p.friendlinessIndex?.rows || [];
    const vacancies = p.vacancyCompetency || {};
    const programRows = vacancies.programDemand || vacancies.programs || vacancies.programDemandRows || [];
    const pages = [divider("receptivity", "06", sectionLabelFor("receptivity", "en"), "Ex-ante receptivity, component coverage and privacy-safe labor-demand evidence.", [["Countries", fmt0(rows.length)], ["Vacancy input", fmt0(vacancies.inputUniqueVacancies)], ["Classified", fmt0(vacancies.classifiedUniqueVacancies)]])];
    pages.push(page("receptivity", "Receptivity score leaders", `
      <span class="report-page-kicker">${esc(enKicker("receptivity"))}</span><h1>Bounded receptivity score</h1>
      ${barChart(rows.slice().sort((a,b)=>num(b.friendliness_ex_ante_score)-num(a.friendliness_ex_ante_score)).slice(0,15), r=>countryName(r.iso3,r.country), r=>r.friendliness_ex_ante_score, {limit:15, caption:"Ex-ante composite score with component coverage and uncertainty bounds."})}
      <div class="report-callout"><strong>Rank discipline:</strong> limited coverage should be read as a validation need, not as exact country ordering.</div>`, { source:"friendlinessIndex.rows" }));
    pages.push(page("receptivity", "Coverage and bounds", `
      <span class="report-page-kicker">${esc(enKicker("receptivity"))}</span><h1>Component coverage and uncertainty bounds</h1>
      ${table(rows.slice(0,30), [{label:"Country",value:r=>countryName(r.iso3,r.country)},{label:"Score",value:r=>fmt1(r.friendliness_ex_ante_score),num:true},{label:"Low",value:r=>fmt1(r.friendliness_score_lower_bound),num:true},{label:"High",value:r=>fmt1(r.friendliness_score_upper_bound),num:true},{label:"Coverage",value:r=>pct(r.component_coverage_score),num:true},{label:"Class",value:r=>humanCode(r.reliability_class||r.coverage_class)}], {caption:"First rows of the receptivity evidence table", dense:true})}`, { source:"friendlinessIndex.rows" }));
    pages.push(page("receptivity", "Vacancy and competency evidence", `
      <span class="report-page-kicker">${esc(enKicker("receptivity"))}</span><h1>Privacy-safe labor-demand evidence</h1>
      ${metrics([["Input vacancies", fmt0(vacancies.inputUniqueVacancies), "sanitized records", "official"], ["Classified vacancies", fmt0(vacancies.classifiedUniqueVacancies), "program evidence", "model"], ["Query totals used?", vacancies.queryTotalsUsedInScore ? "yes" : "no", "must be no for scores", "warning"], ["Privacy", "sanitized", "no personal contacts in public UI", "official"]])}
      ${table(programRows.slice(0,20), [{label:"Program",value:programLabel},{label:"Demand score",value:r=>fmt1(r.program_labor_demand_score||r.score),num:true},{label:"Vacancies",value:r=>fmt0(r.unique_vacancies||r.vacancy_count),num:true},{label:"Skills",value:r=>fmt0(r.skill_count||r.skills_count),num:true}], {caption:"Program-demand evidence, where available", dense:true})}`, { source:"vacancyCompetency; Trudvsem sanitized public artifacts" }));
    return pages;
  }

  function buildEnglishMatrixPages(data) {
    const rows = data.payload.countryProgramMatrix?.rows || [];
    const pages = [divider("matrix", "07", sectionLabelFor("matrix", "en"), "Country-program-language-instrument recommendations with scenario sensitivity and evidence tiers.", [["Rows", fmt0(rows.length)], ["Countries", fmt0(new Set(rows.map(r=>r.iso3)).size)], ["Program groups", fmt0(new Set(rows.map(r=>r.program_group)).size)]])];
    pages.push(page("matrix", "Top country-program priorities", `
      <span class="report-page-kicker">${esc(enKicker("matrix"))}</span><h1>Top priority combinations</h1>
      ${table(rows.slice().sort((a,b)=>num(a.rank_country_program_priority,9999)-num(b.rank_country_program_priority,9999)).slice(0,30), [{label:"Rank",value:r=>fmt0(r.rank_country_program_priority),num:true},{label:"Country",value:r=>countryName(r.iso3,r.country)},{label:"Program",value:programLabel},{label:"Index",value:r=>fmt1(r.combined_country_program_priority_score),num:true},{label:"Low-high",value:r=>`${fmt1(r.priority_evidence_low)}-${fmt1(r.priority_evidence_high)}`},{label:"Tier",value:r=>humanCode(r.priority_decision_tier)}], {caption:"Uncertainty-aware management priority index", dense:true})}`, { source:"countryProgramMatrix.rows" }));
    pages.push(page("matrix", "Instrument and evaluation protocol", `
      <span class="report-page-kicker">${esc(enKicker("matrix"))}</span><h1>Instrument and evaluation protocol</h1>
      ${table(rows.slice(0,20), [{label:"Country",value:r=>countryName(r.iso3,r.country)},{label:"Program",value:programLabel},{label:"Language",value:r=>humanCode(r.teaching_language||"aggregate_all_languages")},{label:"Instrument",value:r=>humanCode(r.recruitment_instrument)},{label:"Evaluation design",value:r=>truncate(humanCode(r.recommended_evaluation_design),80)}], {caption:"Recommended next-step protocol, first rows", dense:true})}
      <div class="report-callout is-blue"><strong>Semantics:</strong> the matrix reports a comparative decision-support index. The effect of an instrument is not identified before a pilot or quasi-experimental design.</div>`, { source:"countryProgramMatrix.recommended_evaluation_design" }));
    return pages;
  }

  function profilePageEn(item, index, total) {
    const best = item.best || {};
    const ref = item.ref || {};
    const d = ref.demography || {};
    const gap = item.gap || {};
    const friend = item.friend || {};
    const actual = num(item.inbound?.students_observed ?? gap.actual_students_latest);
    const country = countryName(item.iso3, best.country || ref.name);
    const programs = (item.rows || []).slice().sort((a,b)=>num(b.combined_country_program_priority_score)-num(a.combined_country_program_priority_score));
    const rank = num(best.rank_country_program_priority, index + 1);
    const change = num(d.studentPool2026) ? num(d.studentPool2050) / num(d.studentPool2026) - 1 : 0;
    const gapValue = gap.gap_parameter_q50 ?? best.representation_gap_q50 ?? best.representation_gap;
    const gapLow = gap.gap_parameter_q025 ?? best.representation_gap_q025;
    const gapHigh = gap.gap_parameter_q975 ?? best.representation_gap_q975;
    const evalDesign = humanCode(best.recommended_evaluation_design || "targeted validation pilot with counterfactual comparison");
    const kpis = humanCode(best.recommended_evaluation_kpis || "qualified_leads; applications; offers; enrolments; yield; cost_per_enrolment");
    return page("profiles", country, `
      <div class="report-profile-head"><div><span class="report-page-kicker">${esc(enKicker("profiles"))} ${index+1} of ${total}</span><h1>${esc(country)}</h1><p>${esc(ref.region || best.macroregion || "n/a")} · ${esc(ref.incomeGroup || "income group not specified")} · ISO3 ${esc(item.iso3)}</p></div><div class="report-profile-rank"><span>best combination rank</span><strong>${esc(fmt0(rank))}</strong></div></div>
      <div class="report-profile-grid"><div>
        ${metrics([["UIS stock", actual?fmt0(actual):"n/a", actual?`${item.inbound?.year||gap.actual_period||""}`:"not in topOrigins", actual?"official":"warning"], ["Gap q50", Number.isFinite(Number(gapValue))?fmt0(gapValue):"n/a", Number.isFinite(Number(gapLow))?`${fmt0(gapLow)} ... ${fmt0(gapHigh)}`:"interval unavailable", "model"], ["Receptivity", Number.isFinite(Number(friend.friendliness_ex_ante_score))?fmt1(friend.friendliness_ex_ante_score):"n/a", friend.component_coverage_score?`coverage ${pct(friend.component_coverage_score)}`:"no coverage", "model"], ["Pool 2050", d.studentPool2050?fmt0(d.studentPool2050):"n/a", d.studentPool2026?`${change>=0?"+":""}${pct(change)} vs 2026`:"WPP unavailable", "official"]])}
        <div class="report-callout ${num(gap.probability_positive_representation_gap)>=.8?"is-green":""}"><strong>Structural hypothesis:</strong> ${Number.isFinite(Number(gapValue))?`Median gap is ${fmt0(gapValue)} equivalents; probability of a positive gap is ${pct(gap.probability_positive_representation_gap)}.`:"The country is present in the management matrix, but a stable observed gap row is not available."}</div>
      </div><div>
        <h3>Best combination</h3><p><strong>${esc(programLabel(best))}</strong></p>
        <dl class="report-definition-list"><div><dt>Index</dt><dd>${fmt1(best.combined_country_program_priority_score)}</dd></div><div><dt>Range</dt><dd>${fmt1(best.priority_evidence_low)}-${fmt1(best.priority_evidence_high)}</dd></div><div><dt>Tier</dt><dd>${esc(humanCode(best.priority_decision_tier))}</dd></div><div><dt>Language</dt><dd>${esc(humanCode(best.teaching_language || "aggregate_all_languages"))}</dd></div><div><dt>Instrument</dt><dd>${esc(humanCode(best.recruitment_instrument || "expert_validation"))}</dd></div></dl>
        <p class="report-profile-note"><strong>Limit:</strong> ${esc(humanCode(best.score_semantics || "uncertainty_adjusted_management_priority_index_not_predicted_student_count"))}</p>
      </div></div>
      <div class="report-profile-programs">${table(programs,[{label:"Program",value:programLabel},{label:"Opportunity",value:r=>fmt1(r.country_opportunity_score),num:true},{label:"Receptivity",value:r=>fmt1(r.friendliness_ex_ante_score),num:true},{label:"Fit",value:r=>fmt1(r.program_fit_score),num:true},{label:"Labor",value:r=>fmt1(r.program_labor_demand_score),num:true},{label:"Index",value:r=>fmt1(r.combined_country_program_priority_score),num:true},{label:"Scenarios",value:r=>`${fmt1(r.priority_scenario_min)}-${fmt1(r.priority_scenario_max)}`}], {caption:"Program-group comparison", dense:true})}</div>
      <div class="report-card-grid" style="margin-top:3mm"><article class="report-card is-blue"><h3>Validation design</h3><p>${esc(truncate(evalDesign,260))}</p></article><article class="report-card is-gold"><h3>KPIs</h3><p>${esc(truncate(kpis,260))}</p></article></div>`, { shortTitle:`Profile: ${country}`, source:`countryProgramMatrix; factPotentialGap; friendlinessIndex; public_country_reference; iso3=${item.iso3}` });
  }

  function buildEnglishProfilePages(data, cfg) {
    const selected = data.profileCountries.slice(0, cfg.profileCount);
    const pages = [divider("profiles", "08", sectionLabelFor("profiles", "en"), "Automatically generated market cards: facts, model intervals, program fit, instruments and validation design.", [["Profiles", fmt0(selected.length)], ["Pages per country", "1"], ["Programs per card", "5"]])];
    selected.forEach((item,index)=>pages.push(profilePageEn(item,index,selected.length)));
    return pages;
  }

  function buildEnglishSourcePages(data) {
    const sources = data.payload.sourceRegistry?.sources || [];
    const totalRows = sum(sources, r=>r.row_count);
    const pages = [divider("sources", "09", sectionLabelFor("sources", "en"), "Data provenance, access notes, retrieval dates, row counts and checksums.", [["Sources", fmt0(sources.length)], ["Registry rows", fmt0(totalRows)], ["Integrity", "SHA-256"]])];
    pages.push(page("sources", "Source registry overview", `
      <span class="report-page-kicker">${esc(enKicker("sources"))}</span><h1>Evidence-base overview</h1>
      ${metrics([["Source passports", fmt0(sources.length), "official and derived", "official"], ["Sum of row_count", fmt0(totalRows), "technical audit only", "official"], ["With access terms", fmt0(sources.filter(s=>s.license_or_terms || s.access_note).length), "preserved", "official"], ["With checksum", fmt0(sources.filter(s=>String(s.sha256||"").length>=32).length), "integrity control", "official"]])}
      <div class="report-callout">The sum of row_count mixes units of analysis and must not be read as a count of countries, students or vacancies.</div>`, { source:"sourceRegistry.sources" }));
    chunks(sources, 4).forEach((part,index)=>pages.push(page("sources", `Source passports - ${index+1}`, `
      <span class="report-page-kicker">${esc(enKicker("sources"))}</span><h1>Source passports - ${index+1}</h1>
      ${part.map(s=>`<article class="report-source-card"><h3>${esc(s.source_id)}</h3><div class="source-id">${sourceCitation(s.url || "local artifact")}</div><dl><div><dt>Retrieved</dt><dd>${esc(s.retrieved_at_utc || "n/a")}</dd></div><div><dt>Rows</dt><dd>${fmt0(s.row_count)}</dd></div><div><dt>Period</dt><dd>${esc([s.year_min,s.year_max].filter(v=>v!==null&&v!==undefined).join("-") || "n/a")}</dd></div><div><dt>Countries</dt><dd>${esc(s.country_count ?? "n/a")}</dd></div><div><dt>Status</dt><dd>${esc(s.validation_status || "n/a")}</dd></div><div><dt>Clearance</dt><dd>${esc(s.license_clearance_status || "n/a")}</dd></div><div><dt>SHA-256</dt><dd>${esc(s.sha256 || (s.license_clearance_status === "not_applicable_internal_derived" ? "N/A - internal derived artifact" : "n/a"))}</dd></div><div><dt>Bytes</dt><dd>${fmt0(s.bytes)}</dd></div></dl><p class="source-purpose"><strong>Access note:</strong> ${sourceCitation(truncate(s.access_note || s.license_or_terms || "not specified",260))}</p></article>`).join("")}`, { source:"sourceRegistry.sources; publication URLs and checksums" })));
    return pages;
  }

  function englishQualityChecks(data) {
    const p = data.payload;
    const sourceRows = p.sourceRegistry?.sources || [];
    const matrix = p.countryProgramMatrix?.rows || [];
    const m = p.countryProgramMatrix?.model || {};
    const gaps = p.factPotentialGap?.top || [];
    const caps = p.potentialForecast?.capacityScenarios || [];
    return [
      ["Source passports are present", sourceRows.length > 0, `${sourceRows.length} passports`],
      ["External checksums are present", sourceRows.filter(s=>s.license_clearance_status!=="not_applicable_internal_derived").every(s=>String(s.sha256||"").length>=32), "external source rows"],
      ["Matrix has complete Cartesian size", matrix.length===num(m.n_countries)*num(m.n_program_groups), `${matrix.length} = ${m.n_countries} x ${m.n_program_groups}`],
      ["Country keys are ISO3", matrix.every(r=>/^[A-Z]{3}$/.test(String(r.iso3||""))), "all matrix rows"],
      ["Scenario series covers 2026-2050", caps.length===25&&num(caps[0]?.year)===2026&&num(caps.at(-1)?.year)===2050, `${caps.length} years`],
      ["Gap intervals are ordered", gaps.every(r=>num(r.gap_parameter_q025)<=num(r.gap_parameter_q50)&&num(r.gap_parameter_q50)<=num(r.gap_parameter_q975)), `${gaps.length} rows`],
      ["Classified vacancies do not exceed input", num(p.vacancyCompetency?.classifiedUniqueVacancies)<=num(p.vacancyCompetency?.inputUniqueVacancies), `${fmt0(p.vacancyCompetency?.classifiedUniqueVacancies)} <= ${fmt0(p.vacancyCompetency?.inputUniqueVacancies)}`],
      ["Search-result totals are excluded from score", p.vacancyCompetency?.queryTotalsUsedInScore===false, "false"],
      ["PPML converged", p.gravityModel?.diagnostics?.converged===true, "converged=true"],
      ["Public country reference is loaded", data.countryRows.length>=200, `${data.countryRows.length} countries/territories`],
      ["Observed total is positive", (p.russiaInbound?.yearTotals||[]).some(r=>num(r.students_observed)>0), `latest=${p.russiaInbound?.latestYear}`],
    ].map(([name,pass,note])=>({name,pass,note}));
  }

  function buildEnglishTechnicalPages(data, cfg) {
    const p = data.payload;
    const checks = englishQualityChecks(data);
    const dictionary = [
      ["students_observed", "Observed enrolled internationally mobile student stock", "students", "official"],
      ["student_pool", "Pop15-24 + 0.45 x Pop25-29", "persons", "calculated"],
      ["model_based_attraction_capacity", "Structural share multiplied by aggregate scenario capacity", "capacity-equivalent students", "modelled"],
      ["representation_gap", "Structural capacity minus demographic-continuity baseline", "capacity-equivalent students", "calculated"],
      ["friendliness_ex_ante_score", "Weighted composite of available receptivity components", "0-100", "calculated"],
      ["program_labor_demand_score", "Normalized relative signal of demand by program group", "0-100", "calculated"],
      ["combined_country_program_priority_score", "Median scenario management score", "0-100", "decision support"],
    ];
    const pages = [divider("technical", "10", sectionLabelFor("technical", "en"), "Field dictionary, formulas, automated checks, manifest and update protocol.", [["Checks", fmt0(checks.length)], ["Passed", fmt0(checks.filter(c=>c.pass).length)], ["Version", VERSION]])];
    pages.push(page("technical", "Key-field dictionary", `
      <span class="report-page-kicker">${esc(enKicker("technical"))}</span><h1>Key-field dictionary</h1>
      ${table(dictionary.map(r=>({field:r[0],definition:r[1],unit:r[2],status:r[3]})), [{label:"Field",value:"field"},{label:"Definition",value:"definition"},{label:"Unit",value:"unit"},{label:"Status",value:"status"}], {caption:"Publication dictionary", dense:true})}`, { source:"canonical payload schemas and module semantics" }));
    pages.push(page("technical", "Automated release checks", `
      <span class="report-page-kicker">${esc(enKicker("technical"))}</span><h1>Automated checks during generation</h1>
      ${table(checks, [{label:"Check",value:"name"},{label:"Result",value:r=>r.pass?"PASSED":"FAILED"},{label:"Diagnostic",value:"note"}], {caption:`Passed ${checks.filter(c=>c.pass).length} of ${checks.length}`})}
      <div class="report-callout ${checks.every(c=>c.pass)?"is-green":"is-red"}"><strong>Result:</strong> ${checks.every(c=>c.pass)?"critical structural checks passed; the document can be interpreted with the stated limitations.":"errors were detected; interpretation requires remediation."}</div>`, { source:"runtime validation of canonical JSON" }));
    pages.push(page("technical", "Generation manifest", `
      <span class="report-page-kicker">${esc(enKicker("technical"))}</span><h1>Generation manifest</h1>
      <dl class="report-definition-list"><div><dt>document_id</dt><dd><code>${esc(cfg.documentId)}</code></dd></div><div><dt>generator</dt><dd><code>assets/executive-report.js@${VERSION}</code></dd></div><div><dt>lang</dt><dd>${esc(cfg.lang)}</dd></div><div><dt>locale</dt><dd>${esc(cfg.locale)}</dd></div><div><dt>payload</dt><dd><code>data/mgimo_platform2_payload.json</code></dd></div><div><dt>country reference</dt><dd><code>data/platform2/public_country_reference.json</code></dd></div><div><dt>payload generated_at</dt><dd>${esc(p.metadata?.generated_at||"n/a")}</dd></div><div><dt>model upgrade</dt><dd>${esc(p.metadata?.model_upgrade||"n/a")}</dd></div><div><dt>profile_count</dt><dd>${fmt0(cfg.profileCount)}</dd></div><div><dt>selected sections</dt><dd>${esc(cfg.sections.join(", "))}</dd></div></dl>
      <p>The full JSON manifest, including the final content SHA-256, is available from the report toolbar after generation.</p>`, { source:"runtime report configuration and payload metadata" }));
    pages.push(page("technical", "Update protocol", `
      <span class="report-page-kicker">${esc(enKicker("technical"))}</span><h1>Update protocol</h1>
      <ol><li>Update source files or API snapshots with retrieval date, access note and checksum.</li><li>Rebuild canonical tables and model artifacts; do not edit publication JSON by hand.</li><li>Run schema, range, key, interval and Cartesian-size validators.</li><li>Review model metrics, benchmark and source-composition changes.</li><li>Publish static GitHub Pages artifacts and regenerate the report.</li><li>Archive PDF and JSON manifest with approval date.</li></ol>
      <div class="report-callout is-blue"><strong>Principle:</strong> data updates may change numbers and charts automatically, but methodological definitions require explicit versioning.</div>`, { source:"source registry and deterministic report architecture" }));
    return pages;
  }

  const BUILDERS_EN = {
    method: buildEnglishMethodPages,
    inbound: buildEnglishInboundPages,
    demography: buildEnglishDemographyPages,
    model: buildEnglishModelPages,
    forecast: buildEnglishForecastPages,
    receptivity: buildEnglishReceptivityPages,
    matrix: buildEnglishMatrixPages,
    profiles: buildEnglishProfilePages,
    sources: buildEnglishSourcePages,
    technical: buildEnglishTechnicalPages,
  };

  function qualityChecks(data) {
    const p=data.payload;
    const sourceRows=p.sourceRegistry?.sources||[];
    const matrix=p.countryProgramMatrix?.rows||[];
    const m=p.countryProgramMatrix?.model||{};
    const gaps=p.factPotentialGap?.top||[];
    const caps=p.potentialForecast?.capacityScenarios||[];
    const checks=[
      ["Паспорта источников присутствуют",sourceRows.length>0,`${sourceRows.length} паспортов`],
      ["Контрольные суммы внешних источников",sourceRows.filter(s=>s.license_clearance_status!=="not_applicable_internal_derived").every(s=>String(s.sha256||"").length>=32),`${sourceRows.filter(s=>s.license_clearance_status!=="not_applicable_internal_derived"&&String(s.sha256||"").length>=32).length}/${sourceRows.filter(s=>s.license_clearance_status!=="not_applicable_internal_derived").length}; внутренние derived — N/A`],
      ["Матрица имеет полный декартов размер",matrix.length===num(m.n_countries)*num(m.n_program_groups),`${matrix.length} = ${m.n_countries} × ${m.n_program_groups}`],
      ["Страновые ключи ISO3",matrix.every(r=>/^[A-Z]{3}$/.test(String(r.iso3||""))),"все строки матрицы"],
      ["Сценарный ряд 2026–2050",caps.length===25&&num(caps[0]?.year)===2026&&num(caps.at(-1)?.year)===2050,`${caps.length} лет`],
      ["Интервалы разрыва упорядочены",gaps.every(r=>num(r.gap_parameter_q025)<=num(r.gap_parameter_q50)&&num(r.gap_parameter_q50)<=num(r.gap_parameter_q975)),`${gaps.length} строк`],
      ["Классифицированные вакансии ≤ входа",num(p.vacancyCompetency?.classifiedUniqueVacancies)<=num(p.vacancyCompetency?.inputUniqueVacancies),`${fmt0(p.vacancyCompetency?.classifiedUniqueVacancies)} ≤ ${fmt0(p.vacancyCompetency?.inputUniqueVacancies)}`],
      ["Поисковые итоги исключены из балла",p.vacancyCompetency?.queryTotalsUsedInScore===false,"false"],
      ["PPML сошлась",p.gravityModel?.diagnostics?.converged===true,"converged=true"],
      ["Краткосрочный бенчмарк раскрыт",Boolean(p.gravityModel?.persistence_benchmark),p.gravityModel?.persistence_benchmark?.name||"—"],
      ["Публичный справочник стран",data.countryRows.length>=200,`${data.countryRows.length} стран/территорий`],
      ["Наблюдаемый итог положителен",(p.russiaInbound?.yearTotals||[]).some(r=>num(r.students_observed)>0),`latest=${p.russiaInbound?.latestYear}`],
    ];
    return checks.map(([name,pass,note])=>({name,pass,note}));
  }

  function buildTechnicalPages(data,cfg) {
    const p=data.payload;
    const checks=qualityChecks(data);
    const dictionary=[
      ["students_observed","Наблюдаемый зачисленный контингент международно мобильных студентов","students","official"],
      ["student_pool","Pop 15–24 + 0,45 × Pop 25–29","persons","calculated"],
      ["model_based_attraction_capacity","Структурная доля PPML × общая сценарная ёмкость","students_capacity_equivalent","modelled"],
      ["demographic_continuity_baseline","Инерционное распределение при демографическом изменении","students_capacity_equivalent","modelled"],
      ["representation_gap","Структурная ёмкость минус демографический ориентир","students_capacity_equivalent","calculated"],
      ["friendliness_ex_ante_score","Взвешенный композит доступных компонентов","0–100","calculated"],
      ["component_coverage_score","Сумма весов доступных компонентов","0–1","calculated"],
      ["program_labor_demand_score","Нормированный относительный сигнал спроса по программной группе","0–100","calculated"],
      ["combined_country_program_priority_score","Медиана сценарных управленческих баллов","0–100","decision support"],
      ["priority_evidence_low/high","Объединённые границы данных, параметров и весов","0–100","uncertainty"],
    ];
    const pages=[divider("technical","10","Технические приложения","Словарь показателей, формулы, автоматические проверки, манифест и регламент обновления.",[["Проверок",fmt0(checks.length)],["Пройдено",fmt0(checks.filter(c=>c.pass).length)],["Версия",VERSION]])];
    pages.push(page("technical","Словарь ключевых показателей",`
      <span class="report-page-kicker">10 · Приложения</span><h1>Словарь ключевых показателей</h1>
      ${table(dictionary.map(r=>({field:r[0],definition:r[1],unit:r[2],status:r[3]})),[{label:"Поле",value:"field"},{label:"Определение",value:"definition"},{label:"Единица",value:"unit"},{label:"Статус",value:"status"}],{caption:"Публикационный словарь",dense:true})}`,{source:"canonical payload schemas and module semantics"}));
    pages.push(page("technical","Реестр формул",`
      <span class="report-page-kicker">10 · Приложения</span><h1>Реестр формул</h1>
      <dl class="report-definition-list"><div><dt>Студенческий пул</dt><dd>P = Pop15–24 + 0,45 × Pop25–29.</dd></div><div><dt>PPML</dt><dd>E(Y|X)=exp(Xβ + fixed effects).</dd></div><div><dt>Структурная доля</dt><dd>s=exp(Xβ)/Σexp(Xβ).</dd></div><div><dt>Страновая ёмкость</dt><dd>A=C×s.</dd></div><div><dt>Общая ёмкость</dt><dd>C=S2023×R<sup>ε</sup>, ε∈{0,5;1;1,5}.</dd></div><div><dt>Разрыв</dt><dd>G=A−B, ΣG=0.</dd></div><div><dt>Восприимчивость</dt><dd>F=100×Σwz с нейтральной импутацией и bounds.</dd></div><div><dt>Трудовой сигнал</dt><dd>L=.45V+.15W+.10E+.10R+.08S+.07H+.05K.</dd></div><div><dt>Матрица</dt><dd>M=wOO+wFF+wPP+wLL; headline=median across scenarios.</dd></div></dl>`,{source:"method sections; model cards; score formulas"}));
    pages.push(page("technical","Автоматические проверки релиза",`
      <span class="report-page-kicker">10 · Приложения</span><h1>Автоматические проверки при формировании</h1>
      ${table(checks,[{label:"Проверка",value:"name"},{label:"Результат",value:r=>r.pass?"ПРОЙДЕНО":"ОШИБКА"},{label:"Диагностика",value:"note"}],{caption:`Пройдено ${checks.filter(c=>c.pass).length} из ${checks.length}`})}
      <div class="report-callout ${checks.every(c=>c.pass)?"is-green":"is-red"}"><strong>Итог:</strong> ${checks.every(c=>c.pass)?"критические структурные проверки пройдены; документ может быть сформирован.":"обнаружены ошибки; интерпретация доклада требует устранения замечаний."}</div>`,{source:"runtime validation of canonical JSON"}));
    pages.push(page("technical","Манифест генерации",`
      <span class="report-page-kicker">10 · Приложения</span><h1>Манифест генерации</h1>
      <dl class="report-definition-list"><div><dt>document_id</dt><dd><code>${esc(cfg.documentId)}</code></dd></div><div><dt>generator</dt><dd><code>assets/executive-report.js@${VERSION}</code></dd></div><div><dt>payload</dt><dd><code>data/mgimo_platform2_payload.json</code></dd></div><div><dt>country reference</dt><dd><code>data/platform2/public_country_reference.json</code></dd></div><div><dt>payload generated_at</dt><dd>${esc(p.metadata?.generated_at||"—")}</dd></div><div><dt>model upgrade</dt><dd>${esc(p.metadata?.model_upgrade||"—")}</dd></div><div><dt>profile_count</dt><dd>${fmt0(cfg.profileCount)}</dd></div><div><dt>selected sections</dt><dd>${esc(cfg.sections.join(", "))}</dd></div><div><dt>browser locale</dt><dd>${esc(navigator.language||"—")}</dd></div></dl>
      <p>Полный JSON-манифест, включая итоговый SHA-256 содержания, доступен отдельной кнопкой в модуле после сборки.</p>`,{source:"runtime report configuration and payload metadata"}));
    pages.push(page("technical","Регламент обновления",`
      <span class="report-page-kicker">10 · Приложения</span><h1>Регламент обновления доклада</h1>
      <ol><li>Обновить исходные файлы и API-снимки с фиксацией даты, условий использования и checksum.</li><li>Пересобрать канонические таблицы и модельные артефакты; не редактировать публикационный JSON вручную.</li><li>Запустить валидацию схемы, диапазонов, ключей, интервалов и декартового размера матрицы.</li><li>Проверить модельные метрики, бенчмарк и изменения состава источников.</li><li>Опубликовать статические артефакты GitHub Pages и сформировать доклад повторно.</li><li>Сохранить PDF и JSON-манифест в архив решения вместе с датой утверждения.</li></ol>
      <div class="report-callout is-blue"><strong>Принцип:</strong> обновление данных должно автоматически менять числа и графики, но не методические определения без отдельного версионирования.</div>`,{source:"source registry and deterministic report architecture"}));
    pages.push(page("technical","Шаблон управленческого протокола",`
      <span class="report-page-kicker">10 · Приложения</span><h1>Шаблон протокола по итогам рассмотрения</h1>
      <div class="report-chart-placeholder"><div><strong>Место для решения коллегиального органа</strong><p>Выбранные страны и программы · основания · владельцы · бюджет пилота · KPI · дата контрольной точки · правило масштабирования/остановки.</p></div></div>
      <h3>Обязательные поля</h3><p>Идентификатор версии доклада; номера страновых страниц; выбранный сценарий весов; аргументация отклонения от рейтинга; перечень недостающих данных; дизайн оценки эффекта; ответственный подразделения; срок повторного рассмотрения.</p>
      <div class="report-callout">Эта страница намеренно оставлена как типовая форма: она не заполняется автоматически, поскольку содержит управленческое решение, а не результат аналитического расчёта.</div>`,{source:"management decision template"}));
    pages.push(page("technical","Заключение",`
      <span class="report-page-kicker">10 · Приложения</span><h1>Заключение</h1>
      <p class="report-page-deck">Платформа превращает разрозненные фактические, демографические, модельные и трудовые данные в воспроизводимый контур принятия решений.</p>
      <div class="report-card-grid"><article class="report-card is-green"><h3>Что установлено</h3><p>Фактическая структура контингента, демографический масштаб рынков, структурные отклонения и сопоставление программ.</p></article><article class="report-card is-blue"><h3>Что оценено</h3><p>Сценарная ёмкость, параметрическая неопределённость, восприимчивость и относительный трудовой сигнал.</p></article><article class="report-card is-gold"><h3>Что предлагается</h3><p>Ранжированный портфель гипотез, инструменты рекрутинга и дизайн последующей оценки.</p></article><article class="report-card is-red"><h3>Что не заявляется</h3><p>Гарантированный набор, причинный эффект до пилота, перепись вакансий или неизменность будущей среды.</p></article></div>
      <div class="report-formula">Доказательство → гипотеза → пилот → измерение → пересмотр решения</div>`,{source:"all canonical modules; executive-report generator"}));
    return pages;
  }

  const BUILDERS = {
    method: buildMethodPages,
    inbound: buildInboundPages,
    demography: buildDemographyPages,
    model: buildModelPages,
    forecast: buildForecastPages,
    receptivity: buildReceptivityPages,
    matrix: buildMatrixPages,
    profiles: buildProfilePages,
    sources: buildSourcePages,
    technical: buildTechnicalPages,
  };

  function tocRow(number,title,pageNumber) {
    return `<div class="report-toc-row"><span>${esc(number)}</span><strong>${esc(title)}</strong><span>${esc(pageNumber)}</span></div>`;
  }

  function buildTocPages(content,frontCount) {
    const tocCount=3;
    const pageOf=(index)=>frontCount+tocCount+index+1;
    const lang = reportLang();
    const chapters=DEFAULT_SECTIONS.map((key,index)=>{
      const at=content.findIndex(p=>p.section===key);
      return at>=0?{number:String(index+1).padStart(2,"0"),label:sectionLabelFor(key, lang),page:pageOf(at)}:null;
    }).filter(Boolean);
    const profileEntries=content.map((p,index)=>({p,index})).filter(x=>x.p.section==="profiles"&&!x.p.className.includes("report-divider-page"));
    const first=profileEntries.slice(0,30), second=profileEntries.slice(30);
    const profileTitle = (item) => item.shortTitle.replace(/^Профиль:\s*/,"").replace(/^Profile:\s*/,"");
    if (lang === "en") {
      const firstPage=page("toc","Contents",`
        <span class="report-page-kicker">Contents</span><h1>Contents</h1><p class="report-page-deck">Page numbers are calculated automatically after section and profile selection.</p>
        <div class="report-toc-list">${chapters.map(x=>tocRow(x.number,x.label,x.page)).join("")}</div>
        <div class="report-callout is-blue"><strong>Reading structure:</strong> chapters 1-7 set the evidence and analytical base; chapter 8 turns it into country cards; chapters 9-10 provide audit and reproducibility.</div>`,{toc:false,source:"runtime pagination"});
      const profilePageA=page("toc","Country profile contents I",`
        <span class="report-page-kicker">Contents · country profiles</span><h1>Country profiles · I</h1>
        <div class="report-toc-country-grid">${first.map((x,i)=>tocRow(i+1,profileTitle(x.p),pageOf(x.index))).join("")||"<p>The section is not selected.</p>"}</div>`,{toc:false,source:"runtime pagination"});
      const profilePageB=page("toc","Country profile contents II",`
        <span class="report-page-kicker">Contents · country profiles</span><h1>Country profiles · II</h1>
        <div class="report-toc-country-grid">${second.map((x,i)=>tocRow(first.length+i+1,profileTitle(x.p),pageOf(x.index))).join("")||"<p>No additional profiles selected.</p>"}</div>
        <h3>Legend</h3><div class="report-card-grid"><article class="report-card is-green"><h3>Official</h3><p>Published source row or reference line.</p></article><article class="report-card is-blue"><h3>Modelled</h3><p>Calculated estimate with model_id and interval.</p></article><article class="report-card is-gold"><h3>Scenario</h3><p>Conditional trajectory under stated assumptions.</p></article><article class="report-card is-red"><h3>Limit</h3><p>A signal requiring cautious interpretation.</p></article></div>`,{toc:false,source:"runtime pagination"});
      return [firstPage,profilePageA,profilePageB];
    }
    const firstPage=page("toc","Содержание",`
      <span class="report-page-kicker">Содержание</span><h1>Содержание</h1><p class="report-page-deck">Номера рассчитаны автоматически после выбора разделов и числа страновых профилей.</p>
      <div class="report-toc-list">${chapters.map(x=>tocRow(x.number,x.label,x.page)).join("")}</div>
      <div class="report-callout is-blue"><strong>Структура чтения:</strong> главы 1–7 задают доказательную и аналитическую основу; глава 8 переводит её в страновые карточки; главы 9–10 обеспечивают аудит и воспроизводимость.</div>`,{toc:false,source:"runtime pagination"});
    const profilePageA=page("toc","Содержание страновых профилей I",`
      <span class="report-page-kicker">Содержание · страновые профили</span><h1>Страновые профили · I</h1>
      <div class="report-toc-country-grid">${first.map((x,i)=>tocRow(i+1,profileTitle(x.p),pageOf(x.index))).join("")||"<p>Раздел не выбран.</p>"}</div>`,{toc:false,source:"runtime pagination"});
    const profilePageB=page("toc","Содержание страновых профилей II",`
      <span class="report-page-kicker">Содержание · страновые профили</span><h1>Страновые профили · II</h1>
      <div class="report-toc-country-grid">${second.map((x,i)=>tocRow(first.length+i+1,profileTitle(x.p),pageOf(x.index))).join("")||"<p>Дополнительные профили не выбраны.</p>"}</div>
      <h3>Условные обозначения</h3><div class="report-card-grid"><article class="report-card is-green"><h3>Официальное</h3><p>Опубликованная или справочная строка источника.</p></article><article class="report-card is-blue"><h3>Модельное</h3><p>Рассчитанный показатель с model_id и интервалом.</p></article><article class="report-card is-gold"><h3>Сценарное</h3><p>Условная траектория при заданных параметрах.</p></article><article class="report-card is-red"><h3>Ограничение</h3><p>Сигнал, требующий осторожной интерпретации.</p></article></div>`,{toc:false,source:"runtime pagination"});
    return [firstPage,profilePageA,profilePageB];
  }

  function sectionLabel(key) {
    return sectionLabelFor(key, reportLang()) || SPECIAL_SECTION_LABELS[reportLang()]?.report;
  }

  function renderSheet(item,pageNumber,total,cfg) {
    const source=item.source&&!item.body.includes("report-source-line")?sourceLine(item.source):"";
    return `<section class="report-sheet ${esc(item.className)}" data-report-page="${pageNumber}" data-report-section="${esc(item.section)}">
      <header class="report-page-head"><span>${esc(sectionLabel(item.section))}</span><small>${esc(cfg.documentId)}<br>${esc(cfg.generatedDate)}</small></header>
      <main class="report-page-main">${item.body}${source}</main>
      <footer class="report-page-footer"><span>${esc(truncate(cfg.title,52))}</span><span>${pageNumber}</span><span>${pageNumber} / ${total}</span></footer>
    </section>`;
  }

  function readComposerState() {
    const lang = reportLang();
    const titleEl = q("#managementReportTitle");
    if (titleEl) {
      const title = titleEl.value.trim();
      const isDefault = Object.values(DEFAULT_TITLES).includes(title);
      if (title && !isDefault) {
        composerState.titleCustom = true;
        composerState.titleByLang[lang] = title;
      }
    }
    const profiles = q("#managementReportProfiles");
    if (profiles) composerState.profileCount = num(profiles.value, composerState.profileCount || 60);
    const checked = qa("[data-management-section]:checked").map(box => box.value);
    if (qa("[data-management-section]").length) composerState.sections = checked.length ? checked : DEFAULT_SECTIONS.slice();
    composerState.reportWasOpen = document.body.classList.contains("report-preview-open");
  }

  function composerTitle(lang = reportLang()) {
    if (composerState.titleCustom) {
      return composerState.titleByLang[lang] || Object.values(composerState.titleByLang).find(Boolean) || defaultTitle(lang);
    }
    return defaultTitle(lang);
  }

  function reportConfigFromUi() {
    const lang = reportLang();
    const titleRaw=(q("#managementReportTitle")?.value||composerTitle(lang)).trim();
    const isDefault = Object.values(DEFAULT_TITLES).includes(titleRaw);
    const title=(isDefault&&!composerState.titleCustom?defaultTitle(lang):titleRaw)||defaultTitle(lang);
    const profileCount=num(q("#managementReportProfiles")?.value,60);
    const sections=qa("[data-management-section]:checked").map(box=>box.value);
    const payloadDate=String(activeContext?.payload?.metadata?.generated_at||new Date().toISOString()).slice(0,10).replaceAll("-","");
    return {
      title,
      profileCount,
      sections:sections.length?sections:DEFAULT_SECTIONS.slice(),
      documentId:`MGIMO-EDU-MIG-${payloadDate}-R2`,
      generatedDate:dateRu(new Date().toISOString()),
      lang,
      locale: reportLocale(lang),
    };
  }

  async function sha256(text) {
    try {
      const bytes=new TextEncoder().encode(text);
      const digest=await crypto.subtle.digest("SHA-256",bytes);
      return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,"0")).join("");
    } catch (_) {
      let hash=2166136261;
      for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619);}
      return `fnv1a-${(hash>>>0).toString(16).padStart(8,"0")}`;
    }
  }

  function ensureReportDocument() {
    let doc=q(".management-report-document");
    if(!doc){doc=document.createElement("section");doc.className="management-report-document";document.body.appendChild(doc);}
    const lang = reportLang();
    doc.dataset.lang = lang;
    doc.lang = lang;
    doc.setAttribute("aria-label", lang === "en" ? "Generated analytical report" : "Сформированный аналитический доклад");
    return doc;
  }

  function bindReportDocument(doc) {
    q("#closeManagementReport",doc)?.addEventListener("click",()=>{document.body.classList.remove("report-preview-open");});
    q("#printManagementReportDocument",doc)?.addEventListener("click",()=>{
      window.ReportCartography?.enhance?.(document, { lang: currentReport?.config?.lang || reportLang() });
      window.print();
    });
    q("#downloadManagementManifest",doc)?.addEventListener("click",downloadManifest);
  }

  function renderReportDocument(report) {
    const doc=ensureReportDocument();
    doc.dataset.lang=report.config.lang;
    doc.lang=report.config.lang;
    const en = report.config.lang === "en";
    const pageWord = en ? "A4 pages" : "страниц A4";
    const pending = en ? "SHA-256 is being calculated..." : "SHA-256 вычисляется…";
    doc.innerHTML=`<div class="report-preview-toolbar"><div class="toolbar-copy"><strong>${esc(report.config.title)}</strong><small id="managementReportToolbarMeta">${fmt0(report.pages.length)} ${pageWord} · ${pending}</small></div><div class="toolbar-actions"><button class="text-button" id="downloadManagementManifest" type="button">${en?"Manifest JSON":"Манифест JSON"}</button><button class="primary-action" id="printManagementReportDocument" type="button">${en?"Print / PDF":"Печать / PDF"}</button><button class="text-button" id="closeManagementReport" type="button">${en?"Close":"Закрыть"}</button></div></div><div class="report-book">${report.pages.map((item,index)=>renderSheet(item,index+1,report.pages.length,report.config)).join("")}</div>`;
    bindReportDocument(doc);
  }

  function updateComposerStatus(state,message,report=null) {
    const lang = reportLang();
    const headings = lang === "en"
      ? { ready: "Report generated", building: "Generating report", idle: "Generator status" }
      : { ready: "Доклад сформирован", building: "Формирование доклада", idle: "Статус генератора" };
    const card=q("#managementReportStatus");
    if(card){card.dataset.state=state;card.innerHTML=`<strong>${esc(headings[state] || headings.idle)}</strong><p>${esc(message)}</p>`;}
    if(report){
      const counts=report.sectionCounts;
      const values={Pages:report.pages.length,Profiles:report.profileCount,Sources:activeContext?.payload?.sourceRegistry?.sources?.length||0,Checks:report.checks.filter(c=>c.pass).length};
      Object.entries(values).forEach(([key,value])=>{const el=q(`[data-report-metric="${key}"]`);if(el)el.textContent=fmt0(value);});
      const outline=q("#managementReportOutlineBody");
      if(outline)outline.innerHTML=DEFAULT_SECTIONS.filter((key)=>counts[key]).map((key)=>`<tr><td>${esc(sectionLabelFor(key, lang))}</td><td class="is-num">${fmt0(counts[key])}</td></tr>`).join("");
      q("#openManagementReport")?.removeAttribute("disabled");
      q("#downloadManagementReportManifest")?.removeAttribute("disabled");
    }
  }

  async function buildReport(context,config=reportConfigFromUi()) {
    activeContext=context||activeContext;
    if(!activeContext)throw new Error("Контекст данных не загружен");
    config.lang = normalizedLang(config.lang || activeContext.lang);
    config.locale = reportLocale(config.lang);
    activeContext.lang = config.lang;
    const en = config.lang === "en";
    updateComposerStatus("building", en ? "Assembling pages, tables, SVG charts, contents and manifest." : "Собираются страницы, таблицы, SVG-графики, содержание и манифест.");
    const front=en ? buildEnglishFrontPages(activeContext.data,config) : buildFrontPages(activeContext.data,config);
    const content=[];
    const builders = en ? BUILDERS_EN : BUILDERS;
    for(const key of DEFAULT_SECTIONS){
      if(config.sections.includes(key)&&builders[key]) content.push(...builders[key](activeContext.data,config));
    }
    const toc=buildTocPages(content,front.length);
    const pages=[...front,...toc,...content];
    const sectionCounts=pages.reduce((acc,item)=>{acc[item.section]=(acc[item.section]||0)+1;return acc;},{});
    const checks=en ? englishQualityChecks(activeContext.data) : qualityChecks(activeContext.data);
    const stableManifest={generator:`executive-report.js@${VERSION}`,documentId:config.documentId,lang:config.lang,locale:config.locale,title:config.title,generatedDate:config.generatedDate,payloadGeneratedAt:activeContext.payload.metadata?.generated_at,modelUpgrade:activeContext.payload.metadata?.model_upgrade,profileCount:config.profileCount,sections:config.sections,pageCount:pages.length,sectionCounts,pageTitles:pages.map(p=>[p.section,p.shortTitle]),sourceChecksums:(activeContext.payload.sourceRegistry?.sources||[]).map(s=>[s.source_id,s.sha256])};
    const report={config,pages,sectionCounts,checks,profileCount:config.profileCount,manifest:{...stableManifest,generatedAt:new Date().toISOString(),sha256:"pending"}};
    currentReport=report;
    renderReportDocument(report);
    updateComposerStatus("ready", en ? `${pages.length} A4 pages generated. The document is ready for preview and printing.` : `${pages.length} страниц A4 сформировано. Документ готов к предварительному просмотру и печати.`,report);
    report.manifest.sha256=await sha256(JSON.stringify(stableManifest));
    const meta=q("#managementReportToolbarMeta");
    if(meta)meta.textContent=en ? `${fmt0(pages.length)} A4 pages · SHA-256 ${report.manifest.sha256.slice(0,16)}...` : `${fmt0(pages.length)} страниц A4 · SHA-256 ${report.manifest.sha256.slice(0,16)}…`;
    const status=q("#managementReportStatus p");
    if(status)status.textContent=en ? `${pages.length} A4 pages; checksum ${report.manifest.sha256.slice(0,16)}...` : `${pages.length} страниц A4; контрольная сумма ${report.manifest.sha256.slice(0,16)}…`;
    window.ReportCartography?.enhance?.(document, { lang: config.lang });
    return report;
  }

  function openReport() {
    if(!currentReport)return;
    document.body.classList.add("report-preview-open");
    q(".management-report-document")?.scrollTo({top:0,behavior:"instant"});
  }

  async function buildAndOpen(print=false) {
    try {
      const report=await buildReport(activeContext,reportConfigFromUi());
      openReport();
      if(print)requestAnimationFrame(()=>{
        window.ReportCartography?.enhance?.(document, { lang: report.config.lang });
        window.print();
      });
      return report;
    } catch(error) {
      console.error(error);
      updateComposerStatus("error", reportLang()==="en" ? (error?.message || "Failed to generate the report") : (error?.message||"Не удалось сформировать доклад"));
      return null;
    }
  }

  function downloadJson(value,fileName) {
    const blob=new Blob([JSON.stringify(value,null,2)],{type:"application/json;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download=fileName;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  function downloadManifest() {
    if(!currentReport)return;
    downloadJson(currentReport.manifest,`${currentReport.config.documentId.toLowerCase()}-manifest.json`);
  }

  function composerHtml(context) {
    const lang = reportLang();
    const en = lang === "en";
    const p=context.payload;
    const selected = new Set(composerState.sections || DEFAULT_SECTIONS);
    const outline=DEFAULT_SECTIONS.map((key)=>`<label><input type="checkbox" value="${esc(key)}" data-management-section ${selected.has(key) ? "checked" : ""}> <span>${esc(sectionLabelFor(key, lang))}</span></label>`).join("");
    const profileCount = composerState.profileCount || 60;
    const option = (value, label) => `<option value="${value}" ${num(value)===num(profileCount) ? "selected" : ""}>${esc(label)}</option>`;
    const copy = en ? {
      kicker: "Autonomous executive report generator",
      title: "The report is assembled from platform outputs",
      deck: "A separate A4 report with contents, charts, rankings, formulas, country cards, source passports and reproducibility manifest.",
      generate: "Generate report",
      print: "Generate and print / PDF",
      evidenceLabel: "Architecture",
      evidenceValue: "Multi-page report without LLM or server generation",
      evidenceNote: "Static JavaScript reads canonical JSON artifacts and creates a separate printable DOM document.",
      params: "Release parameters",
      paramsNote: "Defaults generate the full report with 60 country profiles.",
      docTitle: "Document title",
      profileCount: "Number of country profiles",
      opt30: "30 - concise appendix",
      opt40: "40 - extended appendix",
      opt60: "60 - full country appendix",
      sections: "Sections",
      generateShort: "Generate",
      open: "Open report",
      download: "Download manifest",
      note: "The printable version is not a screenshot of the interface. Navigation and panels are hidden in print, and the browser receives fixed A4 sheets.",
      control: "Release control",
      controlNote: "Status, size, composition and automated checks.",
      idleTitle: "Report has not been generated yet",
      idleText: "Click Generate report or Generate and print / PDF.",
      pages: "Pages",
      profiles: "Profiles",
      sources: "Sources",
      checks: "Checks",
      composition: "Composition after generation",
      section: "Section",
      auto: "Calculated automatically.",
      diagnostics: "Scientific diagnostics",
      diagnosticsNote: "The structural model is separated from short-run forecasting.",
      downloads: "Source downloads",
      downloadsNote: "The same artifacts are used in the document.",
    } : {
      kicker: "Автономный генератор управленческого доклада",
      title: "Доклад формируется из результатов платформы",
      deck: "Отдельная A4-книга с содержанием, графиками, рейтингами, формулами, страновыми карточками, паспортами источников и манифестом воспроизводимости.",
      generate: "Сформировать доклад",
      print: "Сформировать и печатать / PDF",
      evidenceLabel: "Архитектура",
      evidenceValue: "100+ страниц без LLM и сервера",
      evidenceNote: "Статический JavaScript читает канонические JSON-артефакты и создаёт отдельный печатный DOM-документ.",
      params: "Параметры выпуска",
      paramsNote: "Значения по умолчанию формируют полный доклад с 60 страновыми профилями.",
      docTitle: "Название документа",
      profileCount: "Число страновых профилей",
      opt30: "30 — сокращенное приложение",
      opt40: "40 — расширенное приложение",
      opt60: "60 — полный доклад 100+ страниц",
      sections: "Разделы",
      generateShort: "Сформировать",
      open: "Открыть доклад",
      download: "Скачать манифест",
      note: "Печатная версия не является снимком интерфейса. При печати навигация и панели скрываются, а браузер получает последовательность фиксированных листов A4.",
      control: "Контроль выпуска",
      controlNote: "Статус, размер, состав и автоматические проверки.",
      idleTitle: "Доклад ещё не сформирован",
      idleText: "Нажмите «Сформировать доклад» или сразу «Сформировать и печатать / PDF».",
      pages: "Страниц",
      profiles: "Профилей",
      sources: "Источников",
      checks: "Проверок",
      composition: "Состав после сборки",
      section: "Раздел",
      auto: "Будет рассчитано автоматически.",
      diagnostics: "Научная диагностика",
      diagnosticsNote: "Роль структурной модели отделена от краткосрочного прогнозирования.",
      downloads: "Исходные выгрузки",
      downloadsNote: "Те же артефакты используются в документе.",
    };
    return `<section class="page-hero report-composer-hero"><div class="page-hero-copy"><p class="page-hero-kicker">${esc(copy.kicker)}</p><h2>${esc(copy.title)}</h2><p>${esc(copy.deck)}</p><div class="hero-actions"><button class="action-button primary" id="generateManagementReport" type="button">${esc(copy.generate)}</button><button class="action-button" id="printManagementReport" type="button">${esc(copy.print)}</button></div></div><aside class="hero-evidence-card report-hero-evidence"><span>${esc(copy.evidenceLabel)}</span><strong>${esc(copy.evidenceValue)}</strong><small>${esc(copy.evidenceNote)}</small></aside></section>
      <section class="report-composer-shell"><section class="panel report-config-panel"><div class="pane-header"><div><h2>${esc(copy.params)}</h2><p>${esc(copy.paramsNote)}</p></div></div><div class="report-config-grid"><label>${esc(copy.docTitle)}<input id="managementReportTitle" type="text" value="${esc(composerTitle(lang))}"></label><label>${esc(copy.profileCount)}<select id="managementReportProfiles">${option(30, copy.opt30)}${option(40, copy.opt40)}${option(60, copy.opt60)}</select></label></div><h3>${esc(copy.sections)}</h3><div class="report-section-list">${outline}</div><div class="report-generator-actions"><button class="primary-action" id="generateManagementReportSecondary" type="button">${esc(copy.generateShort)}</button><button class="text-button" id="openManagementReport" type="button" disabled>${esc(copy.open)}</button><button class="text-button" id="downloadManagementReportManifest" type="button" disabled>${esc(copy.download)}</button></div><p class="report-generator-note">${esc(copy.note)}</p></section>
      <section class="panel report-status-panel"><div class="pane-header"><div><h2>${esc(copy.control)}</h2><p>${esc(copy.controlNote)}</p></div><span class="badge verified">${esc(p.metadata?.model_upgrade||"v5")}</span></div><div class="report-build-status"><div class="report-status-card" id="managementReportStatus" data-state="idle"><strong>${esc(copy.idleTitle)}</strong><p>${esc(copy.idleText)}</p></div><div class="report-status-metrics"><div><span>${esc(copy.pages)}</span><strong data-report-metric="Pages">—</strong></div><div><span>${esc(copy.profiles)}</span><strong data-report-metric="Profiles">—</strong></div><div><span>${esc(copy.sources)}</span><strong data-report-metric="Sources">${fmt0(p.sourceRegistry?.sources?.length)}</strong></div><div><span>${esc(copy.checks)}</span><strong data-report-metric="Checks">—</strong></div></div><div class="report-table-wrap"><table class="report-table report-outline-table"><caption>${esc(copy.composition)}</caption><thead><tr><th>${esc(copy.section)}</th><th class="is-num">${esc(copy.pages)}</th></tr></thead><tbody id="managementReportOutlineBody"><tr><td colspan="2">${esc(copy.auto)}</td></tr></tbody></table></div></div></section></section>
      <section class="analysis-grid"><section class="panel span-7"><div class="pane-header"><div><h2>${esc(copy.diagnostics)}</h2><p>${esc(copy.diagnosticsNote)}</p></div></div>${context.diagnosticsHtml||""}</section><section class="panel span-5"><div class="pane-header"><div><h2>${esc(copy.downloads)}</h2><p>${esc(copy.downloadsNote)}</p></div></div>${context.downloadsHtml||""}</section></section>`;
  }

  function bindComposer() {
    q("#generateManagementReport")?.addEventListener("click",()=>buildAndOpen(false));
    q("#generateManagementReportSecondary")?.addEventListener("click",()=>buildAndOpen(false));
    q("#printManagementReport")?.addEventListener("click",()=>buildAndOpen(true));
    q("#openManagementReport")?.addEventListener("click",openReport);
    q("#downloadManagementReportManifest")?.addEventListener("click",downloadManifest);
    qa("[data-management-section],#managementReportProfiles,#managementReportTitle").forEach(control=>control.addEventListener("change",()=>{
      readComposerState();
      currentReport=null;
      q("#openManagementReport")?.setAttribute("disabled","");
      q("#downloadManagementReportManifest")?.setAttribute("disabled","");
      updateComposerStatus("idle",reportLang()==="en"?"Parameters changed; generate a new release.":"Параметры изменены; сформируйте новый выпуск.");
    }));
  }

  function mount(options) {
    const root=options?.root;
    if(!root||!options.payload)return false;
    readComposerState();
    const hadReport=Boolean(currentReport);
    const wasOpen=composerState.reportWasOpen;
    const lang=normalizedLang(options.lang);
    const data=prepareData(options.payload,options.countries||{});
    activeContext={...options,lang,data,payload:options.payload,countries:options.countries||{}};
    root.innerHTML=composerHtml(activeContext);
    ensureReportDocument();
    bindComposer();
    if(hadReport||wasOpen){
      buildReport(activeContext,reportConfigFromUi()).then(()=>{ if(wasOpen) openReport(); }).catch(console.error);
    }
    if(!window.__mgimoReportBeforePrintBound){
      window.addEventListener("beforeprint",()=>{
        if(document.body.dataset.view==="report"&&!currentReport&&activeContext) buildReport(activeContext,reportConfigFromUi()).catch(console.error);
        window.ReportCartography?.enhance?.(document, { lang: currentReport?.config?.lang || reportLang() });
      });
      window.__mgimoReportBeforePrintBound=true;
    }
    return true;
  }

  window.MGIMOExecutiveReport={mount,buildReport:()=>buildReport(activeContext,reportConfigFromUi()),open:openReport,version:VERSION};
})();
