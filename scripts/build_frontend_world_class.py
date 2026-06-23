#!/usr/bin/env python3
"""Build the MGIMO world-class frontend layer and presentation UI marts."""
from __future__ import annotations

import csv
import gzip
import hashlib
import json
import re
import shutil
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
UI_DIR = DOCS / "data" / "platform2" / "ui"
SRC = ROOT / "src" / "frontend" / "platform2"
OUT_JS = DOCS / "assets" / "platform2-world-class.js"
OUT_CSS = DOCS / "assets" / "platform2-world-class.css"
MANIFEST = ROOT / "worklogs" / "frontend-world-class" / "ui_mart_manifest.json"
BUILD_MANIFEST = ROOT / "worklogs" / "frontend-world-class" / "frontend_world_class_build.json"
VERSION = "20260622-world-class-ui1"

COUNTRY_ISO3_ALIASES = {
    "egypt": "EGY",
    "egypt, arab rep.": "EGY",
    "egypt, arab republic": "EGY",
    "kyrgyzstan": "KGZ",
    "kyrgyz republic": "KGZ",
    "kyrgyzstan republic": "KGZ",
}

ROUTES = [
    ("platform2", "5.2.1"),
    ("migration", "5.2.2"),
    ("demography", "5.2.3"),
    ("model", "5.2.4"),
    ("friendliness", "5.2.5"),
    ("vacancies", "5.2.6"),
    ("forecast", "5.2.7"),
    ("gap", "5.2.8"),
    ("matrix", "5.2.9"),
    ("report", "5.2.12"),
]

TITLE = {
    "platform2": {"ru": "Центр решений и доказательств", "en": "Decision and evidence center"},
    "migration": {"ru": "Навигатор наблюдаемого въезда", "en": "Observed inbound navigator"},
    "demography": {"ru": "Лаборатория рынков 2050", "en": "Markets 2050 lab"},
    "model": {"ru": "Карточка и диагностика PPML", "en": "PPML model card and diagnostics"},
    "friendliness": {"ru": "Профиль восприимчивости", "en": "Receptivity profile"},
    "vacancies": {"ru": "Кокпит вакансий и компетенций", "en": "Vacancy and competency cockpit"},
    "forecast": {"ru": "Сценарная лаборатория 2050", "en": "2050 scenario lab"},
    "gap": {"ru": "Рабочая зона структурного разрыва", "en": "Structural-gap workbench"},
    "matrix": {"ru": "Матрица управленческих гипотез", "en": "Management-hypothesis matrix"},
    "report": {"ru": "Конструктор ректорского доклада", "en": "Executive report composer"},
}

QUESTION = {
    "platform2": {"ru": "Как связать наблюдения, модели и решения в один управленческий контур?", "en": "How do observations, models and decisions connect in one management chain?"},
    "migration": {"ru": "Какие страны формируют наблюдаемый контингент студентов в России?", "en": "Which countries form the observed student stock in Russia?"},
    "demography": {"ru": "Где молодёжный образовательный рынок растёт к 2050 году?", "en": "Where does the youth education market grow by 2050?"},
    "model": {"ru": "Что объясняет структурная PPML-модель и где её пределы?", "en": "What does the structural PPML model explain and where are its limits?"},
    "friendliness": {"ru": "Где условия взаимодействия с Россией подтверждены, а где доказательства ограничены?", "en": "Where is receptivity to Russia supported and where is evidence limited?"},
    "vacancies": {"ru": "Какие программы МГИМО поддержаны наблюдаемым спросом работодателей?", "en": "Which MGIMO programs are supported by observed employer demand?"},
    "forecast": {"ru": "Как меняется потенциальная ёмкость при разных предпосылках ёмкости?", "en": "How does potential capacity change under different capacity assumptions?"},
    "gap": {"ru": "Где фактический контингент ниже структурной ёмкости устойчиво, а не случайно?", "en": "Where is actual student stock robustly below structural capacity?"},
    "matrix": {"ru": "Какие страна-программа-инструмент комбинации стоит проверять пилотом?", "en": "Which country-program-instrument combinations should be piloted?"},
    "report": {"ru": "Какие выводы и ограничения должны попасть в управленческий доклад?", "en": "Which findings and caveats belong in the executive report?"},
}


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def load_iso2_map() -> dict[str, str]:
    dashboard_path = DOCS / "data" / "mgimo_dashboard_data.json"
    if not dashboard_path.exists():
        return {}
    payload = read_json(dashboard_path)
    return {
        str(country.get("iso3", "")).upper(): str(country.get("iso2", "")).upper()
        for country in payload.get("countries", [])
        if country.get("iso3") and country.get("iso2")
    }


def load_country_name_map() -> dict[str, str]:
    dashboard_path = DOCS / "data" / "mgimo_dashboard_data.json"
    if not dashboard_path.exists():
        return {}
    payload = read_json(dashboard_path)
    name_to_iso3: dict[str, str] = {}
    for country in payload.get("countries", []):
        iso3 = str(country.get("iso3", "")).upper()
        if not iso3:
            continue
        for value in (
            country.get("name"),
            country.get("nameEn"),
            country.get("country_en"),
            country.get("nameRu"),
            country.get("country_ru"),
            COUNTRY_RU.get(str(country.get("name", ""))),
        ):
            if value:
                name_to_iso3[str(value).strip().casefold()] = iso3
    name_to_iso3.update(COUNTRY_ISO3_ALIASES)
    return name_to_iso3


