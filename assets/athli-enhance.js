/* =============================================================================
   Athli-style enhancements for the Sculptr (Framer) site — behaviour layer.
   Builds the navbar + footer DOM, scroll-reactive pill, theme toggle,
   mobile menu, scroll-progress bar and back-to-top button.

   >>> EDIT THE CONFIG BLOCK BELOW to change logo / links / socials / labels. <<<
   ========================================================================== */
(function () {
  "use strict";

  /* ----------------------------- CONFIG ----------------------------------- */
  var CONFIG = {
    logo: "https://framerusercontent.com/images/2s5IeQ3VOaEwTjCOKM1C7rUbF2Q.png",
    homeHref: "./",
    // Center nav links — '#' entries are placeholders for you to point at sections.
    navLinks: [
      { label: "Features", href: "#" },
      { label: "How it works", href: "#" },
      { label: "FAQ", href: "#" },
      { label: "Contact", href: "./contact" }
    ],
    ctaLabel: "Contact the Team",          // default CTA
    ctaLabelScrolled: "Get Started",        // CTA label once the nav shrinks
    ctaHref: "./contact",
    footerLinks: [
      { label: "Features", href: "#" },
      { label: "How it works", href: "#" },
      { label: "FAQ", href: "#" },
      { label: "Contact", href: "./contact" },
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" }
    ],
    socials: [
      { label: "X/Twitter", href: "#", path: "M10.488 14.651L15.25 21h7l-7.858-10.478L20.93 3h-2.65l-5.117 5.886L8.75 3h-7l7.51 10.015L2.32 21h2.65zM16.25 19L5.75 5h2l10.5 14z" },
      { label: "LinkedIn", href: "#", path: "M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93zM6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37z" },
      { label: "Instagram", href: "#", path: "M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4zm9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8A1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5a5 5 0 0 1-5 5a5 5 0 0 1-5-5a5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3" },
      { label: "YouTube", href: "#", path: "M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83c-.25.9-.83 1.48-1.73 1.73c-.47.13-1.33.22-2.65.28c-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44c-.9-.25-1.48-.83-1.73-1.73c-.13-.47-.22-1.1-.28-1.9c-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83c.25-.9.83-1.48 1.73-1.73c.47-.13 1.33-.22 2.65-.28c1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44c.9.25 1.48.83 1.73 1.73z" }
    ],
    copyright: "© " + 2026 + " Sculptr. All rights reserved."
  };

  var THEME_KEY = "sculptr-theme";
  var SVGNS = "http://www.w3.org/2000/svg";

  /* ----------------------------- helpers ---------------------------------- */
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "class") n.className = attrs[k];
      else if (k === "html") n.innerHTML = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }
  function icon(viewBox, inner, opts) {
    var s = document.createElementNS(SVGNS, "svg");
    s.setAttribute("viewBox", viewBox);
    s.setAttribute("fill", "none");
    s.setAttribute("stroke", "currentColor");
    s.setAttribute("stroke-width", (opts && opts.sw) || "2");
    s.setAttribute("stroke-linecap", "round");
    s.setAttribute("stroke-linejoin", "round");
    if (opts && opts.cls) s.setAttribute("class", opts.cls);
    s.innerHTML = inner;
    return s;
  }
  function filledIcon(path) {
    var s = document.createElementNS(SVGNS, "svg");
    s.setAttribute("viewBox", "0 0 24 24");
    s.setAttribute("fill", "currentColor");
    s.innerHTML = '<path d="' + path + '"></path>';
    return s;
  }

  /* ----------------------------- theme ------------------------------------ */
  function applyTheme(mode) {
    if (mode === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }
  function currentTheme() {
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
  }
  function toggleTheme() {
    var next = currentTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
  }

  /* ----------------------------- navbar ----------------------------------- */
  function buildNav() {
    var logo = el("a", { class: "ath-nav__logo", href: CONFIG.homeHref, "aria-label": "Sculptr home" },
      [el("img", { src: CONFIG.logo, alt: "Sculptr" })]);

    var links = el("ul", { class: "ath-nav__links" },
      CONFIG.navLinks.map(function (l) {
        return el("li", null, [el("a", { href: l.href, html: l.label })]);
      }));

    var sun = icon("0 0 24 24",
      '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>',
      { cls: "ath-icon-sun" });
    var moon = icon("0 0 24 24", '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>', { cls: "ath-icon-moon" });
    var themeBtn = el("button", { class: "ath-icon-btn ath-theme-toggle", type: "button", "aria-label": "Toggle dark mode" }, [sun, moon]);
    themeBtn.addEventListener("click", toggleTheme);

    var cta = el("a", { class: "ath-btn ath-btn--primary", href: CONFIG.ctaHref, html: CONFIG.ctaLabel });

    var burger = el("button", { class: "ath-icon-btn ath-nav__burger", type: "button", "aria-label": "Open menu" },
      [icon("0 0 24 24", '<path d="M4 6h16M4 12h16M4 18h16"></path>')]);

    var actions = el("div", { class: "ath-nav__actions" }, [cta, themeBtn, burger]);
    var inner = el("div", { class: "ath-nav__inner" }, [logo, links, actions]);
    var nav = el("nav", { class: "ath-nav", "aria-label": "Primary" }, [inner]);

    /* mobile panel */
    var mLinks = CONFIG.navLinks.map(function (l) {
      return el("a", { class: "ath-mobile-link", href: l.href, html: l.label });
    });
    var mCta = el("a", { class: "ath-btn ath-btn--primary", href: CONFIG.ctaHref, html: CONFIG.ctaLabel });
    var mTheme = themeBtn.cloneNode(true);
    mTheme.addEventListener("click", toggleTheme);
    var mRow = el("div", { class: "ath-mobile-row" }, [mCta, mTheme]);
    var panel = el("div", { class: "ath-mobile-panel", role: "dialog", "aria-label": "Menu" }, mLinks.concat([mRow]));

    burger.addEventListener("click", function () {
      var open = panel.classList.toggle("is-open");
      burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    panel.addEventListener("click", function (e) {
      if (e.target.tagName === "A") panel.classList.remove("is-open");
    });

    document.body.appendChild(nav);
    document.body.appendChild(panel);
    return { nav: nav, cta: cta };
  }

  /* ----------------------------- footer ----------------------------------- */
  function buildFooter() {
    var logo = el("a", { class: "ath-footer__logo", href: CONFIG.homeHref, "aria-label": "Sculptr home" },
      [el("img", { src: CONFIG.logo, alt: "Sculptr" })]);
    var links = el("div", { class: "ath-footer__links" },
      CONFIG.footerLinks.map(function (l) { return el("a", { href: l.href, html: l.label }); }));
    var social = el("div", { class: "ath-footer__social" },
      CONFIG.socials.map(function (s) {
        return el("a", { href: s.href, target: "_blank", rel: "noopener noreferrer", "aria-label": s.label }, [filledIcon(s.path)]);
      }));
    var copy = el("p", { class: "ath-footer__copy", html: CONFIG.copyright });
    var inner = el("div", { class: "ath-footer__inner" }, [logo, links, social, copy]);
    var footer = el("footer", { class: "ath-footer" }, [inner]);
    document.body.appendChild(footer);
  }

  /* --------------------- scroll progress + back to top -------------------- */
  function buildScrollExtras() {
    var bar = el("div", { class: "ath-progress", role: "presentation" });
    var toTop = el("button", { class: "ath-totop", type: "button", "aria-label": "Back to top" },
      [icon("0 0 24 24", '<path d="M12 19V5M5 12l7-7 7 7"></path>')]);
    toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
    document.body.appendChild(bar);
    document.body.appendChild(toTop);
    return { bar: bar, toTop: toTop };
  }

  /* ----------------------------- scroll glue ------------------------------ */
  function wireScroll(nav, cta, bar, toTop) {
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        var y = window.scrollY || document.documentElement.scrollTop;
        var scrolled = y > 50;
        nav.classList.toggle("is-scrolled", scrolled);
        if (cta) cta.innerHTML = scrolled ? CONFIG.ctaLabelScrolled : CONFIG.ctaLabel;

        var docH = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (docH > 0 ? (y / docH) * 100 : 0) + "%";
        toTop.classList.toggle("is-visible", y > 400);
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ----------------------------- init ------------------------------------- */
  function init() {
    var built = buildNav();
    buildFooter();
    var extras = buildScrollExtras();
    wireScroll(built.nav, built.cta, extras.bar, extras.toTop);
    // Default theme is light; we only ever go dark when the user explicitly
    // chooses it (persisted in localStorage). No OS-preference auto-dark.
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
