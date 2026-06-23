# Словарь данных MGIMO Platform 2.0

## Общие поля происхождения данных

`source_key` — устойчивый идентификатор источника или модели, разрешаемый через `data/source_manifest_platform2.json`.

`source_url_or_file` — официальный URL либо локальный immutable-файл, из которого получена строка.

`retrieved_at` — время получения или фиксации источника.

`source_period` — год или диапазон лет исходного наблюдения.

`raw_value` — исходное число либо сериализованный набор входов расчёта.

`unit` — единица измерения.

`observation_status` — класс значения: официальное наблюдение, reference indicator, официальная проекция, расчёт, модельная оценка или управленческий индекс.

`sha256_or_etag` — криптографический хэш файла или подтверждённый ETag.

`transform_script` — код, преобразовавший источник в опубликованную строку.

`trace_id` — детерминированный идентификатор наблюдения для аудита lineage.

## Международная образовательная мобильность

`origin_iso3`, `destination_iso3`, `year` — страна происхождения, страна назначения и год наблюдения.

`students_observed` — наблюдаемый stock зачисленных иностранных студентов UNESCO UIS OPRI. Это не число новых зачислений за год.

`flow_or_stock` — семантика измерения; для канонической UIS-панели имеет значение enrolled stock.

`coverage_status` — пригодность среза для межстранового сравнения. Частичные годы сохраняются, но не используются как полный глобальный рейтинг.

## Демографический и страновой feature mart

`feature_key` — код показателя.

`value` — значение показателя после harmonization, без подмены отсутствия нулём.

`student_pool` — население 15–24 лет плюс 0,45 населения 25–29 лет по UN WPP 2024 Medium.

`observation_status=official_projection` — официальная демографическая проекция, а не собственный прогноз платформы.

## Структурная PPML и сценарии

`potential_students` / `model_based_attraction_capacity` — условная структурная ёмкость страны внутри заданного совокупного сценария России.

`demographic_continuity_baseline` — инерционно-демографический benchmark уровня.

`aggregate_capacity_constrained`, `aggregate_capacity_demographic`, `aggregate_capacity_accelerated` — три sensitivity paths общей ёмкости России.

`gap_abs` / `representation_gap` — разница между структурной ёмкостью и последним содержательным фактическим значением.

`gap_parameter_q025`, `gap_parameter_q50`, `gap_parameter_q975` — квантили 600 совместных симуляций коэффициентов PPML.

`probability_positive_representation_gap` — доля параметрических симуляций с положительным разрывом.

`probability_top10_unrealized_potential`, `probability_top20_unrealized_potential` — вероятность попадания в соответствующую группу при параметрической неопределённости.

## Friendliness/receptivity ex-ante v4

`friendliness_ex_ante_score` — headline 0–100, рассчитанный без фактического притока студентов.

`conservative_lower_bound`, `optimistic_upper_bound` — границы при неблагоприятном/благоприятном заполнении отсутствующих компонентов.

`component_coverage_score` — доля весов, для которых имеется проверяемая строка.

`evidence_reliability_class` — класс доказательности.

`rank_for_display` — публикуемый ранг; остаётся пустым, если место не идентифицируется.

`actual_students_latest`, `revealed_educational_affinity` — отдельные descriptive outcomes, исключённые из ex-ante score.

## «Работа в России» v5

`vacancy_id` — официальный идентификатор вакансии и ключ дедупликации.

`skills_json` — дедуплицированный массив явно опубликованных компетенций из `skills[]`.

`classification_status` — результат содержательной классификации по названию, типовой позиции, профессиональной сфере, квалификации и explicit skills.

`program_group` — одна из пяти групп программ МГИМО.

`classification_evidence_type` — поле, в котором найдено подтверждение. Поисковая фраза не допускается как classification evidence.

`classified_unique_vacancies` — число уникальных вакансий соответствующей группы после дедупликации.

`input_unique_vacancies` — размер обезличенного тематического корпуса.

`program_labor_demand_score` — относительный индекс спроса 0–100 по record-level показателям; не является числом вакансий России.

`labor_demand_score_p05`, `labor_demand_score_p95` — границы 800-draw record bootstrap.

`api_search_result_count` — служебный `meta.total` отдельного запроса. Итоги разных запросов перекрываются, не суммируются и не входят в score.

## Матрица «страна — программа» v5

`combined_country_program_priority_score` — медиана четырёх прозрачных сценариев управленческих весов.

`priority_evidence_low`, `priority_evidence_high` — объединённые evidence bounds PPML, friendliness missingness, labor bootstrap и чувствительности весов.

`priority_decision_tier` — класс решения A–D. Tier A требует moderate/high friendliness evidence и строгих нижних границ; в текущем релизе A не присвоен автоматически.

`teaching_language` — рекомендуемая языковая конфигурация обучения.

`recruitment_instrument` — предлагаемый инструмент пилотной кампании.

`expected_effect_type=not_identified_ex_ante` — причинный эффект до проведения кампании не установлен.

`recommended_evaluation_design` и `recommended_evaluation_kpis` — дизайн последующей эмпирической оценки и измеряемые KPI.