def country_row(row: dict[str, Any], iso3: Any, iso2_by_iso3: dict[str, str]) -> dict[str, Any]:
    iso3_value = str(iso3 or "").upper()
    if not iso3_value:
        return row
    row["iso3"] = iso3_value
    row["iso2"] = iso2_by_iso3.get(iso3_value, "")
    row["country_bearing"] = True
    return row


def _label_candidates(label: Any) -> list[str]:
    if isinstance(label, dict):
        values = [str(value) for value in label.values() if value]
    elif label:
        values = [str(label)]
    else:
        values = []
    candidates: list[str] = []
    for value in values:
        candidates.append(value)
        for separator in ("·", "В·", "|", "/"):
            if separator in value:
                candidates.append(value.split(separator, 1)[0].strip())
    return candidates


def infer_country_iso3(row: dict[str, Any], iso2_by_iso3: dict[str, str], name_to_iso3: dict[str, str]) -> str:
    direct = row.get("iso3") or row.get("origin_iso3")
    if direct:
        iso3 = str(direct).upper()
        if iso3 in iso2_by_iso3:
            return iso3
    for field in (row.get("id"), row.get("source", {}).get("trace_id"), row.get("source", {}).get("source_key")):
        for token in re.findall(r"\b[A-Z]{3}\b", str(field or "")):
            if token in iso2_by_iso3:
                return token
    for candidate in _label_candidates(row.get("label")):
        iso3 = name_to_iso3.get(candidate.strip().casefold())
        if iso3:
            return iso3
    return ""


def enrich_focus_rows(mart: dict[str, Any], iso2_by_iso3: dict[str, str], name_to_iso3: dict[str, str]) -> None:
    if mart.get("route") in {"model", "vacancies"}:
        return
    for row in mart.get("focus_rows", []):
        iso3 = infer_country_iso3(row, iso2_by_iso3, name_to_iso3)
        if iso3:
            country_row(row, iso3, iso2_by_iso3)


def read_csv(path: Path, limit: int | None = None) -> list[dict[str, str]]:
    opener = gzip.open if path.suffix == ".gz" else open
    rows: list[dict[str, str]] = []
    with opener(path, "rt", encoding="utf-8", newline="") as handle:
        for index, row in enumerate(csv.DictReader(handle)):
            if limit is not None and index >= limit:
                break
            rows.append(dict(row))
    return rows


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def number(value: Any) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


COUNTRY_RU = {
    "United Arab Emirates": "Объединённые Арабские Эмираты",
    "Belarus": "Беларусь",
    "Serbia": "Сербия",
    "Saudi Arabia": "Саудовская Аравия",
    "Oman": "Оман",
    "Djibouti": "Джибути",
    "Kuwait": "Кувейт",
    "Philippines": "Филиппины",
    "Bosnia and Herzegovina": "Босния и Герцеговина",
    "Türkiye": "Турция",
    "Turkiye": "Турция",
    "Turkey": "Турция",
    "Ukraine": "Украина",
    "Poland": "Польша",
    "Germany": "Германия",
    "Pakistan": "Пакистан",
    "Azerbaijan": "Азербайджан",
    "Turkmenistan": "Туркменистан",
    "Kazakhstan": "Казахстан",
    "Uzbekistan": "Узбекистан",
    "Kyrgyzstan": "Киргизия",
    "Kyrgyz Republic": "Киргизская Республика",
    "Tajikistan": "Таджикистан",
    "China": "Китай",
    "India": "Индия",
    "Iran": "Иран",
    "Iran, Islamic Republic of": "Иран",
    "Iran, Islamic Rep.": "Иран",
    "Egypt": "Египет",
    "Nigeria": "Нигерия",
    "United States of America": "США",
    "Democratic Republic of the Congo": "Демократическая Республика Конго",
    "Indonesia": "Индонезия",
    "Ethiopia": "Эфиопия",
    "Bangladesh": "Бангладеш",
    "United Republic of Tanzania": "Танзания",
    "Brazil": "Бразилия",
    "Viet Nam": "Вьетнам",
    "Korea, Dem. People's Rep.": "КНДР",
    "Syrian Arab Republic": "Сирия",
    "Nicaragua": "Никарагуа",
    "Russian Federation": "Российская Федерация",
    "Venezuela, RB": "Венесуэла",
    "Mali": "Мали",
    "Nepal": "Непал",
    "Niger": "Нигер",
}


def country_ru(name: Any) -> str:
    value = str(name or "").strip()
    return COUNTRY_RU.get(value, value)


def lang(ru: str, en: str) -> dict[str, str]:
    return {"ru": ru, "en": en}


def unit(ru: str, en: str) -> dict[str, str]:
    return lang(ru, en)


def fmt_num(value: Any, digits: int = 0) -> str:
    numeric = number(value)
    if digits <= 0:
        return f"{numeric:,.0f}".replace(",", " ")
    return f"{numeric:,.{digits}f}".replace(",", " ")


def fmt_score(value: Any) -> str:
    return f"{number(value):.1f}"


RELIABILITY_RU = {
    "high": "высокая надёжность",
    "moderate": "умеренная надёжность",
    "limited": "ограниченная доказательность",
    "low": "низкая доказательность",
}


DECISION_TIER_RU = {
    "A_ready_for_scale": "готово к масштабированию",
    "B_targeted_validation": "пилот с целевой проверкой",
    "C_monitor_and_test": "наблюдать и тестировать",
    "D_insufficient_or_unstable_evidence": "доказательства нестабильны",
}


