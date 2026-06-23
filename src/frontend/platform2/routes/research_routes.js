((api) => {
  "use strict";
  if (!api) return;

  const routeConfigs = {
    platform2: {
      visualTitle: { ru: "Карта связей факты-модели-решения", en: "Facts-models-decisions map" },
      semanticWarning: {
        ru: "Центр показывает, где наблюдение, где модель, где управленческая гипотеза; это не единая шкала фактов.",
        en: "The center separates observation, model output and management hypothesis; these are not one fact scale.",
      },
    },
    migration: {
      visualTitle: { ru: "Навигатор контингента UIS", en: "UIS stock explorer" },
      semanticWarning: {
        ru: "Показатель является stock контингента иностранных студентов в России, а не годовым flow поступивших.",
        en: "The metric is a student stock in Russia, not an annual enrolment flow.",
      },
    },
    demography: {
      visualTitle: { ru: "Обозреватель молодёжных рынков UN WPP", en: "UN WPP youth-market explorer" },
      semanticWarning: {
        ru: "После границы оценка/проекция показывается Medium variant ООН; это официальная проекция, не наблюдение будущего.",
        en: "After the estimate/projection boundary this uses the UN Medium variant; it is an official projection, not observed future.",
      },
    },
    model: {
      visualTitle: { ru: "Карточка модели и диагностика", en: "Model card and diagnostics" },
      semanticWarning: {
        ru: "PPML объясняет структурную ёмкость и неопределённость; коэффициенты не являются причинными эффектами.",
        en: "PPML explains structural capacity and uncertainty; coefficients are not causal effects.",
      },
    },
    friendliness: {
      visualTitle: { ru: "Навигатор восприимчивости", en: "Receptivity explorer" },
      semanticWarning: {
        ru: "Индекс ограничен ex ante компонентами; при слабом покрытии не создаётся ложный точный ранг.",
        en: "The index is bounded to ex ante components; limited coverage must not produce false exact ranks.",
      },
    },
    vacancies: {
      visualTitle: { ru: "Обезличенный кокпит вакансий и компетенций", en: "Privacy-safe vacancy evidence cockpit" },
      semanticWarning: {
        ru: "Trudvsem query totals являются диагностическими сигналами; публичные записи обезличены и не являются уникальным счётом вакансий.",
        en: "Trudvsem query totals are diagnostic signals; public records are sanitized and are not a unique vacancy count.",
      },
    },
    forecast: {
      visualTitle: { ru: "Сценарная лаборатория 2026-2050", en: "Scenario lab 2026-2050" },
      semanticWarning: {
        ru: "Сценарии показывают траектории при заданных предпосылках; это не точечный прогноз и не обещанный поток.",
        en: "Scenarios show paths under assumptions; they are not point forecasts or promised enrolments.",
      },
    },
    gap: {
      visualTitle: { ru: "Рабочая зона структурного разрыва", en: "Structural under-representation workbench" },
      semanticWarning: {
        ru: "Структурный разрыв сравнивает факт и модельную ёмкость; положительный разрыв остаётся модельной оценкой с интервалами.",
        en: "Gap compares actual stock with structural model capacity; positive gap remains a model estimate with intervals.",
      },
    },
    matrix: {
      visualTitle: { ru: "Матрица решений", en: "Decision workbench" },
      semanticWarning: {
        ru: "Матрица формирует ex ante гипотезы для пилотов; effect not identified ex ante должен оставаться видимым.",
        en: "The matrix forms ex ante pilot hypotheses; effect not identified ex ante must remain visible.",
      },
    },
    report: {
      visualTitle: { ru: "Конструктор ректорского доклада", en: "Executive report composer" },
      semanticWarning: {
        ru: "Отчёт собирает те же канонические outputs и приложения источников; он не создаёт новых чисел.",
        en: "The report assembles the same canonical outputs and source appendix; it does not create new numbers.",
      },
    },
  };

  Object.entries(routeConfigs).forEach(([route, config]) => {
    api.registerRoute(route, (mart, helpers) => helpers.renderWorkbench(mart, config));
  });
})(window.MGIMOWorldClass);
