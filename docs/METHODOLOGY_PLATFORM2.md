# Методология MGIMO Platform 2.0

Сформировано из текущего release mart после Wave 3 проверки.

## Политика доказательности

Каждое числовое поле относится к одному из классов: наблюдаемое официальное значение, наблюдаемая reference-строка, официальная проекция, расчётное значение, модельная оценка или явная missingness/blocker category. Missingness не превращается в ноль. Наблюдаемые stocks, официальные проекции, модельные оценки и управленческие индексы не суммируются как один факт.

## Наблюдаемые потоки в Россию

Файл `data/curated/russia_inbound_students_by_origin_2010_2025.csv` сохраняет строки UNESCO UIS OPRI для России. Для рейтингов используется 2023 год как последний содержательный проверенный год. Более поздняя нулевая выкладка UIS сохранена в CSV как аудиторский след и не используется для лидерских сравнений.

## Гравитационная модель

Оцениватель: `Poisson pseudo-maximum likelihood with origin-clustered sandwich covariance`.

Формула: `students_observed ~ ln_student_pool + ln_distance + ln_outbound + ln_outbound_missing + tertiary_share + tertiary_share_missing + unga_alignment + unga_alignment_missing + region fixed effects + year fixed effects`.

Период полного fit: 2011-2023; число наблюдений: 2070. Статус `validated_structural_model_not_short_term_point_forecast` означает, что модель валидирована как структурная allocation / under-representation модель, а не как краткосрочный level forecast. Инерционно-демографический benchmark публикуется отдельно и явно превосходит структурную модель в задаче краткосрочного level prediction.

## Разрыв факт-потенциал

`representation_gap = model_based_attraction_capacity - demographic_continuity_baseline`. Факт берётся из UIS за последний содержательный год, структурная ёмкость относится к 2026 году, а baseline отражает демографически-инерционную траекторию. Положительные и отрицательные разрывы являются reallocative внутри распределения; они не суммируются в дополнительный национальный набор.

## Индекс дружелюбности и восприимчивости

Модель `friendliness_receptivity_ex_ante_v4` является ex-ante индексом. Наблюдаемый student stock опубликован только как descriptive/revealed affinity и исключён из индекса. Компоненты и веса: {"F_DIPLOMATIC_ALIGNMENT": 0.25, "F_INSTITUTIONAL_TIES": 0.2, "F_POLICY_ACCESS": 0.2, "F_RUSSIAN_LANGUAGE_ENVIRONMENT": 0.15, "F_SURVEY_RUSSIA_ATTITUDE": 0.2}. Страны без проверенной строки компонента остаются с missingness; значения не достраиваются вручную.

## Вакансии и компетенции

Официальный API «Работа в России» используется в двух разных ролях. Search-result totals остаются пересекающимися query signals и не являются числом уникальных вакансий. Частичный record-level снимок за 2026-06-20T07:29:59+00:00 содержит 29 046 обезличенных уникальных вакансий, 3 001 классифицированную строку, 2 965 классифицированных уникальных вакансий и 4 126 строк доказательств классификации. Статус `incomplete_snapshot_not_for_population_inference` блокирует population-level выводы, пока не будет завершена полная тематическая пагинация.

## Страново-программная матрица

`country_program_priority_evidence_v5` объединяет структурную страновую возможность, ex-ante friendliness, соответствие профилю программ МГИМО и Russia-side labor-demand signals. Итоговый балл — uncertainty-aware management priority index. Численный эффект набора не заявляется без prospective campaign evaluation.

## Условия источников и атрибуция

Паспорт `data/source_manifest_platform2.json` фиксирует условия по каждому классу источников. UNESCO UIS распространяется по CC BY-SA 4.0 с атрибуцией; наборы World Bank — по условиям World Bank Dataset Terms, по умолчанию CC BY 4.0, если конкретный индикатор не помечен иначе; Natural Earth относится к public domain. Для UN WPP, UN Digital Library, публичных материалов МГИМО и API «Работа в России» релиз публикует атрибутированные производные исследовательские показатели и сохраняет advisory о необходимости институциональной юридической проверки перед коммерческим перераспространением. Это не юридическое заключение.