INSTRUMENT_RU = {
    "employer_linked_program_campaign_and_case_competitions": "кампания с работодателями и кейс-чемпионатами",
    "russian_language_track_alumni_and_school_network": "русскоязычный трек, выпускники и школьные сети",
    "targeted_digital_campaign_with_local_partner_validation": "целевая цифровая кампания с проверкой через местного партнёра",
    "country_partnership_and_scholarship_pipeline": "партнёрства и стипендиальная воронка",
    "digital_campaign_and_online_foundation_module": "цифровая кампания и онлайн-подготовка",
    "regional_language_and_culture_bridge": "языковой и культурный мост региона",
}


PROGRAM_EN = {
    "digital_analytics": "Digital analytics and Data/AI",
    "international_economics": "International economics and foreign trade",
    "languages_regional": "Languages and regional studies",
    "legal_public": "Law and public governance",
    "management_public": "Management and public policy",
}

TERM_RU = {
    "const": "Базовый уровень модели",
    "ln_student_pool": "Размер молодёжного рынка",
    "ln_distance": "Географическая дистанция",
    "ln_outbound": "Международная мобильность из страны",
    "ln_outbound_missing": "Отсутствует показатель исходящей мобильности",
    "tertiary_share": "Доля высшего образования",
    "tertiary_share_missing": "Отсутствует показатель высшего образования",
    "unga_alignment": "Близость голосований в ООН",
    "unga_alignment_missing": "Отсутствует показатель близости голосований в ООН",
    "has_direct_flight": "Прямое авиасообщение",
    "common_language": "Языковая близость",
    "visa_free": "Визовая доступность",
    "diaspora_stock": "Диаспора и устойчивые связи",
}

TERM_EN = {
    "const": "Model baseline",
    "ln_student_pool": "Youth market size",
    "ln_distance": "Geographic distance",
    "ln_outbound": "Outbound international mobility",
    "ln_outbound_missing": "Outbound mobility missing",
    "tertiary_share": "Tertiary education share",
    "tertiary_share_missing": "Tertiary education share missing",
    "unga_alignment": "UN voting alignment",
    "unga_alignment_missing": "UN voting alignment missing",
    "has_direct_flight": "Direct air connection",
    "common_language": "Language proximity",
    "visa_free": "Visa access",
    "diaspora_stock": "Diaspora and persistent ties",
}


def reliability_ru(value: Any) -> str:
    raw = str(value or "").strip()
    return RELIABILITY_RU.get(raw, raw or "доказательность не указана")


def decision_tier_ru(value: Any) -> str:
    raw = str(value or "").strip()
    return DECISION_TIER_RU.get(raw, raw or "статус пилота не указан")


def instrument_ru(value: Any) -> str:
    raw = str(value or "").strip()
    return INSTRUMENT_RU.get(raw, raw.replace("_", " ") or "инструмент не указан")


def program_en(value: Any) -> str:
    raw = str(value or "").strip()
    return PROGRAM_EN.get(raw, raw.replace("_", " ") or "program")


def term_ru(value: Any) -> str:
    raw = str(value or "").strip()
    return TERM_RU.get(raw, raw.replace("_", " ") or "параметр модели")


def term_en(value: Any) -> str:
    raw = str(value or "").strip()
    return TERM_EN.get(raw, raw.replace("_", " ") or "model term")


def source_from(row: dict[str, Any], fallback_key: str = "") -> dict[str, Any]:
    return {
        "source_key": row.get("source_key") or row.get("actual_source_key") or fallback_key,
        "source_title": row.get("source_title") or "",
        "source_url_or_file": row.get("source_url_or_file") or row.get("actual_source_url_or_file") or "",
        "retrieved_at": row.get("retrieved_at") or row.get("actual_retrieved_at") or "",
        "source_period": row.get("source_period") or row.get("actual_period") or "",
        "unit": row.get("unit") or row.get("actual_unit") or "",
        "evidence_class": row.get("observation_status") or row.get("actual_observation_status") or row.get("score_semantics") or "",
        "sha256_or_etag": row.get("sha256_or_etag") or row.get("actual_sha256_or_etag") or "",
        "transform_script": row.get("transform_script") or "",
        "trace_id": row.get("trace_id") or row.get("actual_trace_id") or row.get("release_record_id") or "",
    }


def artifact_source(
    path: Path,
    source_key: str,
    source_title: str,
    source_period: Any = "",
    unit: str = "",
    evidence_class: str = "",
    transform_script: str = "",
    trace_id: str = "",
) -> dict[str, Any]:
    return {
        "source_key": source_key,
        "source_title": source_title,
        "source_url_or_file": str(path.relative_to(ROOT)).replace("\\", "/"),
        "retrieved_at": "2026-06-22T00:00:00Z",
        "source_period": source_period,
        "unit": unit,
        "evidence_class": evidence_class,
        "sha256_or_etag": sha256(path) if path.exists() else "",
        "transform_script": transform_script,
        "trace_id": trace_id,
    }


def matrix_source(row: dict[str, Any], matrix_path: Path) -> dict[str, Any]:
    trace = row.get("source_key") or row.get("model_id") or f"{row.get('iso3', '')}:{row.get('program_group', '')}"
    return artifact_source(
        matrix_path,
        "country_program_priority_v5",
        "Country-program priority matrix v5: ex ante country-program-instrument management hypotheses",
        row.get("actual_period") or "2026 release; observed inputs through latest canonical artifacts",
        "management priority index",
        "model_estimate",
        "scripts/build_model_upgrades_v3.py",
        trace,
    )


def metric(label_ru: str, label_en: str, value: Any, unit: str, evidence_class: str, source: dict[str, Any]) -> dict[str, Any]:
    return {
        "label": {"ru": label_ru, "en": label_en},
        "value": value,
        "unit": unit,
        "evidence_class": evidence_class,
        "source": source,
    }


