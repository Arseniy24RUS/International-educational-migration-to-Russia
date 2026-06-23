(() => {
  "use strict";

  const STORAGE_KEYS = ["mgimo_platform2_lang", "mgimo_students_lang", "mgimo_lang"];
  const MAIN_ROUTES = [
    { id: "platform2", href: "platform2.html", step: "01", task: "5.2.1", ru: "Обзор", en: "Overview", ruLong: "Концептуальная модель", enLong: "Conceptual model" },
    { id: "migration", href: "migration.html", step: "02", task: "5.2.2", ru: "Потоки", en: "Flows", ruLong: "Потоки 2010–2025", enLong: "Flows 2010–2025" },
    { id: "demography", href: "demography.html", step: "03", task: "5.2.3", ru: "Рынки 2050", en: "Markets 2050", ruLong: "Молодёжные рынки", enLong: "Youth markets" },
    { id: "model", href: "model.html", step: "04", task: "5.2.4", ru: "Модель", en: "Model", ruLong: "Гравитационная модель", enLong: "Gravity model" },
    { id: "friendliness", href: "friendliness.html", step: "05", task: "5.2.5", ru: "Восприимчивость", en: "Receptivity", ruLong: "Восприимчивость к России", enLong: "Receptivity to Russia" },
    { id: "vacancies", href: "vacancies.html", step: "06", task: "5.2.6", ru: "Компетенции", en: "Skills", ruLong: "Вакансии и компетенции", enLong: "Vacancies and skills" },
    { id: "forecast", href: "forecast.html", step: "07", task: "5.2.7", ru: "Прогноз", en: "Forecast", ruLong: "Прогноз до 2050 года", enLong: "Forecast to 2050" },
    { id: "gap", href: "gap.html", step: "08", task: "5.2.8", ru: "Потенциал", en: "Potential", ruLong: "Нереализованный потенциал", enLong: "Unrealized potential" },
    { id: "matrix", href: "matrix.html", step: "09", task: "5.2.9", ru: "Матрица", en: "Matrix", ruLong: "Стратегическая матрица", enLong: "Strategic matrix" },
    { id: "report", href: "report.html", step: "10", task: "5.2.12", ru: "Доклад", en: "Report", ruLong: "Итоговый доклад", enLong: "Final report" },
  ];

  const MODULE_ROUTES = [
    { id: "branches", href: "index.html", ru: "Филиалы", en: "Branches" },
    { id: "students", href: "students.html", ru: "Студенты", en: "Students" },
    { id: "labor", href: "labor.html", ru: "Трудовая миграция", en: "Labor migration" },
  ];

  const TEXT = {
    ru: {
      product: "Международная образовательная миграция в Россию",
      institution: "МГИМО МИД России · ФНИСЦ РАН",
      researchNav: "Разделы исследования",
      moduleNav: "Специализированные модули",
      menu: "Навигация",
      language: "Язык интерфейса",
      openModules: "Модули",
      skipToContent: "Перейти к содержанию",
    },
    en: {
      product: "International educational migration to Russia",
      institution: "MGIMO University · FCTAS RAS",
      researchNav: "Research sections",
      moduleNav: "Specialized modules",
      menu: "Navigation",
      language: "Interface language",
      openModules: "Modules",
      skipToContent: "Skip to content",
    },
  };

  function currentLanguage(explicit) {
    if (["ru", "en"].includes(explicit)) return explicit;
    for (const key of STORAGE_KEYS) {
      const sessionValue = sessionStorage.getItem(key);
      if (["ru", "en"].includes(sessionValue)) return sessionValue;
    }
    for (const key of STORAGE_KEYS) {
      const value = localStorage.getItem(key);
      if (["ru", "en"].includes(value)) return value;
    }
    return "ru";
  }

  function storeLanguage(lang) {
    STORAGE_KEYS.forEach((key) => {
      sessionStorage.setItem(key, lang);
      localStorage.setItem(key, lang);
    });
  }

  function currentPageId() {
    const declared = document.body?.dataset?.view || document.body?.dataset?.page;
    if (declared) return declared;
    const pathname = location.pathname.replace(/\\/g, "/");
    if (/\/labor\/(?:index\.html)?$/.test(pathname) || /\/labor\.html$/.test(pathname)) return "labor";
    if (/\/students\.html$/.test(pathname)) return "students";
    if (/\/(?:index\.html)?$/.test(pathname)) return "branches";
    const filename = pathname.split("/").pop() || "platform2.html";
    const match = [...MAIN_ROUTES, ...MODULE_ROUTES].find((route) => route.href === filename);
    return match?.id || "platform2";
  }

  function isLaborSubdirectory() {
    return /\/labor\/(?:index\.html)?$/.test(location.pathname.replace(/\\/g, "/"));
  }

  function hrefFor(route) {
    if (!isLaborSubdirectory()) return route.href;
    if (route.id === "labor") return "index.html";
    return `../${route.href}`;
  }

  function logoPath(name) {
    return `${isLaborSubdirectory() ? "../" : ""}assets/${name}`;
  }

  function pageMeta(pageId) {
    return MAIN_ROUTES.find((route) => route.id === pageId)
      || MODULE_ROUTES.find((route) => route.id === pageId)
      || MAIN_ROUTES[0];
  }

  function syncSkipLinks(lang) {
    const label = (TEXT[lang] || TEXT.ru).skipToContent;
    document.querySelectorAll(".skip-link").forEach((link) => {
      link.textContent = label;
      if (!link.getAttribute("href")) link.setAttribute("href", "#app");
      link.setAttribute("data-shell-localized", "true");
    });
  }

  function navItem(route, pageId, lang) {
    const active = route.id === pageId;
    const label = route[lang] || route.ru;
    const longLabel = route[`${lang}Long`] || label;
    return `<a class="mgimo-shell-nav-link${active ? " active" : ""}" href="${hrefFor(route)}"${active ? ' aria-current="page"' : ""} data-route-id="${route.id}" title="${longLabel}">
      <span class="mgimo-shell-step" aria-hidden="true">${route.step}</span>
      <span class="mgimo-shell-link-copy"><strong>${label}</strong><small>${route.task}</small></span>
    </a>`;
  }

  function moduleItem(route, pageId, lang) {
    const active = route.id === pageId;
    return `<a class="mgimo-shell-module-link${active ? " active" : ""}" href="${hrefFor(route)}"${active ? ' aria-current="page"' : ""} data-route-id="${route.id}">${route[lang] || route.ru}</a>`;
  }

  function render(options = {}) {
    const header = document.querySelector(options.selector || "header.app-header, #platform2Header");
    if (!header) return null;
    const pageId = options.pageId || currentPageId();
    const lang = currentLanguage(options.lang);
    const copy = TEXT[lang];
    const meta = pageMeta(pageId);
    const pageTitle = options.pageTitle || meta[`${lang}Long`] || meta[lang] || "";
    const pageSubtitle = options.pageSubtitle || "";

    let bar = header.querySelector(":scope > .executive-bar");
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "executive-bar";
      header.prepend(bar);
    }
    bar.classList.add("mgimo-shell-bar");
    bar.innerHTML = `
      <div class="mgimo-shell-brand">
        <div class="institution-lockup" aria-label="${copy.institution}">
          <a class="logo-link" href="https://mgimo.ru/" target="_blank" rel="noopener noreferrer" aria-label="MGIMO">
            <img class="brand-logo mgimo-logo" src="${logoPath("mgimo-home.png")}" alt="MGIMO" />
          </a>
          <span class="brand-divider" aria-hidden="true"></span>
          <a class="logo-link" href="https://www.fnisc.ru/" target="_blank" rel="noopener noreferrer" aria-label="FNISC">
            <img class="brand-logo fnisc-logo" src="${logoPath("fnisc.png")}" alt="FNISC" />
          </a>
        </div>
        <div class="mgimo-shell-title-block">
          <span class="mgimo-shell-eyebrow">${copy.institution}</span>
          <h1>${copy.product}</h1>
          <p><span class="mgimo-shell-page-code">${meta.task || (lang === "ru" ? "МОДУЛЬ" : "MODULE")}</span><strong>${pageTitle}</strong>${pageSubtitle ? `<span>${pageSubtitle}</span>` : ""}</p>
        </div>
      </div>
      <div class="mgimo-shell-tools">
        <details class="mgimo-shell-modules">
          <summary>${copy.openModules}</summary>
          <div class="mgimo-shell-module-menu" role="group" aria-label="${copy.moduleNav}">
            ${MODULE_ROUTES.map((route) => moduleItem(route, pageId, lang)).join("")}
          </div>
        </details>
        <div class="segmented compact mgimo-shell-language" role="group" aria-label="${copy.language}">
          <button id="langRu" data-lang="ru" class="segment ${lang === "ru" ? "active" : ""}" type="button" aria-pressed="${lang === "ru"}">RU</button>
          <button id="langEn" data-lang="en" class="segment ${lang === "en" ? "active" : ""}" type="button" aria-pressed="${lang === "en"}">EN</button>
        </div>
        <button class="mgimo-shell-menu-button" type="button" aria-expanded="false" aria-controls="mgimoResearchNav">${copy.menu}</button>
      </div>
      <nav id="mgimoResearchNav" class="app-nav p2-nav mgimo-shell-nav" aria-label="${copy.researchNav}">
        ${MAIN_ROUTES.map((route) => navItem(route, pageId, lang)).join("")}
        <div class="mgimo-shell-module-links" aria-label="${copy.moduleNav}">
          ${MODULE_ROUTES.map((route) => moduleItem(route, pageId, lang)).join("")}
        </div>
      </nav>`;

    const menuButton = bar.querySelector(".mgimo-shell-menu-button");
    const nav = bar.querySelector(".mgimo-shell-nav");
    const closeMenu = ({ restoreFocus = false } = {}) => {
      menuButton?.setAttribute("aria-expanded", "false");
      nav?.classList.remove("open");
      if (restoreFocus) menuButton?.focus();
    };
    menuButton?.addEventListener("click", () => {
      const expanded = menuButton.getAttribute("aria-expanded") === "true";
      if (expanded) closeMenu();
      else {
        menuButton.setAttribute("aria-expanded", "true");
        nav?.classList.add("open");
      }
    });
    bar.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menuButton?.getAttribute("aria-expanded") === "true") {
        event.preventDefault();
        closeMenu({ restoreFocus: true });
      }
    });
    nav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => closeMenu()));

    bar.querySelectorAll("[data-lang]").forEach((button) => {
      button.addEventListener("click", () => {
        const nextLang = button.getAttribute("data-lang");
        if (!["ru", "en"].includes(nextLang)) return;
        storeLanguage(nextLang);
        document.documentElement.lang = nextLang;
        window.dispatchEvent(new CustomEvent("mgimo:language-change", { detail: { lang: nextLang } }));
        window.setTimeout(() => render({ ...options, lang: nextLang }), 0);
      });
    });

    document.documentElement.lang = lang;
    syncSkipLinks(lang);
    document.title = `${copy.product} — ${pageTitle}`;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute("content", `${copy.product}. ${pageTitle}.`);
    document.body.dataset.shellReady = "true";
    return bar;
  }

  window.MGIMO_SHELL = {
    MAIN_ROUTES,
    MODULE_ROUTES,
    currentLanguage,
    currentPageId,
    pageMeta,
    render,
  };

  const autoRender = () => render();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", autoRender, { once: true });
  else autoRender();
})();
