/*
 * Altis - language switcher.
 *
 * Injects a language dropdown into the navbar (next to the CTA button) and
 * translates the shared UI (navbar + footer) on the client. Azerbaijani is the
 * source language of the markup; other languages are looked up in TRANSLATIONS.
 *
 * Extending translations:
 *   - Any element can carry data-i18n-en / data-i18n-ru attributes holding the
 *     replacement text, e.g. <h2 data-i18n-en="About us">Haqqımızda</h2>.
 *   - Or register strings from JS: AltisI18n.add({ "Azərbaycanca mətn": { en: "...", ru: "..." } }).
 *     Registered strings are applied to the navbar, the footer and any [data-i18n] block.
 *
 * Adding a language: add an entry to LANGUAGES and a column to TRANSLATIONS.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "altis-lang";
  var DEFAULT_LANG = "az";

  var LANGUAGES = [
    { code: "az", short: "AZ", name: "Azərbaycanca" },
    { code: "en", short: "EN", name: "English" },
    { code: "ru", short: "RU", name: "Русский" },
  ];

  var UI_LABEL = { az: "Dil seçimi", en: "Select language", ru: "Выбор языка" };

  // Keys are the Azerbaijani source strings (whitespace-collapsed).
  var TRANSLATIONS = {
    // Navbar
    "Ana səhifə": { en: "Home", ru: "Главная" },
    "Haqqımızda": { en: "About Us", ru: "О нас" },
    "Xidmətlər": { en: "Services", ru: "Услуги" },
    "Layihələr": { en: "Projects", ru: "Проекты" },
    "Bloq": { en: "Blog", ru: "Блог" },
    "Əlaqə": { en: "Contact", ru: "Контакты" },

    // Footer
    "Xəbər bülletenimizə abunə olun": { en: "Subscribe to our newsletter", ru: "Подпишитесь на нашу рассылку" },
    "E-poçt ünvanı": { en: "Email address", ru: "Адрес электронной почты" },
    "Təşəkkür edirik! Müraciətiniz qəbul edildi!": {
      en: "Thank you! Your submission has been received!",
      ru: "Спасибо! Ваша заявка принята!",
    },
    "Təşəkkür edirik! Sorğunuz qəbul edildi!": {
      en: "Thank you! Your request has been received!",
      ru: "Спасибо! Ваш запрос принят!",
    },
    "Xəta baş verdi! Form göndərilərkən problem yarandı.": {
      en: "Oops! Something went wrong while submitting the form.",
      ru: "Ошибка! Не удалось отправить форму.",
    },
    "Ups! Formanı göndərərkən xəta baş verdi.": {
      en: "Oops! Something went wrong while submitting the form.",
      ru: "Ошибка! Не удалось отправить форму.",
    },
    "Səhifələr": { en: "Pages", ru: "Страницы" },
    "Müştərilərimiz": { en: "Our Clients", ru: "Наши клиенты" },
    "Əlaqə məlumatları": { en: "Contact Information", ru: "Контактная информация" },
    "Binəqədi rayonu, Baksol ərazisi 1, Bakı, Azərbaycan (AZ1054)": {
      en: "Baksol area 1, Binagadi district, Baku, Azerbaijan (AZ1054)",
      ru: "Бинагадинский район, территория Баксол 1, Баку, Азербайджан (AZ1054)",
    },
    "Bizi izləyin": { en: "Follow us", ru: "Следите за нами" },
    "Dizayn və dəstək:": { en: "Design and support:", ru: "Дизайн и поддержка:" },
  };

  var TRANSLATABLE_ATTRS = ["placeholder", "title", "aria-label"];
  var SCOPE_SELECTOR = ".w-nav, .footer, [data-i18n]";

  var originals = new WeakMap(); // text node -> original source text
  var current = DEFAULT_LANG;

  function normalize(text) {
    return text.replace(/\s+/g, " ").trim();
  }

  function isSupported(code) {
    return LANGUAGES.some(function (l) {
      return l.code === code;
    });
  }

  function readStoredLang() {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function storeLang(code) {
    try {
      window.localStorage.setItem(STORAGE_KEY, code);
    } catch (e) {
      /* storage can be blocked (private mode) - the choice just won't persist */
    }
  }

  function initialLang() {
    var fromUrl = null;
    try {
      fromUrl = new URLSearchParams(window.location.search).get("lang");
    } catch (e) {
      /* ignore */
    }
    if (fromUrl && isSupported(fromUrl)) return fromUrl;
    var stored = readStoredLang();
    return stored && isSupported(stored) ? stored : DEFAULT_LANG;
  }

  // ---- Translation ---------------------------------------------------------

  function translateTextNode(node, lang) {
    if (!originals.has(node)) {
      var source = normalize(node.nodeValue);
      if (!source || !TRANSLATIONS[source]) return; // nothing to translate, leave untouched
      originals.set(node, node.nodeValue);
    }
    var original = originals.get(node);
    if (lang === DEFAULT_LANG) {
      node.nodeValue = original;
      return;
    }
    var entry = TRANSLATIONS[normalize(original)];
    var text = entry && entry[lang];
    if (text) {
      var lead = original.match(/^\s*/)[0];
      var trail = original.match(/\s*$/)[0];
      node.nodeValue = lead + text + trail;
    }
  }

  function translateAttributes(el, lang) {
    TRANSLATABLE_ATTRS.forEach(function (attr) {
      var storeKey = "i18nOrig" + attr.replace(/(^|-)(\w)/g, function (_, __, c) {
        return c.toUpperCase();
      });
      if (!el.hasAttribute(attr) && !(storeKey in el.dataset)) return;
      if (!(storeKey in el.dataset)) {
        var source = normalize(el.getAttribute(attr) || "");
        if (!TRANSLATIONS[source]) return;
        el.dataset[storeKey] = el.getAttribute(attr);
      }
      var original = el.dataset[storeKey];
      var entry = TRANSLATIONS[normalize(original)];
      el.setAttribute(attr, lang === DEFAULT_LANG ? original : (entry && entry[lang]) || original);
    });
  }

  function translateScope(root, lang) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode;
        if (p && /^(SCRIPT|STYLE|NOSCRIPT)$/.test(p.nodeName)) return NodeFilter.FILTER_REJECT;
        if (p && p.closest && p.closest(".lang-switcher")) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (n) {
      translateTextNode(n, lang);
    });
    translateAttributes(root, lang);
    root.querySelectorAll("[placeholder], [title], [aria-label]").forEach(function (el) {
      if (!el.closest(".lang-switcher")) translateAttributes(el, lang);
    });
  }

  // Elements that carry their own translations: data-i18n-en / data-i18n-ru.
  function translateExplicit(lang) {
    var selector = LANGUAGES.filter(function (l) {
      return l.code !== DEFAULT_LANG;
    })
      .map(function (l) {
        return "[data-i18n-" + l.code + "]";
      })
      .join(",");
    document.querySelectorAll(selector).forEach(function (el) {
      if (!("i18nSource" in el.dataset)) el.dataset.i18nSource = el.innerHTML;
      var text = lang === DEFAULT_LANG ? null : el.getAttribute("data-i18n-" + lang);
      el.innerHTML = text != null ? text : el.dataset.i18nSource;
    });
  }

  function applyLanguage(lang) {
    document.querySelectorAll(SCOPE_SELECTOR).forEach(function (scope) {
      translateScope(scope, lang);
    });
    translateExplicit(lang);
    document.documentElement.setAttribute("lang", lang);
  }

  // ---- Dropdown ------------------------------------------------------------

  var GLOBE_SVG =
    '<svg class="lang-switcher__globe" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/></svg>';
  var CHEVRON_SVG =
    '<svg class="lang-switcher__chevron" viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5"/></svg>';

  function langByCode(code) {
    return LANGUAGES.filter(function (l) {
      return l.code === code;
    })[0];
  }

  function buildSwitcher(isLightNav) {
    var root = document.createElement("div");
    root.className = "lang-switcher" + (isLightNav ? " lang-switcher--light" : "");

    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "lang-switcher__toggle";
    toggle.setAttribute("aria-haspopup", "listbox");
    toggle.setAttribute("aria-expanded", "false");
    toggle.innerHTML = GLOBE_SVG + '<span class="lang-switcher__current"></span>' + CHEVRON_SVG;

    var menu = document.createElement("ul");
    menu.className = "lang-switcher__menu";
    menu.setAttribute("role", "listbox");
    menu.tabIndex = -1;

    LANGUAGES.forEach(function (lang) {
      var li = document.createElement("li");
      li.setAttribute("role", "presentation");
      var opt = document.createElement("button");
      opt.type = "button";
      opt.className = "lang-switcher__option";
      opt.setAttribute("role", "option");
      opt.setAttribute("data-lang", lang.code);
      opt.setAttribute("lang", lang.code);
      opt.innerHTML =
        '<span class="lang-switcher__code">' + lang.short + '</span><span class="lang-switcher__name">' + lang.name + "</span>";
      li.appendChild(opt);
      menu.appendChild(li);
    });

    root.appendChild(toggle);
    root.appendChild(menu);
    return root;
  }

  function setupSwitcher(root) {
    var toggle = root.querySelector(".lang-switcher__toggle");
    var menu = root.querySelector(".lang-switcher__menu");
    var options = Array.prototype.slice.call(root.querySelectorAll(".lang-switcher__option"));

    function isOpen() {
      return root.classList.contains("is-open");
    }

    function open() {
      root.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
    }

    function close(returnFocus) {
      root.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      if (returnFocus) toggle.focus();
    }

    function focusOption(index) {
      var i = (index + options.length) % options.length;
      options[i].focus();
    }

    function sync() {
      var lang = langByCode(current);
      root.querySelector(".lang-switcher__current").textContent = lang.short;
      toggle.setAttribute("aria-label", UI_LABEL[current] + ": " + lang.name);
      options.forEach(function (opt) {
        var selected = opt.getAttribute("data-lang") === current;
        opt.setAttribute("aria-selected", selected ? "true" : "false");
        opt.classList.toggle("is-active", selected);
      });
    }

    toggle.addEventListener("click", function () {
      if (isOpen()) close(false);
      else {
        open();
        focusOption(options.map(function (o) { return o.getAttribute("data-lang"); }).indexOf(current));
      }
    });

    toggle.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        open();
        focusOption(e.key === "ArrowDown" ? 0 : options.length - 1);
      }
    });

    menu.addEventListener("click", function (e) {
      var opt = e.target.closest(".lang-switcher__option");
      if (!opt) return;
      setLanguage(opt.getAttribute("data-lang"));
      close(true);
    });

    menu.addEventListener("keydown", function (e) {
      var idx = options.indexOf(document.activeElement);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        focusOption(idx + 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        focusOption(idx - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        focusOption(0);
      } else if (e.key === "End") {
        e.preventDefault();
        focusOption(options.length - 1);
      } else if (e.key === "Escape") {
        e.preventDefault();
        close(true);
      } else if (e.key === "Tab") {
        close(false);
      }
    });

    document.addEventListener("click", function (e) {
      if (isOpen() && !root.contains(e.target)) close(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen()) close(true);
    });

    root.addEventListener("altis:sync", sync);
    sync();
  }

  // ---- Public API ----------------------------------------------------------

  function setLanguage(code) {
    if (!isSupported(code)) return;
    current = code;
    storeLang(code);
    applyLanguage(code);
    document.querySelectorAll(".lang-switcher").forEach(function (el) {
      el.dispatchEvent(new Event("altis:sync"));
    });
    document.dispatchEvent(new CustomEvent("altis:languagechange", { detail: { lang: code } }));
  }

  window.AltisI18n = {
    languages: LANGUAGES,
    getLanguage: function () {
      return current;
    },
    setLanguage: setLanguage,
    add: function (extra) {
      Object.keys(extra).forEach(function (key) {
        TRANSLATIONS[normalize(key)] = extra[key];
      });
      applyLanguage(current);
    },
  };

  function init() {
    current = initialLang();

    var nav = document.querySelector(".w-nav");
    var host = nav && nav.querySelector(".button-left");
    if (host && !host.querySelector(".lang-switcher")) {
      var switcher = buildSwitcher(nav.classList.contains("navbar-light"));
      host.classList.add("has-lang-switcher");
      host.insertBefore(switcher, host.firstChild);
      setupSwitcher(switcher);
    }

    applyLanguage(current);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