def route_base(route: str, task: str, inputs: list[Path]) -> dict[str, Any]:
    return {
        "schema_version": "world-class-ui-mart-v1",
        "asset_version": VERSION,
        "route": route,
        "task": task,
        "generated_at_utc": "2026-06-22T00:00:00Z",
        "title": TITLE[route],
        "management_question": QUESTION[route],
        "input_artifacts": [
            {
                "path": str(path.relative_to(ROOT)).replace("\\", "/"),
                "bytes": path.stat().st_size,
                "sha256": sha256(path),
            }
            for path in inputs
            if path.exists()
        ],
        "headline_metrics": [],
        "focus_rows": [],
        "source_items": [],
        "handoffs": [],
        "interaction_chips": [],
        "row_counts": {},
        "field_definitions": {
            "headline_metrics": {
                "label": "Bilingual metric label.",
                "value": "Displayed presentation value derived from listed input artifacts.",
                "unit": "Human-readable unit; never converts missingness to zero.",
                "evidence_class": "One of the project evidence classes.",
                "source": "Source/model provenance object exposed through the drawer.",
            },
            "focus_rows": {
                "id": "Stable presentation row identifier.",
                "label": "Bilingual or source-native row label.",
                "value": "Displayed value for linked selection and export.",
                "unit": "Value unit.",
                "evidence_class": "Evidence class for the row value.",
                "detail": "Bilingual row explanation and semantic guardrail.",
                "source": "Source/model provenance object exposed through the drawer.",
            },
            "source_items": "Deduplicated source/model provenance items collected from visible metrics and rows.",
            "handoffs": "Cross-page analytical links that may carry selected context.",
        },
        "acceptance_notes": [],
    }


def add_handoffs(mart: dict[str, Any], *routes: tuple[str, str, str]) -> None:
    mart["handoffs"] = [
        {"href": href, "label": {"ru": ru, "en": en}}
        for href, ru, en in routes
    ]


def build_marts() -> list[dict[str, Any]]:
    payload_path = DOCS / "data" / "mgimo_platform2_payload.json"
    inbound_path = DOCS / "data" / "platform2" / "russia_inbound_students_by_origin_2010_2025.csv"
    forecast_path = DOCS / "data" / "platform2" / "potential_forecast_2026_2050.csv"
    gap_path = DOCS / "data" / "platform2" / "unrealized_potential_gap.csv"
    friendliness_path = DOCS / "data" / "platform2" / "friendliness_index.csv"
    matrix_path = DOCS / "data" / "platform2" / "country_program_priority_v5.csv"
    trudvsem_path = DOCS / "data" / "platform2" / "trudvsem_labor_market_v5.json"
    model_path = DOCS / "data" / "platform2" / "gravity_model_report.json"
    source_manifest_path = DOCS / "data" / "platform2" / "source_manifest_platform2.json"

    payload = read_json(payload_path)
    inbound = read_csv(inbound_path)
    forecast = read_csv(forecast_path)
    gap = read_csv(gap_path)
    friendliness = read_csv(friendliness_path)
    matrix = read_csv(matrix_path)
    trudvsem = read_json(trudvsem_path)
    model = read_json(model_path)
    iso2_by_iso3 = load_iso2_map()
    country_name_to_iso3 = load_country_name_map()

    latest_year = int(payload.get("russiaInbound", {}).get("latestYear") or 2023)
    inbound_latest = sorted(
        [row for row in inbound if int(number(row.get("year"))) == latest_year and number(row.get("students_observed")) > 0],
        key=lambda row: number(row.get("students_observed")),
        reverse=True,
    )
    forecast_2050 = [row for row in forecast if int(number(row.get("year"))) == 2050]
    gap_top = sorted(gap, key=lambda row: number(row.get("rank_robust_unrealized_potential") or row.get("rank_unrealized_potential") or 999999))
    friendliness_top = sorted(friendliness, key=lambda row: number(row.get("friendliness_ex_ante_score")), reverse=True)
    matrix_top = sorted(matrix, key=lambda row: number(row.get("rank_country_program_priority") or 999999))
    programs = sorted(trudvsem.get("programDemand", []), key=lambda row: number(row.get("program_labor_demand_score")), reverse=True)
    metadata = trudvsem.get("metadata", {})
    youth = payload.get("youthMarketForecast", {}).get("top2050StudentPool", [])[:12]

    source_manifest_source = artifact_source(
        source_manifest_path,
        "source_manifest_platform2",
        "Platform 2 source manifest and failed-attempt registry",
        "2026 release",
        unit("паспорт источника", "source passport"),
        "calculated",
        "scripts/build_platform2_artifacts.py",
        "sourceRegistry",
    )
    uis_source = source_from(inbound_latest[0] if inbound_latest else {}, "unesco_uis_opri_202602")
    wpp_source = source_from(youth[0] if youth else {}, "un_wpp2024_population_by_single_age_sex")
    model_source = artifact_source(
        model_path,
        model.get("model_id") or "ppml_russia_inbound_structural_allocation_v3",
        "Structural PPML allocation model with diagnostics and uncertainty",
        "2010-2025 observed panel; 2026-2050 scenarios",
        unit("модельная оценка", "model estimate"),
        "model_estimate",
        "scripts/build_model_upgrades_v3.py",
        model.get("model_id") or "ppml_russia_inbound_structural_allocation_v3",
    )
    trudvsem_source = artifact_source(
        trudvsem_path,
        metadata.get("source_key") or "trudvsem_open_data_api",
        "Trudvsem public vacancy API, sanitized program-demand release mart",
        metadata.get("retrieved_at") or "2026 release",
        unit("обезличенные записи", "sanitized records"),
        "observed_official",
        "scripts/build_trudvsem_model_v2.py",
        metadata.get("model_version") or "trudvsem_program_demand_v5",
    )

    marts: list[dict[str, Any]] = []

    overview = route_base("platform2", "5.2.1", [payload_path, gap_path, matrix_path, forecast_path, trudvsem_path])
    overview["headline_metrics"] = [
        metric("Строк наблюдений UIS", "UIS observation rows", payload.get("odCoverage", {}).get("russia_rows"), unit("строк страна-год", "country-year rows"), "observed_official", uis_source),
        metric("Паспортов источников", "Source passports", len(payload.get("sourceRegistry", {}).get("sources", [])), unit("источников", "sources"), "calculated", source_manifest_source),
        metric("Комбинаций в матрице", "Matrix combinations", len(matrix), unit("строк страна-программа", "country-program rows"), "model_estimate", matrix_source(matrix_top[0] if matrix_top else {}, matrix_path)),
    ]
    overview["focus_rows"] = [
        {"id": "evidence-chain", "label": {"ru": "Данные → модели → решения", "en": "Data → models → decisions"}, "value": len(payload.get("sourceRegistry", {}).get("sources", [])), "unit": unit("источников", "sources"), "evidence_class": "calculated", "detail": {"ru": "Единый контур связывает UIS, UN WPP, PPML, Trudvsem и стратегическую матрицу.", "en": "One chain links UIS, UN WPP, PPML, Trudvsem and the strategic matrix."}, "source": source_manifest_source},
        {"id": "gap-leader", "label": {"ru": country_ru(gap_top[0].get("origin_country", "")), "en": gap_top[0].get("origin_country", "")}, "value": gap_top[0].get("gap_abs"), "unit": unit("студентов-эквивалент", "student-equivalent gap"), "evidence_class": "model_estimate", "detail": {"ru": "Лидер устойчивой структурной недопредставленности.", "en": "Leader of robust structural under-representation."}, "source": source_from(gap_top[0])},
        {"id": "matrix-leader", "label": {"ru": country_ru(matrix_top[0].get("country", "")), "en": matrix_top[0].get("country", "")}, "value": matrix_top[0].get("combined_country_program_priority_score"), "unit": unit("индекс приоритета", "management index"), "evidence_class": "model_estimate", "detail": {"ru": matrix_top[0].get("program_label_ru", ""), "en": program_en(matrix_top[0].get("program_group", ""))}, "source": matrix_source(matrix_top[0], matrix_path)},
    ]
    add_handoffs(overview, ("migration.html", "Проверить фактический контингент", "Check observed stock"), ("matrix.html", "Перейти к решениям", "Open decision matrix"))
    overview["interaction_chips"] = [{"ru": "страна", "en": "country"}, {"ru": "источник", "en": "source"}, {"ru": "следующий шаг", "en": "next step"}]
    marts.append(overview)

    migration = route_base("migration", "5.2.2", [inbound_path, payload_path])
    migration["headline_metrics"] = [
        metric("Последний содержательный год", "Latest meaningful year", latest_year, unit("год", "year"), "observed_official", uis_source),
        metric("Стран с наблюдениями", "Countries with observations", len(inbound_latest), unit("стран происхождения", "origins"), "observed_official", uis_source),
    ]
    migration["focus_rows"] = [
        {"id": row.get("trace_id"), "label": {"ru": country_ru(row.get("origin_name", "")), "en": row.get("origin_name", "")}, "value": row.get("students_observed"), "unit": unit("наблюдаемый контингент", "enrolled student stock"), "evidence_class": "observed_official", "detail": {"ru": f"Контингент UIS в России, {row.get('year')}; это запас, не годовой поток.", "en": f"UIS stock in Russia, {row.get('year')}; this is a stock, not annual flow."}, "source": source_from(row)}
        for row in inbound_latest[:12]
    ]
    add_handoffs(migration, ("demography.html", "Сравнить с рынком 2050", "Compare with 2050 market"), ("gap.html", "Проверить разрыв", "Check structural gap"))
    migration["interaction_chips"] = [{"ru": "год", "en": "year"}, {"ru": "страна происхождения", "en": "origin"}, {"ru": "строка UIS", "en": "UIS row"}]
    migration["acceptance_notes"].append("Observed UIS stock only; not annual enrolment flow.")
    marts.append(migration)

    demography = route_base("demography", "5.2.3", [payload_path, forecast_path])
    youth = payload.get("youthMarketForecast", {}).get("top2050StudentPool", [])[:12]
    demography["headline_metrics"] = [
        metric("Стран в прогнозном срезе", "Countries in projection slice", len(forecast_2050), unit("стран", "country rows"), "official_projection", wpp_source),
        metric("Вариант ООН", "UN variant", "Medium", unit("вариант", "variant"), "official_projection", wpp_source),
    ]
    demography["focus_rows"] = [
        {"id": row.get("iso3") or row.get("origin_iso3"), "label": {"ru": country_ru(row.get("country") or row.get("origin_country", "")), "en": row.get("country") or row.get("origin_country", "")}, "value": row.get("value") or row.get("student_pool_2050") or row.get("student_pool"), "unit": unit("молодёжный образовательный пул", "age 15-24 pool"), "evidence_class": "official_projection", "detail": {"ru": f"UN WPP Medium, {row.get('year')}; после границы оценка/проекция это официальная проекция, не наблюдение будущего.", "en": f"UN WPP Medium, {row.get('year')}; after the estimate/projection boundary this is an official projection, not observed future."}, "source": source_from(row, "un_wpp2024_population_by_single_age_sex")}
        for row in youth
    ]
    add_handoffs(demography, ("forecast.html", "Проверить сценарии ёмкости", "Check capacity scenarios"), ("matrix.html", "Соединить с программами", "Link to programs"))
    demography["interaction_chips"] = [{"ru": "оценка", "en": "estimate"}, {"ru": "проекция", "en": "projection"}, {"ru": "квадрант", "en": "quadrant"}]
    marts.append(demography)

    model_mart = route_base("model", "5.2.4", [model_path])
    coefficients = [row for row in model.get("coefficients", []) if not str(row.get("term", "")).startswith(("year_", "region_"))][:12]
    model_mart["headline_metrics"] = [
        metric("Наблюдений модели", "Model observations", model.get("n_observations"), unit("строк", "rows"), "model_estimate", model_source),
        metric("Симуляций неопределённости", "Uncertainty draws", model.get("forecast_uncertainty", {}).get("parameter_draws"), unit("розыгрышей", "draws"), "model_estimate", model_source),
    ]
    model_mart["focus_rows"] = [
        {"id": row.get("term"), "label": {"ru": term_ru(row.get("term")), "en": term_en(row.get("term"))}, "value": row.get("estimate"), "unit": unit("коэффициент", "coefficient"), "evidence_class": "model_estimate", "detail": {"ru": f"95% интервал: {fmt_score(row.get('conf_low'))}–{fmt_score(row.get('conf_high'))}; не причинный эффект.", "en": f"95% interval: {fmt_score(row.get('conf_low'))}–{fmt_score(row.get('conf_high'))}; not a causal effect."}, "source": model_source | {"trace_id": row.get("term") or model.get("model_id", "")}}
        for row in coefficients
    ]
    add_handoffs(model_mart, ("gap.html", "Проверить недопредставленность", "Check under-representation"), ("forecast.html", "Перейти к сценариям", "Open scenarios"))
    model_mart["interaction_chips"] = [{"ru": "коэффициент", "en": "coefficient"}, {"ru": "отложенная проверка", "en": "holdout"}, {"ru": "сравнительный ориентир", "en": "benchmark"}]
    model_mart["acceptance_notes"].append("PPML is explanatory; continuity benchmark is not the structural potential.")
    marts.append(model_mart)

    friend = route_base("friendliness", "5.2.5", [friendliness_path])
    friend["headline_metrics"] = [
        metric("Стран в индексе", "Countries in index", len(friendliness), unit("стран", "countries"), "model_estimate", source_from(friendliness_top[0] if friendliness_top else {}, "friendliness_receptivity_index_v3")),
        metric("Высокая/умеренная надёжность", "High/moderate reliability", sum(1 for row in friendliness if row.get("evidence_reliability_class") in {"high", "moderate"}), unit("стран", "countries"), "calculated", source_from(friendliness_top[0] if friendliness_top else {}, "friendliness_receptivity_index_v3")),
    ]
    friend["focus_rows"] = [
        {"id": row.get("iso3"), "label": {"ru": country_ru(row.get("country", "")), "en": row.get("country", "")}, "value": row.get("friendliness_ex_ante_score"), "unit": unit("ограниченный балл", "bounded score"), "evidence_class": "model_estimate", "detail": {"ru": f"Диапазон {fmt_score(row.get('conservative_lower_bound'))}–{fmt_score(row.get('optimistic_upper_bound'))}; {reliability_ru(row.get('evidence_reliability_class'))}.", "en": f"Range {fmt_score(row.get('conservative_lower_bound'))}–{fmt_score(row.get('optimistic_upper_bound'))}; {row.get('evidence_reliability_class')} reliability."}, "source": source_from(row)}
        for row in friendliness_top[:12]
    ]
    add_handoffs(friend, ("gap.html", "Сопоставить с разрывом", "Compare with gap"), ("matrix.html", "Добавить в матрицу", "Add to matrix"))
    friend["interaction_chips"] = [{"ru": "границы", "en": "bounds"}, {"ru": "покрытие", "en": "coverage"}, {"ru": "недостающие компоненты", "en": "missing components"}]
    friend["acceptance_notes"].append("Point rank is hidden when rank interval is uninformative.")
    marts.append(friend)

    vac = route_base("vacancies", "5.2.6", [trudvsem_path, matrix_path])
    metadata = trudvsem.get("metadata", {})
    vac["headline_metrics"] = [
        metric("Уникальных обезличенных записей", "Unique sanitized records", metadata.get("input_unique_vacancies"), unit("записей", "records"), "observed_official", trudvsem_source),
        metric("Классифицированных записей", "Classified records", metadata.get("classified_unique_vacancies"), unit("записей", "records"), "calculated", trudvsem_source),
        metric("Строк доказательств", "Evidence rows", metadata.get("classification_evidence_rows"), unit("строк", "rows"), "calculated", trudvsem_source),
    ]
    vac["focus_rows"] = [
        {"id": row.get("keyword_group"), "label": {"ru": row.get("program_label_ru", ""), "en": program_en(row.get("keyword_group", ""))}, "value": row.get("program_labor_demand_score"), "unit": unit("сигнал спроса", "labor-demand score"), "evidence_class": "model_estimate", "detail": {"ru": f"{fmt_num(row.get('classified_unique_vacancies'))} классифицированных записей; медианная зарплата {fmt_num(row.get('salary_midpoint_median_rub'))} ₽.", "en": f"{fmt_num(row.get('classified_unique_vacancies'))} classified records; median salary {fmt_num(row.get('salary_midpoint_median_rub'))} RUB."}, "source": trudvsem_source | {"trace_id": row.get("keyword_group") or metadata.get("model_version", "")}}
        for row in programs
    ]
    add_handoffs(vac, ("matrix.html", "Связать с программной матрицей", "Link to program matrix"), ("report.html", "Вынести в доклад", "Add to report"))
    vac["interaction_chips"] = [{"ru": "программа", "en": "program"}, {"ru": "запись", "en": "record"}, {"ru": "обезличено", "en": "privacy-safe"}]
    vac["acceptance_notes"].append("Public UI marts use release_record_id only; source-native record and employer-name fields are blocked.")
    marts.append(vac)

    forecast_mart = route_base("forecast", "5.2.7", [forecast_path])
    by_country_2050 = sorted(forecast_2050, key=lambda row: number(row.get("potential_students_demographic") or row.get("potential_students")), reverse=True)
    forecast_mart["headline_metrics"] = [
        metric("Стран в сценарии 2050", "Countries in 2050 scenario", len(by_country_2050), unit("стран", "countries"), "model_estimate", source_from(by_country_2050[0] if by_country_2050 else {}, "ppml_capacity_scenarios")),
        metric("Симуляций параметров", "Parameter draws", by_country_2050[0].get("parameter_draw_count") if by_country_2050 else "", unit("розыгрышей", "draws"), "model_estimate", source_from(by_country_2050[0] if by_country_2050 else {}, "ppml_capacity_scenarios")),
    ]
    forecast_mart["focus_rows"] = [
        {"id": row.get("origin_iso3"), "label": {"ru": country_ru(row.get("origin_country", "")), "en": row.get("origin_country", "")}, "value": row.get("potential_students_demographic") or row.get("potential_students"), "unit": unit("сценарная ёмкость", "scenario capacity"), "evidence_class": "model_estimate", "detail": {"ru": f"Ограниченный сценарий: {fmt_num(row.get('potential_students_constrained'))}; ускоренный: {fmt_num(row.get('potential_students_accelerated'))}.", "en": f"Constrained: {fmt_num(row.get('potential_students_constrained'))}; accelerated: {fmt_num(row.get('potential_students_accelerated'))}."}, "source": source_from(row)}
        for row in by_country_2050[:12]
    ]
    add_handoffs(forecast_mart, ("gap.html", "Сравнить с фактом", "Compare with actual"), ("matrix.html", "Перейти к пилотам", "Open pilots"))
    forecast_mart["interaction_chips"] = [{"ru": "год", "en": "year"}, {"ru": "сценарий", "en": "scenario"}, {"ru": "интервал", "en": "interval"}]
    forecast_mart["acceptance_notes"].append("Scenario capacity is not a guaranteed enrolment forecast.")
    marts.append(forecast_mart)

    gap_mart = route_base("gap", "5.2.8", [gap_path])
    gap_mart["headline_metrics"] = [
        metric("Ранжируемых стран", "Rankable countries", sum(1 for row in gap if str(row.get("excluded_from_rank", "")).lower() not in {"true", "1"}), unit("стран", "countries"), "calculated", source_from(gap_top[0] if gap_top else {}, "unrealized_potential_gap")),
        metric("Симуляций параметров", "Parameter draws", gap_top[0].get("parameter_draw_count") if gap_top else "", unit("розыгрышей", "draws"), "model_estimate", source_from(gap_top[0] if gap_top else {}, "unrealized_potential_gap")),
    ]
    gap_mart["focus_rows"] = [
        {"id": row.get("origin_iso3"), "label": {"ru": country_ru(row.get("origin_country", "")), "en": row.get("origin_country", "")}, "value": row.get("gap_abs"), "unit": unit("студентов-эквивалент", "student-equivalent gap"), "evidence_class": "model_estimate", "detail": {"ru": f"Вероятность положительного разрыва {fmt_score(number(row.get('probability_positive_representation_gap')) * 100)}%; факт {fmt_num(row.get('actual_students_latest'))}; медианный разрыв {fmt_num(row.get('gap_parameter_q50'))}.", "en": f"Positive-gap probability {fmt_score(number(row.get('probability_positive_representation_gap')) * 100)}%; actual {fmt_num(row.get('actual_students_latest'))}; median gap {fmt_num(row.get('gap_parameter_q50'))}."}, "source": source_from(row)}
        for row in gap_top[:12]
    ]
    add_handoffs(gap_mart, ("matrix.html", "Преобразовать в действие", "Convert into action"), ("report.html", "Добавить в доклад", "Add to report"))
    gap_mart["interaction_chips"] = [{"ru": "факт", "en": "actual"}, {"ru": "структурная ёмкость", "en": "capacity"}, {"ru": "P+", "en": "P+"}]
    marts.append(gap_mart)

    matrix_mart = route_base("matrix", "5.2.9", [matrix_path])
    matrix_mart["headline_metrics"] = [
        metric("Комбинаций", "Combinations", len(matrix), unit("строк страна-программа", "country-program rows"), "model_estimate", matrix_source(matrix_top[0] if matrix_top else {}, matrix_path)),
        metric("Эффект до пилота", "Effect identification", lang("не оценён ex ante", "ex ante blocked"), unit("политика оценки", "policy"), "missing_not_applicable", matrix_source(matrix_top[0] if matrix_top else {}, matrix_path)),
    ]
    matrix_mart["focus_rows"] = [
        {"id": f"{row.get('iso3')}-{row.get('program_group')}", "label": {"ru": f"{country_ru(row.get('country', ''))} · {row.get('program_label_ru', '')}", "en": f"{row.get('country', '')} · {program_en(row.get('program_group', ''))}"}, "value": row.get("combined_country_program_priority_score"), "unit": unit("индекс приоритета", "management index"), "evidence_class": "model_estimate", "detail": {"ru": f"{decision_tier_ru(row.get('priority_decision_tier'))}; {instrument_ru(row.get('recruitment_instrument'))}; эффект до пилота не установлен.", "en": f"{row.get('priority_decision_tier')}; {row.get('recruitment_instrument')}; effect not identified ex ante."}, "source": matrix_source(row, matrix_path)}
        for row in matrix_top[:12]
    ]
    add_handoffs(matrix_mart, ("report.html", "Вынести в доклад", "Add to report"), ("vacancies.html", "Проверить трудовой сигнал", "Check labor signal"))
    matrix_mart["interaction_chips"] = [{"ru": "страна", "en": "country"}, {"ru": "программа", "en": "program"}, {"ru": "пилот", "en": "pilot"}]
    matrix_mart["acceptance_notes"].append("Expected effect value remains not identified ex ante.")
    marts.append(matrix_mart)

    report = route_base("report", "5.2.12", [payload_path, matrix_path, gap_path])
    findings = payload.get("reportTables", {}).get("executiveGapTop10", [])[:5] or gap_top[:5]
    report["headline_metrics"] = [
        metric("Источник доклада", "Report source", lang("канонические артефакты", "canonical artifacts"), unit("политика сборки", "policy"), "calculated", source_manifest_source),
        metric("Паспортов источников", "Source passports", len(payload.get("sourceRegistry", {}).get("sources", [])), unit("источников", "sources"), "calculated", source_manifest_source),
    ]
    report["focus_rows"] = [
        {"id": row.get("origin_iso3") or row.get("iso3") or str(index), "label": {"ru": country_ru(row.get("origin_country", "") or row.get("country", "")), "en": row.get("origin_country", "") or row.get("country", "")}, "value": row.get("gap_abs") or row.get("combined_country_program_priority_score"), "unit": unit("доказательная строка", "report evidence"), "evidence_class": "model_estimate", "detail": {"ru": "Кандидат для управленческого вывода с ограничениями и приложением источников.", "en": "Candidate executive finding with caveats and source appendix."}, "source": source_from(row)}
        for index, row in enumerate(findings)
    ]
    add_handoffs(report, ("platform2.html", "Вернуться к карте решений", "Return to decision map"), ("matrix.html", "Открыть матрицу действий", "Open action matrix"))
    report["interaction_chips"] = [{"ru": "вывод", "en": "finding"}, {"ru": "источник", "en": "source"}, {"ru": "PDF", "en": "PDF"}]
    marts.append(report)

    for mart in marts:
        enrich_focus_rows(mart, iso2_by_iso3, country_name_to_iso3)
        mart["source_items"] = [item.get("source", {}) for item in mart.get("headline_metrics", []) + mart.get("focus_rows", [])]
        mart["source_items"] = [item for index, item in enumerate(mart["source_items"]) if item and item not in mart["source_items"][:index]]
        mart["row_counts"] = {
            "headline_metrics": len(mart.get("headline_metrics", [])),
            "focus_rows": len(mart.get("focus_rows", [])),
            "source_items": len(mart.get("source_items", [])),
            "handoffs": len(mart.get("handoffs", [])),
            "interaction_chips": len(mart.get("interaction_chips", [])),
        }
    return marts


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def build_assets() -> dict[str, Any]:
    js_parts = [
        SRC / "core" / "world_class_core.js",
        SRC / "routes" / "research_routes.js",
    ]
    css_src = SRC / "styles" / "world_class.css"
    banner = f"/* MGIMO Platform 2.0 world-class frontend layer. Generated by scripts/build_frontend_world_class.py. Version: {VERSION}. */\n"
    OUT_JS.write_text(banner + "\n".join(path.read_text(encoding="utf-8") for path in js_parts), encoding="utf-8")
    shutil.copyfile(css_src, OUT_CSS)
    return {
        "assets": [
            {"path": str(OUT_JS.relative_to(ROOT)).replace("\\", "/"), "bytes": OUT_JS.stat().st_size, "sha256": sha256(OUT_JS)},
            {"path": str(OUT_CSS.relative_to(ROOT)).replace("\\", "/"), "bytes": OUT_CSS.stat().st_size, "sha256": sha256(OUT_CSS)},
        ],
        "source_parts": [str(path.relative_to(ROOT)).replace("\\", "/") for path in js_parts + [css_src]],
    }


def main() -> int:
    marts = build_marts()
    for mart in marts:
        write_json(UI_DIR / f"{mart['route']}.json", mart)
    mart_files = sorted(UI_DIR.glob("*.json"))
    manifest = {
        "status": "passed",
        "asset_version": VERSION,
        "generated_at_utc": "2026-06-22T00:00:00Z",
        "ui_marts": [
            {
                "route": json.loads(path.read_text(encoding="utf-8"))["route"],
                "path": str(path.relative_to(ROOT)).replace("\\", "/"),
                "bytes": path.stat().st_size,
                "sha256": sha256(path),
            }
            for path in mart_files
        ],
    }
    write_json(MANIFEST, manifest)
    build = {"status": "passed", "asset_version": VERSION, **build_assets(), "ui_mart_manifest": str(MANIFEST.relative_to(ROOT)).replace("\\", "/")}
    write_json(BUILD_MANIFEST, build)
    print(json.dumps({"status": "passed", "ui_marts": len(marts), "asset_version": VERSION}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
