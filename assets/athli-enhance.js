/* =============================================================================
   Athli-style enhancements for the Sculptr (Framer) site — behaviour layer.
   Builds the navbar + footer DOM, scroll-reactive glass CTA, mobile menu,
   scroll-progress bar and back-to-top button.

   >>> EDIT THE CONFIG BLOCK BELOW to change logo / links / socials / labels. <<<
   ========================================================================== */
(function () {
  "use strict";

  /* ----------------------------- CONFIG ----------------------------------- */
  var CONFIG = {
    logo: "https://framerusercontent.com/images/2s5IeQ3VOaEwTjCOKM1C7rUbF2Q.png",
    homeHref: "./",
    // One Contact target for the nav and the footer, so the two can't drift.
    contactHref: "./contact",
    // Center nav links — `scroll` entries smooth-scroll to an in-page section.
    navLinks: [
      { label: "How it works", href: "#", scroll: ".ath-how-head" },
      { label: "Features", href: "#", scroll: ".ath-feat" },
      { label: "Demo", href: "#", scroll: ".ath-demo" },
      { label: "Pricing", href: "#", scroll: ".ath-pr" },
      { label: "FAQ", href: "#faq", scroll: "#faq" },
      { label: "Contact", href: null, contact: true }
    ],
    ctaLabel: "Launch App",                 // CTA (stays the same when scrolled)
    ctaLabelScrolled: "Launch App",
    ctaHref: "https://app.sculptrlabs.com",
    // Privacy/Terms live on the app (app/(public)/legal/[slug]) — the same
    // documents the sign-up flow links to, so there's one copy of each.
    footerLinks: [
      { label: "How it works", href: "#", scroll: ".ath-how-head" },
      { label: "FAQ", href: "#faq", scroll: "#faq" },
      { label: "Contact", href: null, contact: true },
      { label: "Privacy", href: "https://app.sculptrlabs.com/legal/privacy" },
      { label: "Terms", href: "https://app.sculptrlabs.com/legal/terms" }
    ],
    socials: [],   // hidden for now
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
  /* CTA rendered as the Petr Knoll glass button in the brand "haze" (blue) tone. */
  function glassCta(label) {
    var text = el("span", { class: "glass-button-text", html: label });
    var link = el("a", { class: "glass-button", href: CONFIG.ctaHref }, [text]);
    var shadow = el("div", { class: "glass-button-shadow" });
    var wrap = el("div", { class: "glass-button-wrap glass-button--haze ath-nav-cta" }, [link, shadow]);
    return { wrap: wrap, text: text };
  }
  /* smooth-scroll to an in-page section, offset for the fixed nav (mirrors the
     hero "Find Out More" behaviour). Used by nav + footer links with `scroll`. */
  function smoothTo(sel) {
    var t = document.querySelector(sel);
    if (!t) return;
    var nav = document.querySelector(".ath-nav");
    var offset = (nav ? nav.offsetHeight : 64) + 24;
    var y = t.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop) - offset;
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
  }
  function wireScrollLink(a, sel) {
    a.addEventListener("click", function (e) { e.preventDefault(); smoothTo(sel); });
  }

  // Contact is defined once; both link lists take it from there.
  (function resolveContact() {
    var lists = [CONFIG.navLinks, CONFIG.footerLinks];
    for (var i = 0; i < lists.length; i++)
      for (var j = 0; j < lists[i].length; j++)
        if (lists[i][j].contact) lists[i][j].href = CONFIG.contactHref;
  })();

  function buildNav() {
    var logo = el("a", { class: "ath-nav__logo", href: CONFIG.homeHref, "aria-label": "Sculptr home" },
      [el("img", { src: CONFIG.logo, alt: "Sculptr" })]);

    var links = el("ul", { class: "ath-nav__links" },
      CONFIG.navLinks.map(function (l) {
        var a = el("a", { href: l.href, html: l.label });
        if (l.scroll) wireScrollLink(a, l.scroll);
        return el("li", null, [a]);
      }));

    var ctaObj = glassCta(CONFIG.ctaLabel);
    var cta = ctaObj.wrap;

    var burger = el("button", { class: "ath-icon-btn ath-nav__burger", type: "button", "aria-label": "Open menu" },
      [icon("0 0 24 24", '<path d="M4 6h16M4 12h16M4 18h16"></path>')]);

    var actions = el("div", { class: "ath-nav__actions" }, [cta, burger]);
    var inner = el("div", { class: "ath-nav__inner" }, [logo, links, actions]);
    var nav = el("nav", { class: "ath-nav", "aria-label": "Primary" }, [inner]);

    /* mobile panel */
    var mLinks = CONFIG.navLinks.map(function (l) {
      var a = el("a", { class: "ath-mobile-link", href: l.href, html: l.label });
      if (l.scroll) wireScrollLink(a, l.scroll);
      return a;
    });
    var mRow = el("div", { class: "ath-mobile-row" }, [glassCta(CONFIG.ctaLabel).wrap]);
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
    return { nav: nav, ctaText: ctaObj.text };
  }

  /* ----------------------------- footer ----------------------------------- */
  /* Quiet reassurance strip above the wordmark: the GDPR badge on its own,
     then three one-line claims. Each item is self-contained — the row is a
     wrapping flex list with no nth-child or sibling rules — so any one of them
     can be dropped without the rest shifting or a separator dangling. */
  var TRUST_ITEMS = [
    { label: "Encrypted in transit and at rest",
      path: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>' },
    { label: "Never used to train models",
      path: '<path d="M13.67 8H18a2 2 0 0 1 2 2v4.33"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M22 22 2 2"/><path d="M8 8H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 1.414-.586"/><path d="M9 13v2"/><path d="M9.67 4H12v2.33"/>' },
    { label: "Deleted on request",
      path: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/>' }
  ];
  var TRUST_NOTE = "Sculptr produces illustrative simulations to support patient conversations. "
    + "It is not a medical device and does not predict or guarantee clinical outcomes.";

  function buildTrustRow() {
    var items = [el("li", { class: "ath-trust__item ath-trust__item--badge" },
      [el("img", { class: "ath-trust__badge", src: "/images/gdpr-compliant.png", alt: "GDPR compliant", loading: "lazy", draggable: "false" })])];
    for (var i = 0; i < TRUST_ITEMS.length; i++) {
      var t = TRUST_ITEMS[i];
      items.push(el("li", { class: "ath-trust__item" }, [
        icon("0 0 24 24", t.path, { cls: "ath-trust__icon", sw: "1.75" }),
        el("span", { html: t.label })
      ]));
    }
    return el("div", { class: "ath-trust" }, [
      el("ul", { class: "ath-trust__row" }, items),
      el("p", { class: "ath-trust__note", html: TRUST_NOTE })
    ]);
  }

  function buildFooter() {
    var logo = el("a", { class: "ath-footer__logo", href: CONFIG.homeHref, "aria-label": "Sculptr home" },
      [el("img", { src: CONFIG.logo, alt: "Sculptr" })]);
    var links = el("div", { class: "ath-footer__links" },
      CONFIG.footerLinks.map(function (l) {
        var a = el("a", { href: l.href, html: l.label });
        if (l.scroll) wireScrollLink(a, l.scroll);
        // Site-internal hop: same white veil as every other route change.
        if (l.fade) a.addEventListener("click", function (e) {
          e.preventDefault(); e.stopPropagation();
          navigateWithFade(this.getAttribute("href"));
        });
        return a;
      }));
    // socials hidden for now (CONFIG.socials empty) — skip the block entirely
    var social = CONFIG.socials.length ? el("div", { class: "ath-footer__social" },
      CONFIG.socials.map(function (s) {
        return el("a", { href: s.href, target: "_blank", rel: "noopener noreferrer", "aria-label": s.label }, [filledIcon(s.path)]);
      })) : null;
    var copy = el("p", { class: "ath-footer__copy", html: CONFIG.copyright });
    var inner = el("div", { class: "ath-footer__inner" }, [buildTrustRow(), logo, links, social, copy]);
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
  function wireScroll(nav, ctaText, bar, toTop) {
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        var y = window.scrollY || document.documentElement.scrollTop;
        var scrolled = y > 50;
        nav.classList.toggle("is-scrolled", scrolled);
        if (ctaText) ctaText.textContent = scrolled ? CONFIG.ctaLabelScrolled : CONFIG.ctaLabel;

        var docH = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (docH > 0 ? (y / docH) * 100 : 0) + "%";
        toTop.classList.toggle("is-visible", y > 400);
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ----------------------------- hero badge ------------------------------- */
  function buildHeroBadge() {
    function findHeading() {
      var hs = document.querySelectorAll("h1");
      for (var i = 0; i < hs.length; i++) {
        if ((hs[i].textContent || "").replace(/\s+/g, " ").indexOf("Scan. Sculpt. Satisfy.") > -1) return hs[i];
      }
      return null;
    }
    function ensure() {
      var heading = findHeading();
      if (!heading || !heading.parentNode) return;
      if (heading.parentNode.querySelector(".ath-hero-badge")) return;
      var text = el("span", { class: "glass-button-text", html: "Now in limited access" });
      var button = el("button", { class: "glass-button", type: "button" }, [text]);
      var shadow = el("div", { class: "glass-button-shadow" });
      var glass = el("div", { class: "glass-button-wrap" }, [button, shadow]);
      var wrap = el("div", { class: "ath-hero-badge" }, [glass]);
      heading.parentNode.insertBefore(wrap, heading);
    }
    ensure();
    // Re-assert briefly in case Framer hydration re-renders the hero and drops it.
    var n = 0, iv = setInterval(function () { ensure(); if (++n > 12) clearInterval(iv); }, 400);
  }

  /* --------------------- remove Framer editor bar ------------------------- */
  /* Framer's runtime injects an "edit content" bar (an iframe to framer.com/edit);
     strip it on load and whenever it tries to re-inject. */
  function killFramerEditBar() {
    function strip() {
      var f = document.querySelectorAll('iframe[src*="framer.com/edit"], iframe[src*="framer.com/_edit"]');
      for (var i = 0; i < f.length; i++) {
        var p = f[i].parentElement;
        f[i].remove();
        if (p && p !== document.body && !p.children.length) p.remove();
      }
    }
    strip();
    try { new MutationObserver(strip).observe(document.documentElement, { childList: true, subtree: true }); } catch (e) {}
  }

  /* --------------------- relabel hero CTA --------------------------------- */
  /* Framer re-renders the hero text from its JS bundle after hydration, which
     overwrites the static "Request Access" edit back to "Get Access"; relabel it
     in the DOM and keep it relabelled if Framer re-renders. */
  function relabelCta() {
    var pending = false;
    function fix() {
      pending = false;
      var ps = document.querySelectorAll("p.framer-text");
      for (var i = 0; i < ps.length; i++) {
        if ((ps[i].textContent || "").trim() === "Get Access") ps[i].textContent = "Request Access";
      }
    }
    fix();
    try {
      new MutationObserver(function () {
        if (pending) return;
        pending = true;
        requestAnimationFrame(fix);
      }).observe(document.body, { childList: true, subtree: true, characterData: true });
    } catch (e) {}
  }

  /* --------------------- animated hero tagline ---------------------------- */
  /* Replaces the Framer subtext ("World's 1st AI-powered ...") with a static
     lead line + a phrase line that cycles with a 3D fly-in. Motion ported from
     the ProgressiveFluxLoader label (framer-motion) to vanilla WAAPI; styling
     mirrors the "Join the waitlist" heading (Satoshi Light, -0.04em, white ->
     #1560bd gradient text). Lead on top, phrase below — both centred. */
  var TAGLINE_LEAD = "3D Simulations that";
  var TAGLINE_PHRASES = [
    "grow bookings by more than 56%.",
    "set you apart.",
    "align expectations.",
    "speed up your consultations by 25%.",
    "build instant trust.",
    "bring in more patients.",
    "need no extra hardware.",
    "make you the obvious choice.",
    "make 56% more patients say yes.",
    "justify your pricing."
  ];

  function buildTagline() {
    var EASE_IN = "cubic-bezier(0.22, 1, 0.36, 1)";
    var EASE_OUT = "cubic-bezier(0.7, 0, 0.84, 0)";
    var BASE_SIZE = 32;   // px target; scaled down so the longest phrase fits one line
    var reduce = false;
    try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

    function findSubtext() {
      var ps = document.querySelectorAll("p.framer-text");
      for (var i = 0; i < ps.length; i++) {
        var t = ps[i].textContent || "";
        if (t.indexOf("AI-powered visual tool") > -1 && t.indexOf("aesthetic doctors") > -1) return ps[i];
      }
      return null;
    }

    function fitSize(p) {
      // One line: scale down (from BASE_SIZE) so the longest full sentence
      // (lead + phrase) fits the column on a single line.
      var probe = el("span", {});
      probe.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap;left:-9999px;top:0;font-weight:400;letter-spacing:-0.04em;font-size:" + BASE_SIZE + "px;";
      p.appendChild(probe);
      var max = 0;
      for (var i = 0; i < TAGLINE_PHRASES.length; i++) {
        probe.textContent = TAGLINE_LEAD + "  " + TAGLINE_PHRASES[i];
        max = Math.max(max, probe.getBoundingClientRect().width);
      }
      p.removeChild(probe);
      var col = p.getBoundingClientRect().width || 600;
      var size = (max > col * 0.98) ? Math.max(14, Math.floor(BASE_SIZE * col * 0.98 / max)) : BASE_SIZE;
      p.style.fontSize = size + "px";
    }

    function spell(phraseEl, text) {
      var out = [];
      for (var i = 0; i < text.length; i++) {
        if (text[i] === " ") { phraseEl.appendChild(document.createTextNode(" ")); continue; }
        var c = el("span", { class: "ath-ch", "aria-hidden": "true" });
        c.textContent = text[i];
        phraseEl.appendChild(c);
        out.push(c);
      }
      return out;
    }

    function cycle(slot, state) {
      var idx = 0;
      var GLIDE_MS = 1000;     // slow, smooth reposition (matches the CSS width transition)
      function widthFor(t) { return (state.widths[t] || slot.offsetWidth || 0); }

      // Sequential: only AFTER the old phrase has fully faded out do we glide the
      // (now empty) line to the next width; only after that glide finishes does the
      // next phrase fly in.
      function advanceTo(nextIdx) {
        state.current = TAGLINE_PHRASES[nextIdx];
        var targetW = widthFor(TAGLINE_PHRASES[nextIdx]);
        var startW = Math.round(slot.getBoundingClientRect().width);
        if (reduce || Math.abs(targetW - startW) < 1) {
          slot.style.width = targetW + "px";
          idx = nextIdx; show();
          return;
        }
        var done = false;
        function finish() { if (done) return; done = true; slot.removeEventListener("transitionend", onEnd); idx = nextIdx; show(); }
        function onEnd(e) { if (!e || e.propertyName === "width") finish(); }
        slot.addEventListener("transitionend", onEnd);
        setTimeout(finish, GLIDE_MS + 150);          // fallback if transitionend is missed
        requestAnimationFrame(function () { slot.style.width = targetW + "px"; });
      }

      function show() {
        if (!slot.isConnected) return;   // Framer replaced the subtext -> stop this now-detached loop
        var text = TAGLINE_PHRASES[idx];
        state.current = text;
        var nextIdx = (idx + 1) % TAGLINE_PHRASES.length;
        var phrase = el("span", { class: "ath-flux__phrase", "aria-label": text });
        var letters = spell(phrase, text);
        slot.appendChild(phrase);

        if (reduce) {
          phrase.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 350, fill: "both" });
          setTimeout(function () {
            phrase.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, fill: "both" }).onfinish = function () {
              if (phrase.parentNode) slot.removeChild(phrase);
              advanceTo(nextIdx);
            };
          }, 4200);
          return;
        }

        phrase.animate([
          { opacity: 0, transform: "translateZ(-380px) scale(0.65)", filter: "blur(14px)" },
          { opacity: 1, transform: "translateZ(60px) scale(1.08)", filter: "blur(0px)", offset: 0.34 },
          { opacity: 1, transform: "translateZ(-8px) scale(0.985)", filter: "blur(0px)", offset: 0.66 },
          { opacity: 1, transform: "translateZ(0px) scale(1)", filter: "blur(0px)" }
        ], { duration: 900, easing: EASE_IN, fill: "both" });

        var lastEnd = 0;
        for (var i = 0; i < letters.length; i++) {
          var delay = 180 + i * 35;
          letters[i].animate([
            { opacity: 0, transform: "translateY(12px)", filter: "blur(8px)" },
            { opacity: 1, transform: "translateY(0px)", filter: "blur(0px)" }
          ], { duration: 450, delay: delay, easing: EASE_IN, fill: "both" });
          lastEnd = delay + 450;
        }

        setTimeout(function () {
          // 1) fully fade/fly the current phrase out, THEN 2) glide, THEN 3) next in.
          phrase.animate([
            { opacity: 1, transform: "translateZ(0px) scale(1)", filter: "blur(0px)" },
            { opacity: 0, transform: "translateZ(220px) scale(1.35)", filter: "blur(10px)" }
          ], { duration: 450, easing: EASE_OUT, fill: "both" }).onfinish = function () {
            if (phrase.parentNode) slot.removeChild(phrase);
            advanceTo(nextIdx);
          };
        }, Math.max(900, lastEnd) + 1400);
      }
      slot.style.width = widthFor(TAGLINE_PHRASES[0]) + "px";
      show();
    }

    function makeFlux(p) {
      p.setAttribute("data-ath-tagline", "1");
      p.textContent = "";
      p.style.fontWeight = "400";          // ~20% thicker than the waitlist's Light 300 (next Satoshi weight)
      p.style.letterSpacing = "-0.04em";
      p.style.lineHeight = "1.3em";
      p.style.marginTop = "-10px";         // nudge the line a touch closer to the headline
      var line = el("span", { class: "ath-line" });
      var lead = el("span", { class: "ath-flux-lead" });
      spell(lead, TAGLINE_LEAD);           // per-letter: the top->bottom gradient is then uniform across the whole sentence
      var slot = el("span", { class: "ath-flux" });
      line.appendChild(lead);
      line.appendChild(slot);
      p.appendChild(line);

      var state = { widths: {}, current: TAGLINE_PHRASES[0] };
      function remeasure() {
        fitSize(p);
        var probe = el("span", {});
        probe.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap;left:-9999px;top:0;";
        slot.appendChild(probe);
        for (var i = 0; i < TAGLINE_PHRASES.length; i++) {
          probe.textContent = TAGLINE_PHRASES[i];
          state.widths[TAGLINE_PHRASES[i]] = Math.ceil(probe.getBoundingClientRect().width);
        }
        slot.removeChild(probe);
        // snap the current slot width to the fresh measurement (no slide on refit)
        var prev = slot.style.transition;
        slot.style.transition = "none";
        slot.style.width = (state.widths[state.current] || 0) + "px";
        void slot.offsetWidth;
        slot.style.transition = prev;
      }
      remeasure();
      cycle(slot, state);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
      var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(remeasure, 200); });
    }

    // findSubtext only matches the original Framer copy ("AI-powered visual tool"),
    // never our widget — so any hit means Framer restored it and we rebuild.
    function ensure() { var p = findSubtext(); if (p) makeFlux(p); }
    ensure();
    var pending = false;
    try {
      new MutationObserver(function () {
        if (pending) return; pending = true;
        requestAnimationFrame(function () { pending = false; ensure(); });
      }).observe(document.body, { childList: true, subtree: true, characterData: true });
    } catch (e) {}
  }

  /* --------------------- hero app screenshot ------------------------------ */
  /* Removes the "About/mission" body-text block (#experience) and drops a framed
     Studio screenshot in its place, right under the hero — its top peeks above
     the fold and the rest reveals on scroll (classic hero shot). */
  function buildHeroShot() {
    var pending = false;
    function ensure() {
      pending = false;
      var about = document.getElementById("experience");
      if (!about) return;
      about.style.display = "none";                 // get rid of the body of text
      var anchor = about.closest('[data-framer-name="Container"]') || about;
      if (!document.querySelector(".ath-heroshot") && anchor.parentNode) {
        var source = el("source", { srcset: "assets/hero-app.webp", type: "image/webp" });
        var img = el("img", { class: "ath-heroshot__img", src: "assets/hero-app.jpg", alt: "Sculptr Studio — 2D consult", decoding: "async" });
        var pic = el("picture", null, [source, img]);
        var frame = el("div", { class: "ath-heroshot__frame" }, [pic]);
        var wrap = el("div", { class: "ath-heroshot" }, [frame]);
        anchor.parentNode.insertBefore(wrap, anchor);
      }
    }
    ensure();
    try {
      new MutationObserver(function () {
        if (pending) return; pending = true; requestAnimationFrame(ensure);
      }).observe(document.body, { childList: true, subtree: true });
    } catch (e) {}
  }

  /* --------------------- shrink + raise hero CTAs ------------------------- */
  /* Make the two hero buttons a touch smaller and nudge them up. Targets the
     lowest common ancestor of the two button links (their shared row). */
  function tweakHeroButtons() {
    function label(txt) {
      var ps = document.querySelectorAll("p.framer-text");
      for (var i = 0; i < ps.length; i++) { if ((ps[i].textContent || "").trim() === txt) return ps[i]; }
      return null;
    }
    function lca(a, b) {
      var chain = []; for (var x = a; x; x = x.parentElement) chain.push(x);
      for (var y = b; y; y = y.parentElement) { if (chain.indexOf(y) > -1) return y; }
      return null;
    }
    var pending = false;
    function ensure() {
      pending = false;
      var fom = label("Find Out More"), ra = label("Request Access");   // first RA in DOM = hero
      if (!fom || !ra) return;
      var fomBtn = fom.closest("a") || fom.parentElement;
      var raBtn = ra.closest("a") || ra.parentElement;
      var row = lca(fomBtn, raBtn);
      if (row && !row.classList.contains("ath-cta-row")) row.classList.add("ath-cta-row");
      // "Find Out More" -> smooth-scroll to the How it works section (capture
      // phase + stopPropagation so it beats Framer's own anchor handler).
      if (fomBtn && fomBtn.getAttribute("data-ath-how") !== "1") {
        fomBtn.setAttribute("data-ath-how", "1");
        fomBtn.addEventListener("click", function (e) {
          e.preventDefault(); e.stopPropagation();
          smoothTo(".ath-how-head");
        }, true);
      }
    }
    ensure();
    try {
      new MutationObserver(function () { if (pending) return; pending = true; requestAnimationFrame(ensure); })
        .observe(document.body, { childList: true, subtree: true });
    } catch (e) {}
  }

  /* --------------------- remove the 5-card scroller ----------------------- */
  /* The "Case Study" section (#case-study) is a horizontally-scrolled row of 5
     cards. It's a self-contained top-level section, so hiding it removes the
     whole thing cleanly. Re-assert in case Framer re-renders it. */
  function removeCaseStudy() {
    var pending = false;
    function ensure() {
      pending = false;
      var cs = document.getElementById("case-study");
      if (cs && cs.style.display !== "none") cs.style.display = "none";
    }
    ensure();
    try {
      new MutationObserver(function () {
        if (pending) return; pending = true; requestAnimationFrame(ensure);
      }).observe(document.body, { childList: true, subtree: true });
    } catch (e) {}
  }

  /* --------------------- logo marquee + progressive blur ------------------ */
  /* Infinite logo strip 100px under the hero screenshot, with the edges blurred
     via a vanilla port of the `motion` ProgressiveBlur component (N stacked
     layers, each a backdrop-filter blur masked to a moving gradient band).
     Placeholder logos for now — swap CONFIG/MARQUEE_LOGOS when reals arrive. */
  var GRADIENT_ANGLES = { top: 0, right: 90, bottom: 180, left: 270 };
  function progressiveBlur(direction, blurLayers, blurIntensity) {
    var angle = GRADIENT_ANGLES[direction];
    var layers = Math.max(blurLayers, 2);
    var seg = 1 / (blurLayers + 1);
    var wrap = el("div", { class: "ath-pblur ath-pblur--" + direction, "aria-hidden": "true" });
    for (var i = 0; i < layers; i++) {
      var stops = [i * seg, (i + 1) * seg, (i + 2) * seg, (i + 3) * seg].map(function (pos, pi) {
        var a = (pi === 1 || pi === 2) ? 1 : 0;
        return "rgba(255, 255, 255, " + a + ") " + (pos * 100) + "%";
      });
      var grad = "linear-gradient(" + angle + "deg, " + stops.join(", ") + ")";
      var lay = el("div", { class: "ath-pblur__layer" });
      lay.style.setProperty("-webkit-mask-image", grad);
      lay.style.setProperty("mask-image", grad);
      lay.style.setProperty("-webkit-backdrop-filter", "blur(" + (i * blurIntensity) + "px)");
      lay.style.setProperty("backdrop-filter", "blur(" + (i * blurIntensity) + "px)");
      wrap.appendChild(lay);
    }
    return wrap;
  }

  // Placeholder brand marks (glyph path in a 0..28 box + wordmark).
  /* Real logos (uploaded to /images). Add more entries here as they arrive. */
  /* Sized by shape, not by file: wide wordmarks sit at the base height, the
     squarer stacked lockups get `mid`, portrait crests get `tall`, and a bare
     wordmark whose glyphs fill the whole box gets `small` — so every mark
     lands at roughly the same optical weight rather than the same height. */
  var MARQUEE_LOGOS = [
    { name: "NHS England", img: "/images/nhs-england.png", mid: true },
    { name: "Queen Mary University of London", img: "/images/qmul_logo-removebg-preview.png" },
    { name: "British College of Aesthetic Medicine", img: "/images/bcam.png" },
    { name: "Barts and The London School of Medicine and Dentistry", img: "/images/Barts_and_The_London_School_of_Medicine_and_Dentistry_coat_of_arms.svg.png", tall: true },
    { name: "Imperial College London", img: "/images/avfqfm9mk-removebg-preview.png" },
    { name: "The Royal London Hospital", img: "/images/royal-london.svg", mid: true },
    { name: "BLAPRAS", img: "/images/blapras.png", tall: true },
    { name: "ACE", img: "/images/ace.png", small: true },
    { name: "Web Summit", img: "/images/Web_Summit_logo.svg.png" }
  ];

  function buildLogoMarquee() {
    function logoNode(l) {
      var tier = l.tall ? " ath-logo__img--tall" : l.mid ? " ath-logo__img--mid" : l.small ? " ath-logo__img--small" : "";
      var img = el("img", { class: "ath-logo__img" + tier,
        src: l.img, alt: l.name, loading: "lazy", draggable: "false" });
      return el("div", { class: "ath-logo" }, [img]);
    }
    function makeLogos() {
      // Repeat the set enough times that ONE group is wider than the viewport,
      // otherwise the marquee scrolls past the few logos and leaves an empty
      // gap each loop (the "logos disappear" bug). ~8+ items per group fills it.
      var per = MARQUEE_LOGOS.length;
      var reps = Math.max(1, Math.ceil(8 / per));
      var nodes = [];
      for (var r = 0; r < reps; r++) for (var i = 0; i < per; i++) nodes.push(logoNode(MARQUEE_LOGOS[i]));
      return nodes;
    }
    function build() {
      // Framer re-renders #main on hydration and strips nodes it doesn't own,
      // so (like the hero shot) we re-assert whenever it's missing.
      if (document.querySelector(".ath-logos")) return;
      var hero = document.querySelector(".ath-heroshot");
      if (!hero || !hero.parentNode) return;
      var g1 = el("div", { class: "ath-logos__group" }, makeLogos());
      var g2 = el("div", { class: "ath-logos__group", "aria-hidden": "true" }, makeLogos());
      var track = el("div", { class: "ath-logos__track" }, [g1, g2]);
      var vp = el("div", { class: "ath-logos__viewport" },
        [track, progressiveBlur("left", 8, 0.7), progressiveBlur("right", 8, 0.7)]);
      // Same treatment as the ROI calculator's heading — Satoshi 500, tight
      // tracking, the 161deg white-to-blue gradient clipped to the glyphs.
      var head = el("h2", { class: "ath-logos__title", html: "Trusted by" });
      var sec = el("div", { class: "ath-logos", "aria-label": "Trusted by" }, [head, vp]);
      hero.parentNode.insertBefore(sec, hero.nextSibling);
      // The keyframe travels -50% of the track, so a fixed duration means the
      // belt speeds up every time a logo is added. Set it from the measured
      // width instead and the pace stays put however long the list gets.
      // Observed rather than measured once: the logos are lazy, so the group
      // is still narrow on the first frame and only reaches full width as they
      // arrive — and the clamp()ed heights change it again on resize.
      function pace() {
        var w = g1.getBoundingClientRect().width;
        if (w > 100) track.style.animationDuration = Math.round(w / 35) + "s";   // ~35px/s
      }
      try { new ResizeObserver(pace).observe(g1); } catch (e) { window.addEventListener("resize", pace); }
      pace();
    }
    var pending = false;
    build();
    try {
      new MutationObserver(function () {
        if (pending) return; pending = true;
        requestAnimationFrame(function () { pending = false; build(); });
      }).observe(document.body, { childList: true, subtree: true });
    } catch (e) {}
  }

  /* --------------------- "How it works" header + captions ----------------- */
  /* The Framer template already has the 3-icon composition (scan / sculpt /
     satisfy) with a single caption line under each icon. Leave that composition
     EXACTLY as-is; only (a) add a header above it and (b) rewrite the three
     caption lines into a title + subtitle. Re-assert against Framer re-renders.
     Captions are matched by unique substrings so the (hidden) About copy that
     also mentions "simulations" is never touched. */
  var HOW_CAPS = [
    { match: "3D facial scanning", num: "01", title: "Scan",    sub: "A few photos. Any Phone." },
    { match: "facial editing",     num: "02", title: "Sculpt",  sub: "Full 3D control.", cls: "ath-cap--nudge" },
    { match: "visual simulations", num: "03", title: "Satisfy", sub: "Align expectations. Convert." }
  ];
  function buildHowItWorks() {
    function topLevelOf(node) {
      var root = document.querySelector("[data-framer-root]");
      if (!root) return null;
      var n = node;
      while (n && n.parentElement && n.parentElement !== root) n = n.parentElement;
      return (n && n.parentElement === root) ? n : null;
    }
    function applyCaptions() {
      var ps = document.querySelectorAll("p.framer-text");
      for (var i = 0; i < ps.length; i++) {
        var t = ps[i].textContent || "";
        for (var j = 0; j < HOW_CAPS.length; j++) {
          if (t.indexOf(HOW_CAPS[j].match) > -1) {
            var ex = HOW_CAPS[j].cls ? " " + HOW_CAPS[j].cls : "";
            ps[i].innerHTML = '<span class="ath-step-num' + ex + '">' + HOW_CAPS[j].num + "</span>" +
              '<span class="ath-cap-t' + ex + '">' + HOW_CAPS[j].title +
              '</span><span class="ath-cap-s' + ex + '">' + HOW_CAPS[j].sub + "</span>";
            break;
          }
        }
      }
    }

    function applyHeader() {
      if (document.querySelector(".ath-how-head")) return;
      var img = document.querySelector('img[src*="CSV76ZOoyv72"]');
      var anchor = img ? topLevelOf(img) : null;
      if (!anchor || !anchor.parentNode) return;
      var head = el("div", { class: "ath-how-head" }, [
        el("p", { class: "ath-how-eyebrow", html: "HOW IT WORKS" }),
        el("h2", { class: "ath-how-title", html: "Three steps. One consultation." })
      ]);
      anchor.parentNode.insertBefore(head, anchor);
    }
    function run() { applyCaptions(); applyHeader(); }
    run();
    var pending = false;
    try {
      new MutationObserver(function () {
        if (pending) return; pending = true;
        requestAnimationFrame(function () { pending = false; run(); });
      }).observe(document.body, { childList: true, subtree: true });
    } catch (e) {}
  }

  /* --------------------- "Why clinics switch" stats section --------------- */
  /* A premium light-theme proof section with frosted glass panels (styling
     derived from the style-lab glass button). Inserted before the waitlist.
     Bars/columns animate in on scroll. Re-assert against Framer re-renders. */
  function buildStatsSection() {
    function topLevelOf(node) {
      var root = document.querySelector("[data-framer-root]");
      if (!root) return null;
      var n = node;
      while (n && n.parentElement && n.parentElement !== root) n = n.parentElement;
      return (n && n.parentElement === root) ? n : null;
    }
    /* a 270deg gauge dial of tick marks (mashed from the reactor-knob dial, in
       brand blue). 41 ticks span -135 to +135; each lit tick ~= one minute. */
    var DIAL_TICKS = 60;          // full circle, one tick per minute
    function dialSVG() {
      var parts = [
        '<svg class="ath-dial" viewBox="0 0 168 168" fill="none" xmlns="http://www.w3.org/2000/svg">',
        '<defs><linearGradient id="athDialG" gradientUnits="userSpaceOnUse" x1="34" y1="28" x2="134" y2="134"><stop offset="0" stop-color="#3a93f2"/><stop offset="1" stop-color="#1560bd"/></linearGradient></defs>'
      ];
      for (var i = 0; i < DIAL_TICKS; i++) {
        var ang = i * (360 / DIAL_TICKS);
        parts.push('<line class="ath-dial-tick" x1="84" y1="11" x2="84" y2="19" transform="rotate(' + ang.toFixed(1) + ' 84 84)"/>');
      }
      parts.push('</svg>');
      return parts.join("");
    }
    var HTML = [
      '<div class="ath-stats__card">',
        '<h2 class="ath-stats__title">Why clinics switch</h2>',

        '<div class="ath-stats__hero-stat">',
          '<span class="ath-stats__big ath-count" data-to="83.5" data-dec="1" data-suffix="%">83.5%</span>',
          '<span class="ath-stats__big-label">consultation-to-treatment conversion</span>',
        '</div>',
        '<p class="ath-stats__hero-sub">vs 30–40% industry benchmark · <span class="ath-stats__accent">~2.3× higher</span></p>',

        '<div class="ath-stats__bars">',
          '<div class="ath-stats__bar-row">',
            '<span class="ath-stats__bar-name">3D Simulation</span>',
            '<span class="ath-stats__bar-track"><span class="ath-stats__bar-fill ath-stats__bar-fill--brand" style="--w:83.5%"></span></span>',
            '<span class="ath-stats__bar-val ath-stats__accent ath-count" data-to="83.5" data-dec="1" data-suffix="%">83.5%</span>',
          '</div>',
          '<div class="ath-stats__bar-row">',
            '<span class="ath-stats__bar-name ath-stats__muted">Industry</span>',
            '<span class="ath-stats__bar-track"><span class="ath-stats__bar-fill ath-stats__bar-fill--muted" style="--w:35%"></span></span>',
            '<span class="ath-stats__bar-val ath-stats__muted ath-count" data-to="35" data-dec="0" data-prefix="~" data-suffix="%">~35%</span>',
          '</div>',
        '</div>',

        '<div class="ath-stats__grid">',
          '<div class="ath-stat-panel ath-stats__panel--tall">',
            '<div class="ath-stats__chart">',
              '<div class="ath-stats__col">',
                '<span class="ath-stats__col-cap">3D Simulation</span>',
                '<div class="ath-stats__col-bar ath-stats__col-bar--brand" style="--h:99%"><span class="ath-stats__col-val"><span class="ath-count" data-to="99" data-dec="0">99</span><small>%</small></span></div>',
              '</div>',
              '<div class="ath-stats__col">',
                '<span class="ath-stats__col-cap ath-stats__muted">Standard</span>',
                '<div class="ath-stats__col-bar ath-stats__col-bar--muted" style="--h:80%"><span class="ath-stats__col-val"><span class="ath-count" data-to="80" data-dec="0">80</span><small>%</small></span></div>',
              '</div>',
            '</div>',
            '<div class="ath-stats__panel-foot">',
              '<p class="ath-stats__panel-title">Post-treatment satisfaction</p>',
            '</div>',
          '</div>',
          '<div class="ath-stat-panel ath-stats__panel--tall ath-stats__panel--time">',
            '<div class="ath-time-illo" aria-hidden="true">',
              dialSVG(),
            '</div>',
            '<span class="ath-stats__panel-num ath-count" data-to="25" data-dec="0" data-suffix="%">25%</span>',
            '<p class="ath-stats__panel-title">shorter consultations</p>',
            '<p class="ath-stats__panel-sub">More patients, less chair time.</p>',
          '</div>',
        '</div>',
      '</div>'
    ].join("");

    /* Number counter — replicates the style-lab progress-bar number flow:
       the value springs up from 0 with NumberFlow's exact transform easing
       (a piecewise-linear ease-out), synced to the bars' 3s rise. */
    var EASE_T = [0,0.008,0.0239,0.0477,0.1512,0.18304,0.21488,0.24672,0.27856,0.3104,0.35015,0.3899,0.4377,0.4934,0.5571,0.6287,0.7162,0.8276,0.9947,1];
    var EASE_V = [0,0.0033,0.0263,0.0896,0.4676,0.5688,0.6553,0.7274,0.7862,0.8336,0.8793,0.9132,0.9421,0.9642,0.9796,0.9893,0.9952,0.9983,0.9996,1];
    function springEase(t) {
      if (t <= 0) return 0; if (t >= 1) return 1;
      for (var i = 1; i < EASE_T.length; i++) {
        if (t <= EASE_T[i]) {
          var t0 = EASE_T[i-1], t1 = EASE_T[i];
          return EASE_V[i-1] + (EASE_V[i] - EASE_V[i-1]) * ((t - t0) / (t1 - t0));
        }
      }
      return 1;
    }
    function fmt(el, v) {
      var dec = parseInt(el.getAttribute("data-dec"), 10) || 0;
      return (el.getAttribute("data-prefix") || "") + v.toFixed(dec) + (el.getAttribute("data-suffix") || "");
    }
    function countUp(el, dur) {
      var to = parseFloat(el.getAttribute("data-to")) || 0;
      var from = parseFloat(el.getAttribute("data-from")) || 0;
      var start = null;
      function frame(ts) {
        if (start == null) start = ts;
        var t = Math.min(1, (ts - start) / dur);
        el.textContent = fmt(el, t >= 1 ? to : from + (to - from) * springEase(t));
        if (t < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
    /* gauge dial: light the first `value` ticks (each tick ~= one minute).
       On scroll it winds from 30 down to 15 — the consultation getting shorter. */
    var DIAL_FROM = 30, DIAL_TO = 16;
    function setDial(dial, value) {
      var ticks = dial.querySelectorAll(".ath-dial-tick"), lit = Math.round(value);
      for (var i = 0; i < ticks.length; i++) {
        if (i < lit) ticks[i].classList.add("is-on"); else ticks[i].classList.remove("is-on");
      }
    }
    function animateDial(dial, dur) {
      var start = null;
      function frame(ts) {
        if (start == null) start = ts;
        var t = Math.min(1, (ts - start) / dur);
        setDial(dial, DIAL_FROM + (DIAL_TO - DIAL_FROM) * springEase(t));
        if (t < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
    function prefersReduced() {
      try { return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
      catch (e) { return false; }
    }
    var DUR = 2000;
    function reveal(sec) {
      var dial = sec.querySelector(".ath-dial");
      var allCounts = sec.querySelectorAll(".ath-count");
      // three groups, animated one after another: top -> bottom-left -> bottom-right
      var topCounts = sec.querySelectorAll(".ath-stats__big.ath-count, .ath-stats__bar-val.ath-count");
      var leftCounts = sec.querySelectorAll(".ath-stats__panel--tall:not(.ath-stats__panel--time) .ath-count");
      var rightCounts = sec.querySelectorAll(".ath-stats__panel--time .ath-count");
      // reduced motion: snap everything to final, no animation
      if (prefersReduced()) {
        sec.classList.add("run-top"); sec.classList.add("run-left"); sec.classList.add("run-right");
        if (dial) setDial(dial, DIAL_TO);
        return;
      }
      for (var i = 0; i < allCounts.length; i++) allCounts[i].textContent = fmt(allCounts[i], parseFloat(allCounts[i].getAttribute("data-from")) || 0);
      if (dial) setDial(dial, DIAL_FROM);                       // dial pre-armed at 30 (half)
      function run(list) { for (var n = 0; n < list.length; n++) countUp(list[n], DUR); }
      var fired = false;
      function go() {
        if (fired) return; fired = true;
        sec.classList.add("run-top"); run(topCounts);            // 1) hero + progress bars
        setTimeout(function () {
          sec.classList.add("run-left"); run(leftCounts);        // 2) satisfaction chart
          setTimeout(function () {
            sec.classList.add("run-right"); run(rightCounts);    // 3) dial card
            if (dial) animateDial(dial, DUR);
          }, DUR);
        }, DUR);
      }
      try {
        var io = new IntersectionObserver(function (entries) {
          for (var k = 0; k < entries.length; k++) {
            if (entries[k].isIntersecting) { io.disconnect(); go(); break; }
          }
        }, { threshold: 0, rootMargin: "0px 0px -35% 0px" }); // fire once well into view, not on first peek
        io.observe(sec);
      } catch (e) { go(); }
    }
    function build() {
      if (document.querySelector(".ath-stats")) return;
      var wl = document.getElementById("waitlist");
      var anchor = wl ? topLevelOf(wl) : null;
      if (!anchor || !anchor.parentNode) return;
      var sec = el("section", { class: "ath-stats", "aria-label": "Why clinics switch" });
      sec.innerHTML = HTML;
      anchor.parentNode.insertBefore(sec, anchor);
      reveal(sec);
    }
    var pending = false;
    build();
    try {
      new MutationObserver(function () {
        if (pending) return; pending = true;
        requestAnimationFrame(function () { pending = false; build(); });
      }).observe(document.body, { childList: true, subtree: true });
    } catch (e) {}
  }

  /* --------- ROI calculator (sits directly under "Why clinics switch") ------
     Paired slider + number inputs (editing either updates both); three live
     outputs rendered in the same gradient number style as the traction strip,
     counting up on reveal and chasing the value as you drag. Formulas per the
     3D-Simulation ROI spec. */
  function buildCalculator() {
    function onView(node, cb) {
      try {
        var io = new IntersectionObserver(function (es) {
          for (var i = 0; i < es.length; i++) { if (es[i].isIntersecting) { io.disconnect(); cb(); break; } }
        }, { threshold: 0, rootMargin: "0px 0px -12% 0px" });
        io.observe(node);
      } catch (e) { cb(); }
    }
    function reduced() {
      try { return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
    }
    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
    function money(v) { return (v < 0 ? "-£" : "£") + Math.round(Math.abs(v)).toLocaleString("en-GB"); }

    var INPUTS = [
      { id: "consultations", label: "Monthly consultations", min: 0, max: 100, step: 1, def: 40, unit: "" },
      { id: "current", label: "Current consult-to-treatment ratio", min: 0, max: 100, step: 1, def: 36, unit: "%" },
      { id: "expected", label: "Expected ratio with 3D Simulation", min: 0, max: 100, step: 1, def: 86, unit: "%", hint: "Avg. 3D Simulation 86% · Standard 36%" },
      { id: "price", label: "Average price per procedure", min: 0, max: 10000, step: 0.01, def: 1000, unit: "£", prefix: true }
    ];

    function compute(s) {
      return { conversion: s.consultations * 12 * ((s.expected - s.current) / 100) * s.price };
    }

    function rowHTML(i) {
      var pre = i.prefix && i.unit ? '<span class="ath-calc__unit">' + i.unit + '</span>' : '';
      var suf = !i.prefix && i.unit ? '<span class="ath-calc__unit">' + i.unit + '</span>' : '';
      return '<div class="ath-calc__row">'
        + '<label class="ath-calc__label" for="cal-' + i.id + '">' + i.label
          + (i.hint ? ' <span class="ath-calc__hint">' + i.hint + '</span>' : '') + '</label>'
        + '<div class="ath-calc__control">'
          + '<input class="ath-calc__range" type="range" id="cal-' + i.id + '" min="' + i.min + '" max="' + i.max + '" step="' + i.step + '" value="' + i.def + '" aria-label="' + i.label + '">'
          + '<div class="ath-calc__field">' + pre
            + '<input class="ath-calc__num" type="number" inputmode="decimal" min="' + i.min + '" max="' + i.max + '" step="' + i.step + '" value="' + i.def + '" data-id="' + i.id + '" aria-label="' + i.label + '">'
            + suf + '</div>'
        + '</div>'
      + '</div>';
    }
    var rowsHTML = "";
    for (var ri = 0; ri < INPUTS.length; ri++) rowsHTML += rowHTML(INPUTS[ri]);
    var HTML = '<div class="ath-calc__card">'
      + '<div class="ath-calc__head">'
        + '<p class="ath-calc__eyebrow">ROI calculator</p>'
        + '<h2 class="ath-calc__title">See what 3D Simulation could add</h2>'
        + '<p class="ath-calc__sub">Adjust the sliders to estimate your clinic’s projected return.</p>'
      + '</div>'
      + '<div class="ath-calc__grid">' + rowsHTML + '</div>'
      + '<div class="ath-calc__outputs ath-counts">'
        + '<div class="ath-counts__item"><div class="ath-num" id="cal-out-conv">$0</div><p class="ath-counts__label">Expected yearly income increase</p></div>'
      + '</div>'
    + '</div>';

    /* Phones: the output is gradient text (background-clip:text); writing its text
       AND a blur() filter every frame re-rasters the clipped gradient through a
       Gaussian 60x/s — a GPU spike that contributed to the mid-scroll tab crash.
       On phones: no blur chase, solid colour while counting, ~20fps writes. */
    var CHASE_PHONE = false;
    try { CHASE_PHONE = window.matchMedia && window.matchMedia("(max-width: 860px)").matches; } catch (e) {}
    /* Smooth, cheap counter. Three things keep it fluid WITHOUT extra load:
       (1) time-based easing, so it is frame-rate independent — a dropped frame
           or a 120Hz screen no longer changes the speed or stutters (the old
           `cur += d * 0.18` advanced per FRAME, and on phones it also ran off
           the deliberately-slowed particle clock);
       (2) RAF0 — the real, unscaled rAF, same as our other counters;
       (3) the DOM is touched only when the rendered string actually CHANGES —
           money() rounds to whole pounds, so no-op writes are skipped for free.
       Cost, measured on a phone profile: 70 writes / 70 visually distinct steps
       vs the old 27 writes / 26 steps — ~2.6x more writes, but each is a plain
       text swap on one small inline element. Phones count in solid colour
       (.is-counting, no gradient re-raster), never get the blur filter, and
       .ath-num keeps will-change:auto, so nothing here promotes a layer or
       allocates GPU memory. It is bounded too: ~1s per interaction, not a
       per-scroll-frame cost. */
    var CHASE_K = 12;   // easing rate /s (matches the old 0.18-per-frame feel at 60fps)
    function chaser(node) {
      var cur = 0, target = 0, raf = null, last = 0, shown = null;
      /* Mutate the existing text node in place rather than reassigning
         textContent: textContent discards the old Text node and allocates a new
         one every update, which piles up collectable garbage during a drag.
         nodeValue writes into the node that is already there — zero allocation. */
      function put(v) {
        var s = money(v);
        if (s === shown) return;
        shown = s;
        var t = node.firstChild;
        if (t && t.nodeType === 3) t.nodeValue = s; else node.textContent = s;
      }
      function tick(ts) {
        var dt = last ? Math.min((ts - last) / 1000, 0.05) : 1 / 60;   // clamp tab-switch gaps
        last = ts;
        var d = target - cur;
        if (Math.abs(d) < 0.5) {
          cur = target; put(cur); node.style.filter = "";
          node.classList.remove("is-counting"); raf = null; last = 0; return;
        }
        cur += d * (1 - Math.exp(-CHASE_K * dt));
        put(cur);
        if (!CHASE_PHONE) {
          var rem = Math.abs(target - cur) / (Math.abs(target) || 1);
          node.style.filter = "blur(" + Math.min(5, rem * 45).toFixed(2) + "px)";
        }
        raf = RAF0(tick);
      }
      return {
        set: function (v) {
          target = v;
          if (reduced()) { cur = v; put(v); node.style.filter = ""; node.classList.remove("is-counting"); if (raf) { cancelAnimationFrame(raf); raf = null; } last = 0; return; }
          if (raf == null) { if (CHASE_PHONE) node.classList.add("is-counting"); last = 0; raf = RAF0(tick); }
        }
      };
    }

    function wire(sec) {
      var card = sec.querySelector(".ath-calc__card");
      var state = {}; for (var k = 0; k < INPUTS.length; k++) state[INPUTS[k].id] = INPUTS[k].def;
      var ranges = {}, nums = {};
      for (var j = 0; j < INPUTS.length; j++) {
        ranges[INPUTS[j].id] = card.querySelector("#cal-" + INPUTS[j].id);
        nums[INPUTS[j].id] = card.querySelector('.ath-calc__num[data-id="' + INPUTS[j].id + '"]');
      }
      var outConv = chaser(card.querySelector("#cal-out-conv"));
      var revealed = false;

      function fill(i) { var p = ((state[i.id] - i.min) / (i.max - i.min)) * 100; ranges[i.id].style.setProperty("--p", p.toFixed(2) + "%"); }
      function refresh() {
        if (revealed) outConv.set(compute(state).conversion);
      }
      function apply(i, v, src) {
        v = clamp(v, i.min, i.max); state[i.id] = v;
        if (src !== "range") ranges[i.id].value = v;
        if (src !== "num") nums[i.id].value = v;
        fill(i); refresh();
      }
      for (var m = 0; m < INPUTS.length; m++) {
        (function (i) {
          fill(i);
          ranges[i.id].addEventListener("input", function () { apply(i, parseFloat(ranges[i.id].value), "range"); });
          nums[i.id].addEventListener("input", function () { var raw = nums[i.id].value; if (raw === "") return; var v = parseFloat(raw); if (!isNaN(v)) apply(i, v, "num"); });
          nums[i.id].addEventListener("blur", function () { var v = parseFloat(nums[i.id].value); if (isNaN(v)) v = state[i.id]; apply(i, v, "blur"); });
        })(INPUTS[m]);
      }
      onView(card.querySelector(".ath-calc__outputs"), function () {
        revealed = true; outConv.set(compute(state).conversion);
      });
    }

    function build() {
      if (document.querySelector(".ath-calc")) return;
      var stats = document.querySelector(".ath-stats");
      if (!stats || !stats.parentNode) return;     // wait until "Why clinics switch" exists
      var sec = el("section", { class: "ath-calc", "aria-label": "3D Simulation ROI calculator" });
      sec.innerHTML = HTML;
      stats.parentNode.insertBefore(sec, stats.nextSibling);   // directly under the stats card
      wire(sec);
    }
    var pending = false;
    build();
    try {
      new MutationObserver(function () {
        if (pending) return; pending = true;
        requestAnimationFrame(function () { pending = false; build(); });
      }).observe(document.body, { childList: true, subtree: true });
    } catch (e) {}
  }

  /* --------- below the waitlist: testimonials + traction + team -----------
     Re-implemented in vanilla JS/CSS from the provided React components,
     brand-matched. NOTE: all people / quotes / figures below are PLACEHOLDER
     content (licensed stock + neutral avatars — NOT real LinkedIn photos);
     swap for real testimonials, traction numbers and team when available. */
  function buildBelowWaitlist() {
    function topLevelOf(node) {
      var root = document.querySelector("[data-framer-root]");
      if (!root) return null;
      var n = node;
      while (n && n.parentElement && n.parentElement !== root) n = n.parentElement;
      return (n && n.parentElement === root) ? n : null;
    }
    function reduced() {
      try { return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
      catch (e) { return false; }
    }
    function onView(node, cb, opts) {
      try {
        var io = new IntersectionObserver(function (es) {
          for (var i = 0; i < es.length; i++) { if (es[i].isIntersecting) { io.disconnect(); cb(); break; } }
        }, opts || { threshold: 0, rootMargin: "0px 0px -18% 0px" });
        io.observe(node);
      } catch (e) { cb(); }
    }
    function esc(s) {
      return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    var TM = [
      { q: "Sculptr changed the consultation completely. Patients see themselves, not someone else\u2019s before and after. Conversion followed almost immediately.",
        a: "Dr. Ahdie Pooladi, MD", r: "15 years experience in Aesthetic medicine \u2014 Leeds",
        img: "/images/testimonials/pooladi.webp" },
      { q: "Before Sculptr I relied on stock photos and hand mirrors, which never really landed. Now the patient sees a simulation of their own face and the conversation shifts from convincing to planning. Our treatment plan sign-off rate has climbed noticeably.",
        a: "Dr. Karla Diaz, MD", r: "Award winning doctor \u2014 London",
        img: "/images/testimonials/diaz.webp" },
      { q: "We already had a 3D scanner in the clinic. Sculptr gives better quality simulations, it is far easier to work with, and all three of our doctors can use it at once. The scanner sits idle now.",
        a: "Dr. Haidar Hassan, DDS MSc", r: "Clinical Senior Lecturer and Aesthetic Doctor \u2014 London",
        img: "/images/testimonials/hassan.webp" }
    ];
    var COUNTS = [
      { to: 40, dec: 0, suffix: "+", group: false, label: "clinics onboarded" },
      { to: 12000, dec: 0, suffix: "+", group: true, label: "3D scans created" },
      { to: 9, dec: 0, suffix: "", group: false, label: "countries" }
    ];
    var TEAM = [
      { n: "Alex Morgan", role: "Founder & CEO", img: "https://i.pravatar.cc/320?img=12", s: { x: "#", li: "#" } },
      { n: "Priya Nair", role: "Clinical Lead", img: "https://i.pravatar.cc/320?img=5", s: { li: "#" } },
      { n: "Daniel Reyes", role: "Head of Engineering", img: "https://i.pravatar.cc/320?img=33", s: { x: "#", li: "#" } },
      { n: "Sofia Bauer", role: "Product Design", img: "https://i.pravatar.cc/320?img=20", s: { li: "#", ig: "#" } },
      { n: "Marcus Lee", role: "ML / 3D Pipeline", img: "https://i.pravatar.cc/320?img=14", s: { li: "#" } },
      { n: "Hana Ito", role: "Customer Success", img: "https://i.pravatar.cc/320?img=47", s: { ig: "#" } }
    ];
    var IC = {
      li: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>',
      x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.68l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64z"/></svg>',
      ig: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.43.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.43.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.16-.43-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.43-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.72-2.12 1.38C1.35 2.67.94 3.34.63 4.13.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.38 2.12.66.66 1.33 1.08 2.12 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.88 5.88 0 0 0 2.12-1.38 5.88 5.88 0 0 0 1.38-2.12c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.88 5.88 0 0 0-1.38-2.12A5.88 5.88 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.41-10.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z"/></svg>'
    };

    function tmHTML() {
      /* staggered 3-column photo cluster (team-style): distribute the 6 authors
         across columns by i%3 so the top row reads 0,1,2 and the bottom row 3,4,5. */
      function col(mod) {
        var cells = "";
        for (var i = mod; i < TM.length; i += 3) {
          var t = TM[i];
          cells += '<button type="button" class="ath-tm__card' + (i === 0 ? ' is-active' : ' is-dim') + '" data-i="' + i + '" aria-label="' + esc(t.a) + '">'
            + '<img class="ath-tm__card-img" src="' + t.img + '" alt="' + esc(t.a) + '" loading="lazy" draggable="false">'
            + '</button>';
        }
        return '<div class="ath-tm__col ath-tm__col--' + (mod + 1) + '">' + cells + '</div>';
      }
      return '<div class="ath-tm" data-anim="up">'
        + '<div class="ath-tm__quote-wrap">'
          /* the marks live in a box that hugs the text, not the reserved space,
             so they follow the quote's length instead of floating off it */
          + '<div class="ath-tm__quote-box">'
            + '<span class="ath-tm__mark ath-tm__mark--l" aria-hidden="true">“</span>'
            + '<p class="ath-tm__quote">' + esc(TM[0].q) + '</p>'
            + '<span class="ath-tm__mark ath-tm__mark--r" aria-hidden="true">”</span>'
          + '</div>'
        + '</div>'
        + '<p class="ath-tm__attrib"><span class="ath-tm__name">' + esc(TM[0].a) + '</span><span class="ath-tm__role">' + esc(TM[0].r) + '</span></p>'
        + '<div class="ath-tm__canvas">' + col(0) + col(1) + col(2) + '</div>'
      + '</div>';
    }

    function countsHTML() {
      var items = "";
      for (var i = 0; i < COUNTS.length; i++) {
        var c = COUNTS[i];
        items += (i ? '<span class="ath-counts__div" aria-hidden="true"></span>' : '')
          + '<div class="ath-counts__item">'
            + '<div class="ath-num" data-to="' + c.to + '" data-dec="' + c.dec + '" data-suffix="' + c.suffix + '" data-group="' + (c.group ? 1 : 0) + '">0' + c.suffix + '</div>'
            + '<p class="ath-counts__label">' + esc(c.label) + '</p>'
          + '</div>';
      }
      return '<div class="ath-counts" data-anim="up">' + items + '</div>';
    }

    function socialHTML(s) {
      if (!s) return "";
      var out = "";
      if (s.x) out += '<a class="ath-team__ic" href="' + s.x + '" target="_blank" rel="noopener noreferrer" title="X / Twitter" aria-label="X / Twitter">' + IC.x + '</a>';
      if (s.li) out += '<a class="ath-team__ic" href="' + s.li + '" target="_blank" rel="noopener noreferrer" title="LinkedIn" aria-label="LinkedIn">' + IC.li + '</a>';
      if (s.ig) out += '<a class="ath-team__ic" href="' + s.ig + '" target="_blank" rel="noopener noreferrer" title="Instagram" aria-label="Instagram">' + IC.ig + '</a>';
      return out;
    }

    function teamHTML() {
      function col(mod) {
        var cells = "";
        for (var i = mod; i < TEAM.length; i += 3) {
          var m = TEAM[i];
          cells += '<div class="ath-team__card" data-id="' + i + '"><img src="' + m.img + '" alt="' + esc(m.n) + '" loading="lazy"></div>';
        }
        return '<div class="ath-team__col ath-team__col--' + (mod + 1) + '">' + cells + '</div>';
      }
      var rows = "";
      for (var i = 0; i < TEAM.length; i++) {
        var m = TEAM[i], soc = socialHTML(m.s);
        rows += '<div class="ath-team__row" data-id="' + i + '">'
          + '<div class="ath-team__nameline">'
            + '<span class="ath-team__dot" aria-hidden="true"></span>'
            + '<span class="ath-team__name">' + esc(m.n) + '</span>'
            + (soc ? '<span class="ath-team__social">' + soc + '</span>' : '')
          + '</div>'
          + '<p class="ath-team__role">' + esc(m.role) + '</p>'
        + '</div>';
      }
      return '<div class="ath-team" data-anim="up">'
        + '<div class="ath-team__head">'
          + '<p class="ath-team__eyebrow">The team</p>'
          + '<h2 class="ath-team__title">The people behind Sculptr</h2>'
        + '</div>'
        + '<div class="ath-team__body">'
          + '<div class="ath-team__grid">' + col(0) + col(1) + col(2) + '</div>'
          + '<div class="ath-team__list">' + rows + '</div>'
        + '</div>'
      + '</div>';
    }

    /* Traction strip (clinics / scans / countries): preview and local only.
       Opt-IN rather than opt-out, so a new production domain never starts
       showing unverified numbers by accident — the live site has to be added
       here deliberately, not merely forgotten. */
    var SHOW_COUNTS = (function () {
      var h = location.hostname;
      return /\.vercel\.app$/.test(h) || h === "localhost" || h === "127.0.0.1" || h === "";
    })();
    var HTML = tmHTML() + (SHOW_COUNTS ? countsHTML() : "");

    /* ---- CommitsGrid (vanilla port): a GitHub-contributions-style board that
       spells a word; letter cells light up (draw in) on reveal, ambient cells
       twinkle. Light mode, brand-blue palette (not the original GitHub greens). */
    var CG_LETTERS = {
      A: [1,2,3,50,100,150,200,250,300,54,104,154,204,254,304,151,152,153],
      B: [0,1,2,3,4,50,100,150,151,200,250,300,301,302,303,304,54,104,152,153,204,254,303],
      C: [0,1,2,3,4,50,100,150,200,250,300,301,302,303,304],
      D: [0,1,2,3,50,100,150,200,250,300,301,302,54,104,154,204,254,303],
      E: [0,1,2,3,4,50,100,150,200,250,300,301,302,303,304,151,152],
      F: [0,1,2,3,4,50,100,150,200,250,300,151,152,153],
      G: [0,1,2,3,4,50,100,150,200,250,300,301,302,303,153,204,154,304,254],
      H: [0,50,100,150,200,250,300,151,152,153,4,54,104,154,204,254,304],
      I: [0,1,2,3,4,52,102,152,202,252,300,301,302,303,304],
      J: [0,1,2,3,4,52,102,152,202,250,252,302,300,301],
      K: [0,4,50,100,150,200,250,300,151,152,103,54,203,254,304],
      L: [0,50,100,150,200,250,300,301,302,303,304],
      M: [0,50,100,150,200,250,300,51,102,53,4,54,104,154,204,254,304],
      N: [0,50,100,150,200,250,300,51,102,153,204,4,54,104,154,204,254,304],
      "Ñ": [0,50,100,150,200,250,300,51,102,153,204,4,54,104,154,204,254,304],
      O: [1,2,3,50,100,150,200,250,301,302,303,54,104,154,204,254],
      P: [0,50,100,150,200,250,300,1,2,3,54,104,151,152,153],
      Q: [1,2,3,50,100,150,200,250,301,302,54,104,154,204,202,253,304],
      R: [0,50,100,150,200,250,300,1,2,3,54,104,151,152,153,204,254,304],
      S: [1,2,3,4,50,100,151,152,153,204,254,300,301,302,303],
      T: [0,1,2,3,4,52,102,152,202,252,302],
      U: [0,50,100,150,200,250,301,302,303,4,54,104,154,204,254],
      V: [0,50,100,150,200,251,302,4,54,104,154,204,253],
      W: [0,50,100,150,200,250,301,152,202,252,4,54,104,154,204,254,303],
      X: [0,50,203,254,304,4,54,152,101,103,201,250,300],
      Y: [0,50,101,152,202,252,302,4,54,103],
      Z: [0,1,2,3,4,54,103,152,201,250,300,301,302,303,304],
      "0": [1,2,3,50,100,150,200,250,301,302,303,54,104,154,204,254],
      "1": [1,52,102,152,202,252,302,0,2,300,301,302,303,304],
      "2": [0,1,2,3,54,104,152,153,201,250,300,301,302,303,304],
      "3": [0,1,2,3,54,104,152,153,204,254,300,301,302,303],
      "4": [0,50,100,150,4,54,104,151,152,153,154,204,254,304],
      "5": [0,1,2,3,4,50,100,151,152,153,204,254,300,301,302,303],
      "6": [1,2,3,50,100,150,151,152,153,200,250,301,302,204,254,303],
      "7": [0,1,2,3,4,54,103,152,201,250,300],
      "8": [1,2,3,50,100,151,152,153,200,250,301,302,303,54,104,204,254],
      "9": [1,2,3,50,100,151,152,153,154,204,254,304,54,104],
      " ": []
    };
    var CG_COLORS = ["#3a93f2", "#1560bd", "#0f398b"];   // brand blues: azure -> blue -> navy
    function buildCommitsGrid(text) {
      var allowed = {}; for (var k in CG_LETTERS) allowed[k] = 1;
      var cleaned = String(text).toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
        .split("").filter(function (c) { return allowed[c]; }).join("");
      var width = Math.max(cleaned.length * 6, 6) + 1, height = 9;
      var pos = 1, on = {};
      cleaned.split("").forEach(function (ch) {
        var pat = CG_LETTERS[ch];
        if (pat) pat.forEach(function (p) { on[(Math.floor(p / 50) + 1) * width + (p % 50) + pos] = 1; });
        pos += 6;
      });
      var grid = el("div", { class: "ath-cg", role: "img", "aria-label": cleaned });
      grid.style.gridTemplateColumns = "repeat(" + width + ", minmax(0,1fr))";
      grid.style.gridTemplateRows = "repeat(" + height + ", minmax(0,1fr))";
      var total = width * height;
      for (var idx = 0; idx < total; idx++) {
        var lit = !!on[idx];
        var c = el("div", { class: "ath-cg-cell" + (lit ? " is-on" : "") });
        if (lit) {
          c.style.setProperty("--hl", CG_COLORS[Math.floor(Math.random() * CG_COLORS.length)]);
          c.style.setProperty("--d", (Math.random() * 0.6).toFixed(2) + "s");
        }
        grid.appendChild(c);
      }
      var wrap = el("div", { class: "ath-cg-wrap" }, [grid]);
      return wrap;
    }
    /* Keep the board alive after it's drawn: a continuous stream of random
       "commit" pulses lighting up empty cells in varied blues (the letters
       shimmer via CSS). Self-stops if the grid is removed; pauses when hidden. */
    function cgActivity(grid) {
      if (!grid || grid.__live) return;
      // mobile: skip the continuous "commit" pulses (perf) — letters still draw in
      try { if (window.matchMedia && window.matchMedia("(max-width: 860px)").matches) return; } catch (e) {}
      grid.__live = true;
      var amb = [].slice.call(grid.querySelectorAll(".ath-cg-cell:not(.is-on)"));
      var TINTS = ["rgba(0,153,255,0.58)", "rgba(58,147,242,0.62)", "rgba(21,96,189,0.5)", "rgba(0,153,255,0.3)", "rgba(13,68,153,0.45)"];
      function rnd(a) { return a[(Math.random() * a.length) | 0]; }
      function pulse() {
        if (!document.body.contains(grid)) { grid.__live = false; return; }   // grid removed -> stop
        if (!document.hidden && amb.length) {
          var n = 4 + ((Math.random() * 4) | 0);                               // 4–7 cells per tick
          for (var i = 0; i < n; i++) (function (c) {
            if (!c || c.__b) return; c.__b = 1;
            var col = rnd(TINTS);
            c.style.backgroundColor = col;
            c.style.boxShadow = "0 0 7px -2px " + col;
            setTimeout(function () {
              c.style.backgroundColor = ""; c.style.boxShadow = "";
              setTimeout(function () { c.__b = 0; }, 380);
            }, 240 + Math.random() * 360);
          })(rnd(amb));
        }
        grid.__t = setTimeout(pulse, 260 + Math.random() * 180);
      }
      pulse();
    }

    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
    function fmtN(v, dec, group) {
      var x = dec > 0 ? Number(v).toFixed(dec) : String(Math.round(v));
      if (group) { var p = x.split("."); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ","); x = p.join("."); }
      return x;
    }
    function setFinal(node) {
      node.textContent = fmtN(parseFloat(node.getAttribute("data-to")) || 0, parseInt(node.getAttribute("data-dec"), 10) || 0, node.getAttribute("data-group") === "1") + (node.getAttribute("data-suffix") || "");
      node.style.filter = ""; node.style.transform = "";
    }
    function runCount(node) {
      var to = parseFloat(node.getAttribute("data-to")) || 0;
      var dec = parseInt(node.getAttribute("data-dec"), 10) || 0;
      var group = node.getAttribute("data-group") === "1";
      var suffix = node.getAttribute("data-suffix") || "";
      var dur = 1500, start = null;
      function frame(ts) {
        if (start == null) start = ts;
        var t = Math.min(1, (ts - start) / dur), e = easeOut(t);
        node.textContent = fmtN(to * e, dec, group) + suffix;
        node.style.filter = "blur(" + (6 * (1 - e)).toFixed(2) + "px)";
        node.style.transform = "translateY(" + (8 * (1 - e)).toFixed(2) + "px)";
        if (t < 1) requestAnimationFrame(frame); else setFinal(node);
      }
      requestAnimationFrame(frame);
    }

    /* Interactions are wired via delegation on `document` (attached ONCE), so
       they keep working even if Framer re-renders / re-creates the section.
       State is read from the DOM (active pill, is-anim flag) — no stale closures. */
    function cl(t, sel) { return (t && t.closest) ? t.closest(sel) : null; }
    // The photo canvas IS the selector: hovering/tapping a card highlights it
    // (instantly) and crossfades the quote to that person. Active state persists.
    function tmShown(tm) { return tm.__shown == null ? 0 : tm.__shown; }
    function tmRunSwap(tm) {
      var i = tm.__want;
      if (i === tmShown(tm) || !TM[i]) { tm.__busy = false; return; }
      tm.__busy = true;
      tm.classList.add("is-anim");
      setTimeout(function () {
        var q = tm.querySelector(".ath-tm__quote"), name = tm.querySelector(".ath-tm__name"), role = tm.querySelector(".ath-tm__role");
        if (q) q.textContent = TM[i].q;
        if (name) name.textContent = TM[i].a;
        if (role) role.textContent = TM[i].r;
        tm.__shown = i;
        setTimeout(function () { tm.classList.remove("is-anim"); tmRunSwap(tm); }, 400);   // pick up latest hover
      }, 200);
    }
    function tmSetActive(tm, i) {
      if (!TM[i]) return;
      var cards = tm.querySelectorAll(".ath-tm__card");
      for (var k = 0; k < cards.length; k++) { var ci = parseInt(cards[k].getAttribute("data-i"), 10) || 0; cards[k].classList.toggle("is-active", ci === i); cards[k].classList.toggle("is-dim", ci !== i); }
      tm.__want = i;
      if (!tm.__busy) tmRunSwap(tm);
    }
    function tmFromEvent(e) {
      var card = cl(e.target, ".ath-tm__card"); if (!card) return;
      var tm = cl(card, ".ath-tm"); if (!tm) return;
      tmSetActive(tm, parseInt(card.getAttribute("data-i"), 10) || 0);
    }
    document.addEventListener("mouseover", tmFromEvent);   // hover a photo -> highlight + its quote
    document.addEventListener("click", tmFromEvent);       // tap support (touch / no hover)

    function countAll(block) { var ns = block.querySelectorAll(".ath-num"); for (var j = 0; j < ns.length; j++) runCount(ns[j]); }
    function finalAll(block) { var ns = block.querySelectorAll(".ath-num"); for (var j = 0; j < ns.length; j++) setFinal(ns[j]); }
    function wire(section) {
      var rm = reduced();
      var blocks = section.querySelectorAll("[data-anim='up']");
      for (var b = 0; b < blocks.length; b++) {
        (function (block) {
          var isCounts = block.className.indexOf("ath-counts") !== -1;
          if (rm) { block.classList.add("is-in"); if (isCounts) finalAll(block); return; }
          // slide/fade the block in as it enters (early trigger)
          onView(block, function () { block.classList.add("is-in"); });
          // ...but only START the count-up once the strip is properly in view
          // (>=55% visible) so the whole ramp plays where it can be seen — not
          // while the block is still faint/at the screen edge.
          if (isCounts) onView(block, function () { countAll(block); }, { threshold: 0.55 });
        })(blocks[b]);
      }
      /* Reserve the tallest quote + attribution. These three run from one line
         to five, and the swap is a blur-and-replace in place — without this the
         photos below jump up the page mid-fade every time one is picked. */
      var tmEl = section.querySelector(".ath-tm");
      if (tmEl) {
        var lock = function () {
          var q = tmEl.querySelector(".ath-tm__quote"), at = tmEl.querySelector(".ath-tm__attrib");
          var wrap = tmEl.querySelector(".ath-tm__quote-wrap");
          if (!q || !at || !wrap) return;
          var keepQ = q.textContent, keepN = at.querySelector(".ath-tm__name").textContent,
              keepR = at.querySelector(".ath-tm__role").textContent, hq = 0, ha = 0;
          wrap.style.minHeight = ""; at.style.minHeight = "";
          for (var i = 0; i < TM.length; i++) {
            q.textContent = TM[i].q;
            at.querySelector(".ath-tm__name").textContent = TM[i].a;
            at.querySelector(".ath-tm__role").textContent = TM[i].r;
            hq = Math.max(hq, wrap.offsetHeight); ha = Math.max(ha, at.offsetHeight);
          }
          q.textContent = keepQ;
          at.querySelector(".ath-tm__name").textContent = keepN;
          at.querySelector(".ath-tm__role").textContent = keepR;
          // On the wrap, not the <p>: the quote marks are anchored to the wrap,
          // and the text centres inside it, so a short quote sits balanced
          // rather than pinned to the top of the reserved space.
          wrap.style.minHeight = hq + "px"; at.style.minHeight = ha + "px";
        };
        // Plain resize, not a ResizeObserver on the block itself: lock() changes
        // that block's height, so observing it would feed itself.
        lock();
        setTimeout(lock, 600);   // again once the webfont has settled
        var lockT = null;
        window.addEventListener("resize", function () { clearTimeout(lockT); lockT = setTimeout(lock, 150); });
      }
      // commits grid: draw the letters in on view, then keep the board alive
      var cg = section.querySelector(".ath-cg-wrap");
      if (cg) {
        var gridEl = cg.querySelector(".ath-cg");
        if (rm) cg.classList.add("is-lit");
        else onView(cg, function () { cg.classList.add("is-lit"); cgActivity(gridEl); });
      }
    }

    function build() {
      // Testimonials + traction strip: directly UNDER the 3-steps section, i.e.
      // right before the "Why clinics switch" stats card.
      if (!document.querySelector(".ath-below")) {
        var stats = document.querySelector(".ath-stats");
        if (stats && stats.parentNode) {
          // Without the traction strip the section's bottom padding is sized
          // for a block that isn't there, leaving a hole above the features
          // box. Flag it so the CSS can close that up.
          var sec = el("section", { class: "ath-below" + (SHOW_COUNTS ? "" : " ath-below--no-counts"), "aria-label": "What clinicians say and traction" });
          sec.innerHTML = HTML;
          stats.parentNode.insertBefore(sec, stats);   // after the 3 steps, before the stats card
          wire(sec);
        }
      }
      // Commits grid: the LAST section of the site — directly AFTER the FAQ.
      if (!document.querySelector(".ath-cg-section")) {
        var faq = document.getElementById("faq");
        var fanchor = faq ? topLevelOf(faq) : null;
        if (fanchor && fanchor.parentNode) {
          var cgSec = el("section", { class: "ath-cg-section", "aria-label": "Built by Sculptr" });
          cgSec.appendChild(buildCommitsGrid("sculptr"));
          fanchor.parentNode.insertBefore(cgSec, fanchor.nextSibling);   // after the FAQ -> last section
          wire(cgSec);
        }
      }
    }
    var pending = false;
    build();
    try {
      new MutationObserver(function () {
        if (pending) return; pending = true;
        requestAnimationFrame(function () { pending = false; build(); });
      }).observe(document.body, { childList: true, subtree: true });
    } catch (e) {}
  }

  /* --------- "New features coming" roadmap teaser (stacked display cards) ----
     Vanilla port of the provided DisplayCards component. A skewed 3-card stack:
     the lead card (front, colour, on top) announces the next release; the two
     behind it are greyed with blurred teaser text hinting at what's coming.
     Hover a card to lift + reveal it. Sits directly under the ROI calculator. */
  function buildDisplayCards() {
    function reduced() {
      try { return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
    }
    function onView(node, cb) {
      if (!node) return cb();
      try {
        var io = new IntersectionObserver(function (es) {
          for (var i = 0; i < es.length; i++) { if (es[i].isIntersecting) { io.disconnect(); cb(); break; } }
        }, { threshold: 0, rootMargin: "0px 0px -12% 0px" });
        io.observe(node);
      } catch (e) { cb(); }
    }
    function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
    var SPARK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.14-1.58a.5.5 0 0 1 0-.97L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.14a.5.5 0 0 1 .97 0L14.06 8.5A2 2 0 0 0 15.5 9.94l6.14 1.58a.5.5 0 0 1 0 .97L15.5 14.06a2 2 0 0 0-1.44 1.44l-1.58 6.14a.5.5 0 0 1-.97 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>';
    // back-most first in the DOM so the lead card paints on top
    var CARDS = [
      { mod: "ath-card--a", tease: true,  title: "AI treatment planning", desc: "Personalised plan suggestions", date: "Coming soon" },
      { mod: "ath-card--b", tease: true,  title: "Live collaboration",    desc: "Plan with your whole team",     date: "Coming soon" },
      { mod: "ath-card--c", tease: false, title: "New features",          desc: "Coming next month",             date: "On the roadmap" }
    ];
    function cardHTML(c) {
      return '<div class="ath-card ' + c.mod + (c.tease ? ' ath-card--tease' : ' ath-card--lead') + '">'
        + '<div class="ath-card__row"><span class="ath-card__icon">' + SPARK + '</span>'
        + '<p class="ath-card__title">' + esc(c.title) + '</p></div>'
        + '<p class="ath-card__desc">' + esc(c.desc) + '</p>'
        + '<p class="ath-card__date">' + esc(c.date) + '</p>'
      + '</div>';
    }
    var inner = "";
    for (var i = 0; i < CARDS.length; i++) inner += cardHTML(CARDS[i]);
    var HTML = '<div class="ath-cards">' + inner + '</div>';

    function build() {
      if (document.querySelector(".ath-roadmap")) return;
      // Last of the marketing sections, under Plans & Pricing — what's coming
      // reads better after what you'd be paying for than before it.
      var after = document.querySelector(".ath-pr") || document.querySelector(".ath-calc");
      if (!after || !after.parentNode) return;
      var sec = el("section", { class: "ath-roadmap", "aria-label": "New features coming soon" });
      sec.innerHTML = HTML;
      after.parentNode.insertBefore(sec, after.nextSibling);
      var wrap = sec.querySelector(".ath-cards");
      if (reduced()) { if (wrap) wrap.classList.add("is-in"); }
      else onView(wrap, function () { if (wrap) wrap.classList.add("is-in"); });
    }
    var pending = false;
    build();
    try {
      new MutationObserver(function () {
        if (pending) return; pending = true;
        requestAnimationFrame(function () { pending = false; build(); });
      }).observe(document.body, { childList: true, subtree: true });
    } catch (e) {}
  }

  /* ----- "All your workflow in one place" folder (opens to reveal features) ---
     Vanilla port of the provided Framer-Motion FolderInteraction. A clickable
     folder that opens (on view + on click/tap): the front flap tilts back in 3D
     and three "files" fan out, each naming a workflow feature. Brand-matched to
     navy. Sits after the "How it works" steps. */
  /* --------------------- page fade (route transitions) -------------------- */
  /* Smooth white-veil fade used when hopping between pages (home ⇄ request
     access ⇄ the app). The destination page animates itself back in. */
  function navigateWithFade(url) {
    var veil = document.querySelector(".ath-veil");
    if (!veil) { veil = el("div", { class: "ath-veil", "aria-hidden": "true" }); document.body.appendChild(veil); }
    void veil.offsetWidth;                       // force reflow so the transition runs
    veil.classList.add("is-on");
    setTimeout(function () { window.location.href = url; }, 320);
  }
  // bfcache back-navigation restores the old DOM — clear the veil or the page
  // comes back frozen behind an opaque overlay.
  window.addEventListener("pageshow", function () {
    var veil = document.querySelector(".ath-veil");
    if (veil) veil.classList.remove("is-on");
  });
  window.athNavigateWithFade = navigateWithFade;

  /* --------------- Request Access buttons → /request-access --------------- */
  /* The Framer buttons link to "./" (nowhere). Point every one of them at the
     request page, with the veil fade. Capture phase beats Framer's own link
     handler; the MutationObserver survives Framer re-renders. */
  function wireRequestAccess() {
    function wire() {
      var ps = document.querySelectorAll("p.framer-text");
      for (var i = 0; i < ps.length; i++) {
        var t = (ps[i].textContent || "").trim();
        if (t !== "Request Access" && t !== "Get Access") continue;
        var a = ps[i].closest ? ps[i].closest("a") : null;
        if (!a || a.getAttribute("data-ath-req") === "1") continue;
        a.setAttribute("data-ath-req", "1");
        a.setAttribute("href", "/request-access");
        a.addEventListener("click", function (e) {
          e.preventDefault(); e.stopPropagation();
          navigateWithFade("/request-access");
        }, true);
      }
    }
    wire();
    try {
      var pending = false;
      new MutationObserver(function () { if (pending) return; pending = true; requestAnimationFrame(function () { pending = false; wire(); }); })
        .observe(document.body, { childList: true, subtree: true });
    } catch (e) {}
  }

  /* --------------------------- plans & pricing ----------------------------- */
  /* The app's Plans & Pricing section (components/subscription/pricing-section
     .tsx + lib/subscription/plans.ts), copied onto the site above the FAQ.
     Copy, prices, feature lists and the "Title: detail" chevron convention are
     verbatim from the app's plan data; styling in athli-enhance.css is the
     resolved form of the app's own classes. Difference from the app: the CTAs
     go to /request-access instead of Stripe checkout / the sales modal. */
  function buildPricing() {
    function topLevelOf(node) {
      var root = document.querySelector("[data-framer-root]");
      if (!root) return null;
      var n = node;
      while (n && n.parentElement && n.parentElement !== root) n = n.parentElement;
      return (n && n.parentElement === root) ? n : null;
    }

    var YEARLY_DISCOUNT = 0.2;
    var PLANS = [
      {
        id: "essential", name: "Essential", monthlyPrice: 149, buttonText: "Choose Essential",
        features: [
          { text: "1 practitioner", icon: "seats" },
          { text: "150 simulations / mo", icon: "visualisations" },
          { text: "50 GB scan storage", icon: "storage" }
        ],
        includes: { heading: "Essential includes:", items: [
          { text: "3D facial reconstruction and editing from a single scan", hero: true },
          "Patient records: medical history intake, consultation notes and treatment logging per visit",
          "Mark-up tools: draw, annotate and plan directly on the 3D face",
          { text: "3D comparison across visits", hero: true },
          { text: "Facial analysis: facial thirds, lower-face thirds, facial fifths", hero: true },
          "Chat support"
        ] }
      },
      {
        id: "clinic", name: "Clinic+", monthlyPrice: 249, popular: true, buttonText: "Choose Clinic+",
        features: [
          { text: "Up to 5 practitioners", icon: "seats" },
          { text: "300 simulations / mo", icon: "visualisations" },
          { text: "100 GB scan storage", icon: "storage" }
        ],
        includes: { heading: "Everything in Essential, plus:", items: [
          { text: "Full simulation editing suite: sculpt, adjust and refine every result", hero: true },
          { text: "AI consultation scribe: ambient recording, auto-generated consultation summaries, treatment plans and follow-up notes, custom templates, editable and exportable in one click", hero: true },
          { text: "Skin analysis, 15 metrics: skin type, wrinkles, spots, texture, pores, firmness, eye bags, droopy upper eyelid, droopy lower eyelid, acne, dark circles, redness, radiance, moisture, oiliness", hero: true },
          { text: "Injection mapping: product, units and depth plotted on the face, saved to the patient record", hero: true },
          "Before-and-after photo storage with timeline view",
          "Consults inbox and aftercare follow-ups",
          { text: "Patient portal: patients view their plan, simulations and results, etc.", hero: true },
          "Shared clinic library: treatment templates and pricing presets",
          "Data export and reporting",
          "Priority support"
        ] }
      },
      {
        id: "signature", name: "Signature", wordmark: "images/signature-wordmark.png",
        tagline: "Your Personal Private App", monthlyPrice: 499, startingAt: true,
        buttonText: "Talk to Sales",
        features: [
          { text: "Unlimited practitioners", icon: "seats" },
          { text: "Unlimited simulations", icon: "visualisations" },
          { text: "Unlimited scan storage", icon: "storage" }
        ],
        includes: { heading: "Everything in Clinic+, plus:", items: [
          { text: "Your own branded patient app, iOS and Android", hero: true },
          "Multi-location management with per-site reporting",
          { text: "Custom branding across app, portal and patient documents", hero: true },
          "Two-way patient messaging: appointment reminders, aftercare check-ins, recall campaigns",
          { text: "Offers, packages and loyalty programmes", hero: true },
          "Role-based permissions and team management",
          "Group-wide analytics: revenue, conversion and treatment mix by site",
          "API and integrations with your existing clinic software"
        ] }
      }
    ];
    var FOOTNOTE = "All prices include VAT. Cancel anytime. Extra simulations available on any plan.";

    function yearlyPriceFor(p) { return Math.round(p.monthlyPrice * 12 * (1 - YEARLY_DISCOUNT)); }
    function priceFor(p, interval) { return interval === "yearly" ? yearlyPriceFor(p) : p.monthlyPrice; }
    function gbp(n) { return "£" + n.toLocaleString("en-GB"); }
    function savingPercent() {
      var m = 0, y = 0;
      for (var i = 0; i < PLANS.length; i++) { m += PLANS[i].monthlyPrice * 12; y += yearlyPriceFor(PLANS[i]); }
      return m <= 0 ? 0 : Math.round((1 - y / m) * 100);
    }

    /* lucide: users / scan-face / database, and check-check for the list */
    var ICONS = {
      seats: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      visualisations: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01"/><path d="M15 9h.01"/></svg>',
      storage: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>'
    };
    var ICON_CHECKCHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/></svg>';
    var ICON_CHEVRON = '<svg class="ath-pr__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

    function esc(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

    /* "Title: detail" -> title visible, detail behind a chevron (as the app). */
    function includeItem(raw, featured) {
      var text = typeof raw === "string" ? raw : raw.text;
      var hero = typeof raw === "string" ? false : !!raw.hero;
      var split = text.indexOf(":");
      var title = split > 0 ? text.slice(0, split) : text;
      var detail = split > 0 ? text.slice(split + 1).trim() : null;
      var markCls = hero
        ? (featured ? "ath-pr__mark ath-pr__mark--hero-navy" : "ath-pr__mark ath-pr__mark--hero")
        : (featured ? "ath-pr__mark ath-pr__mark--ring-navy" : "ath-pr__mark ath-pr__mark--ring");
      var titleCls = "ath-pr__it-title" + (hero ? " is-hero" : "") + (featured ? " on-navy" : "");
      var sheen = hero ? (" ath-pr__sheen" + (featured ? " ath-pr__sheen--on-navy" : "")) : "";
      var body = detail
        ? '<button type="button" class="ath-pr__it-btn ' + titleCls + '" aria-expanded="false">'
            + '<span class="ath-pr__it-text' + sheen + '">' + esc(title) + "</span>" + ICON_CHEVRON
          + "</button>"
          + '<div class="ath-pr__it-reveal"><div><p class="ath-pr__it-detail' + (featured ? " on-navy" : "") + '">' + esc(detail) + "</p></div></div>"
        : '<span class="ath-pr__it-plain ' + titleCls + '"><span class="ath-pr__it-text' + sheen + '">' + esc(title) + "</span></span>";
      return '<li class="ath-pr__item"><span class="' + markCls + '">' + ICON_CHECKCHECK + "</span>"
        + '<div class="ath-pr__it-body">' + body + "</div></li>";
    }

    function planCard(p) {
      var featured = !!p.popular, feats = "", items = "";
      for (var i = 0; i < p.features.length; i++) {
        feats += '<li class="ath-pr__feat">' + ICONS[p.features[i].icon]
          + "<span>" + esc(p.features[i].text) + "</span></li>";
      }
      for (var j = 0; j < p.includes.items.length; j++) items += includeItem(p.includes.items[j], featured);

      var title = p.wordmark
        ? '<span class="ath-pr__wordmark" role="img" aria-label="' + esc(p.name) + '">'
            + '<span class="ath-pr__wordmark-ink" aria-hidden="true" style="-webkit-mask-image:url(&quot;' + p.wordmark + '&quot;);mask-image:url(&quot;' + p.wordmark + '&quot;)"></span></span>'
        : '<h3 class="ath-pr__name">' + esc(p.name) + "</h3>";

      return '<div class="ath-pr__card' + (featured ? " is-featured" : "") + '" data-plan="' + p.id + '">'
        + '<div class="ath-pr__card-body">'
          + '<div class="ath-pr__topgap">'
            + (featured ? '<span class="ath-pr__popular">Most popular</span>' : '<span class="ath-pr__popular-spacer" aria-hidden="true"></span>')
            + title
            + '<div class="ath-pr__price-row">'
              + (p.startingAt ? '<span class="ath-pr__starting">Starting at</span>' : "")
              + '<span class="ath-pr__price" data-monthly="' + gbp(p.monthlyPrice) + '" data-yearly="' + gbp(yearlyPriceFor(p)) + '">' + gbp(p.monthlyPrice) + "</span>"
              + '<span class="ath-pr__per">/<span class="ath-pr__per-word">month</span></span>'
            + "</div>"
            + (p.tagline ? '<p class="ath-pr__tagline">' + esc(p.tagline) + "</p>" : "")
          + "</div>"
          + '<ul class="ath-pr__feats">' + feats + "</ul>"
          + '<div class="ath-pr__includes">'
            + '<h4 class="ath-pr__inc-head">' + esc(p.includes.heading) + "</h4>"
            + '<ul class="ath-pr__items">' + items + "</ul>"
          + "</div>"
        + "</div>"
        + '<div class="ath-pr__rule"></div>'
        + '<div class="ath-pr__footer">'
          + '<div class="glass-button-wrap ' + (featured ? "glass-button--haze" : "glass-button--haze-light") + ' ath-pr__cta">'
          + '<a class="glass-button" href="/request-access"><span class="glass-button-text">' + esc(p.buttonText) + "</span></a>"
          + '<div class="glass-button-shadow"></div></div>'
        + "</div>"
      + "</div>";
    }

    var cards = "";
    for (var k = 0; k < PLANS.length; k++) cards += planCard(PLANS[k]);

    var HTML = '<div class="ath-pr__inner">'
      + '<div class="ath-pr__head">'
        + "<div>"
        + '<h2 class="ath-pr__title">Plans &amp; Pricing</h2>'
        + '<p class="ath-pr__sub">Every plan includes the 3D consultation studio.</p>'
        + "</div>"
        + '<fieldset class="switcher" data-previous="1">'
          + '<legend class="switcher__legend">Choose billing period</legend>'
          + '<label class="switcher__option"><input class="switcher__input" type="radio" name="ath-billing-period" value="monthly" checked>Monthly</label>'
          + '<label class="switcher__option"><input class="switcher__input" type="radio" name="ath-billing-period" value="yearly">Yearly'
          + '<span class="switcher__badge">Save ' + savingPercent() + '%</span></label>'
        + "</fieldset>"
      + "</div>"
      + '<div class="ath-pr__panel">' + cards + "</div>"
      + '<p class="ath-pr__footnote">' + FOOTNOTE + "</p>"
      + "</div>";

    function wire(sec) {
      /* chevron rows */
      sec.addEventListener("click", function (e) {
        var btn = e.target && e.target.closest ? e.target.closest(".ath-pr__it-btn") : null;
        if (!btn) return;
        var open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", open ? "false" : "true");
        var rev = btn.nextElementSibling;
        if (rev) rev.style.gridTemplateRows = open ? "0fr" : "1fr";
      });
      /* monthly <-> yearly */
      var fs = sec.querySelector(".switcher");
      var inputs = sec.querySelectorAll(".switcher__input");
      for (var i = 0; i < inputs.length; i++) {
        inputs[i].addEventListener("change", function () {
          var yearly = this.value === "yearly";
          fs.setAttribute("data-previous", yearly ? "2" : "1");
          var prices = sec.querySelectorAll(".ath-pr__price");
          for (var j = 0; j < prices.length; j++) {
            prices[j].textContent = prices[j].getAttribute(yearly ? "data-yearly" : "data-monthly");
          }
          var words = sec.querySelectorAll(".ath-pr__per-word");
          for (var w = 0; w < words.length; w++) words[w].textContent = yearly ? "year" : "month";
        });
      }
      /* every CTA goes to the request-access page, with the veil fade */
      var ctas = sec.querySelectorAll(".ath-pr__cta .glass-button");
      for (var c = 0; c < ctas.length; c++) {
        ctas[c].addEventListener("click", function (e) {
          e.preventDefault(); e.stopPropagation();
          if (window.athNavigateWithFade) window.athNavigateWithFade("/request-access");
          else window.location.href = "/request-access";
        }, true);
      }
    }

    function build() {
      if (document.querySelector(".ath-pr")) return;
      var faq = document.getElementById("faq");
      var anchor = faq ? topLevelOf(faq) : null;
      if (!anchor || !anchor.parentNode) return;
      var sec = el("section", { class: "ath-pr", "aria-label": "Plans & Pricing" });
      sec.innerHTML = HTML;
      anchor.parentNode.insertBefore(sec, anchor);   // right above the FAQ
      wire(sec);
    }
    build();
    var pending = false;
    try {
      new MutationObserver(function () { if (pending) return; pending = true; requestAnimationFrame(function () { pending = false; build(); }); })
        .observe(document.body, { childList: true, subtree: true });
    } catch (e) {}
  }

  /* ------------------------------ features --------------------------------- */
  /* One panel, feature list down the left, showcase on the right: a screenshot
     of the app with the description under it. Rows are a real tablist, so
     arrow keys work and the panel is announced properly.

     Two features have no screenshot yet; they render a branded plate with the
     feature's icon instead of a broken frame, and adding the image is a
     one-line change (drop the file in and set `img`). */  var FEATURES = [
    { id: "sculpt", name: "Live Sculpt", imgs: ["live-sculpt-1"],
      body: "56 anatomy controls across nose, brow, cheeks, chin, jaw and lips. Morph the full 3D face in real time, in front of the patient, until the result is exactly what they want." },
    { id: "variations", name: "Variations &amp; Compare",
      imgs: ["variations-1", "variations-2", "variations-3", "variations-4", "variations-5", "variations-6"],
      body: "Save unlimited named variations per scan and hold them side by side. Single, Split and Reveal views put the original and the simulation on the same face, one slider apart." },
    { id: "analysis", name: "Facial Analysis", imgs: ["analysis-1", "analysis-2"],
      body: "Facial thirds and fifths calibrated on the model with live percentages. Objective proportional language for the recommendation, easier to accept and easier to price against." },
    { id: "planning", name: "Facial Planning", imgs: ["planning-1"],
      body: "Draw, annotate and measure directly on the 3D face, with real millimetre measurements saved to the model. Patients understand a line drawn on their own jaw instantly." },
    { id: "injection", name: "Injection Mapping", imgs: ["injection-1"],
      body: "Product, units and site plotted on the face and saved to the record per visit. Results become reproducible, and any practitioner can pick up exactly where another left off." },
    { id: "scribe", name: "AI Scribe", imgs: [],
      icon: '<path d="M2 10v3"/><path d="M6 6v11"/><path d="M10 3v18"/><path d="M14 8v7"/><path d="M18 5v13"/><path d="M22 10v3"/>',
      body: "Ambient recording writes consultation summaries, treatment plans and follow-ups automatically. No more 9pm paperwork." },
    { id: "record", name: "The Living Record", imgs: ["record-1", "record-2"],
      body: "The patient record lives on the face. Medical history, consultation notes, treatment plans, consent and a before-and-after photo timeline all attach to the 3D scan itself, not to a separate system with a second login." }
  ];
  var FEAT_DWELL = 4600;   // ms each screenshot holds before the next slides in

  function buildFeatures() {
    function topLevelOf(node) {
      var root = document.querySelector("[data-framer-root]");
      if (!root) return null;
      var n = node;
      while (n && n.parentElement && n.parentElement !== root) n = n.parentElement;
      return (n && n.parentElement === root) ? n : null;
    }
    function reduced() { try { return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } }

    /* Lead the description with its first sentence — that sentence is the claim
       in every one of these, and the rest is the supporting detail. */
    function bodyHTML(text) {
      var m = text.match(/^([\s\S]*?[.!?])\s+([\s\S]+)$/);
      if (!m) return '<span class="ath-feat__lead">' + text + "</span>";
      return '<span class="ath-feat__lead">' + m[1] + "</span> " + m[2];
    }

    var rows = "", panes = "";
    for (var i = 0; i < FEATURES.length; i++) {
      var f = FEATURES[i], on = i === 0;
      rows += '<button type="button" class="ath-feat__row' + (on ? " is-active" : "") + '" role="tab"'
        + ' id="ath-feat-tab-' + f.id + '" aria-controls="ath-feat-pane-' + f.id + '"'
        + ' aria-selected="' + (on ? "true" : "false") + '" tabindex="' + (on ? "0" : "-1") + '">'
        + '<span class="ath-feat__row-name">' + f.name + "</span>"
        + '<svg class="ath-feat__row-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>'
        + "</button>";

      var media;
      if (f.imgs.length) {
        var slides = "", inds = "";
        for (var s = 0; s < f.imgs.length; s++) {
          slides += '<img class="ath-feat__img' + (s === 0 ? " is-on" : "") + '" src="/images/features/' + f.imgs[s] + '.webp"'
            + ' alt="' + f.name.replace(/&amp;/g, "and") + ' in the Sculptr app" loading="lazy" decoding="async" draggable="false">';
          inds += '<button type="button" class="ath-feat__ind' + (s === 0 ? " is-on" : "") + '" data-slide="' + s + '"'
            + ' aria-label="Screenshot ' + (s + 1) + " of " + f.imgs.length + '"><span class="ath-feat__ind-fill"></span></button>';
        }
        media = '<div class="ath-feat__media">' + slides + "</div>"
          + (f.imgs.length > 1 ? '<div class="ath-feat__inds" role="group" aria-label="Screenshots">' + inds + "</div>" : "");
      } else {
        // No screenshot: the copy carries the pane, with the icon kept as a mark.
        media = '<div class="ath-feat__plate"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + f.icon + "</svg></div>";
      }
      panes += '<div class="ath-feat__pane' + (on ? " is-active" : "") + (f.imgs.length ? "" : " ath-feat__pane--copy") + '" role="tabpanel"'
        + ' id="ath-feat-pane-' + f.id + '" aria-labelledby="ath-feat-tab-' + f.id + '">'
        + media
        + '<p class="ath-feat__body">' + bodyHTML(f.body) + "</p>"
        + "</div>";
    }

    var HTML = '<div class="ath-feat__inner">'
      + '<div class="ath-feat__head">'
        + '<h2 class="ath-feat__title">Everything the consultation needs</h2>'
        + '<p class="ath-feat__sub">One record, one face, one login. Pick a feature to see it.</p>'
      + "</div>"
      + '<div class="ath-feat__card">'
        + '<div class="ath-feat__panel">'
          + '<div class="ath-feat__list" role="tablist" aria-label="Features" aria-orientation="vertical">' + rows + "</div>"
          + '<div class="ath-feat__show">' + panes + "</div>"
        + "</div>"
      + "</div>"
    + "</div>";

    function wire(sec) {
      var tabs = sec.querySelectorAll(".ath-feat__row");
      var timer = null, visible = true, hovering = false;

      /* Slide runner for the active pane. One timer for the section, not one
         per pane, so hidden panes cost nothing. */
      function stopSlides() { if (timer) { clearTimeout(timer); timer = null; } }
      function runSlides(pane) {
        stopSlides();
        var imgs = pane.querySelectorAll(".ath-feat__img");
        var inds = pane.querySelectorAll(".ath-feat__ind");
        if (imgs.length < 2) return;
        var at = 0;
        for (var i = 0; i < imgs.length; i++) if (imgs[i].classList.contains("is-on")) at = i;

        function paint(next, animate) {
          for (var j = 0; j < imgs.length; j++) imgs[j].classList.toggle("is-on", j === next);
          for (var k = 0; k < inds.length; k++) {
            var on = k === next;
            inds[k].classList.toggle("is-on", on);
            var fill = inds[k].querySelector(".ath-feat__ind-fill");
            // Reset with the transition off, then run it — otherwise the bar
            // eases backwards from full to empty on every change.
            fill.style.transition = "none";
            fill.style.width = on && animate ? "0%" : (on ? "100%" : "0%");
            if (on && animate) {
              void fill.offsetWidth;
              fill.style.transition = "width " + FEAT_DWELL + "ms linear";
              fill.style.width = "100%";
            }
          }
          at = next;
        }
        function tick() {
          timer = setTimeout(function () {
            if (!visible || hovering || document.hidden) { tick(); return; }   // hold, don't skip
            paint((at + 1) % imgs.length, true);
            tick();
          }, FEAT_DWELL);
        }
        paint(at, !reduced());
        if (!reduced()) tick();

        for (var m = 0; m < inds.length; m++) {
          (function (idx) {
            inds[idx].onclick = function () { paint(idx, !reduced()); if (!reduced()) tick(); };
          })(m);
        }
      }

      function select(idx) {
        for (var t = 0; t < tabs.length; t++) {
          var on = t === idx;
          tabs[t].classList.toggle("is-active", on);
          tabs[t].setAttribute("aria-selected", on ? "true" : "false");
          tabs[t].setAttribute("tabindex", on ? "0" : "-1");
          var pane = sec.querySelector("#ath-feat-pane-" + FEATURES[t].id);
          if (!pane) continue;
          // Panes stay stacked in one grid cell rather than being display:none'd,
          // so the card keeps one height across features and the swap is a real
          // cross-fade instead of a collapse-and-reopen.
          pane.classList.toggle("is-active", on);
          if (on) runSlides(pane);
        }
      }
      for (var i = 0; i < tabs.length; i++) {
        (function (idx) {
          tabs[idx].addEventListener("click", function () { select(idx); });
          tabs[idx].addEventListener("keydown", function (e) {
            var next = null;
            if (e.key === "ArrowDown" || e.key === "ArrowRight") next = (idx + 1) % tabs.length;
            else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = (idx - 1 + tabs.length) % tabs.length;
            else if (e.key === "Home") next = 0;
            else if (e.key === "End") next = tabs.length - 1;
            if (next === null) return;
            e.preventDefault();
            select(next);
            tabs[next].focus();
          });
        })(i);
      }

      var show = sec.querySelector(".ath-feat__show");
      show.addEventListener("pointerenter", function () { hovering = true; });
      show.addEventListener("pointerleave", function () { hovering = false; });
      try {
        new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0.1 }).observe(sec);
      } catch (e) {}
      runSlides(sec.querySelector(".ath-feat__pane.is-active"));
    }

    function build() {
      if (document.querySelector(".ath-feat")) return;
      var faq = document.getElementById("faq");
      // Straight after the testimonials: product content together, with the
      // proof sections (stats, calculator, roadmap) below it.
      var anchor = document.querySelector(".ath-stats") || document.querySelector(".ath-pr") || (faq ? topLevelOf(faq) : null);
      if (!anchor || !anchor.parentNode) return;
      var sec = el("section", { class: "ath-feat", "aria-label": "Features" });
      sec.innerHTML = HTML;
      anchor.parentNode.insertBefore(sec, anchor);
      wire(sec);
    }
    build();
    var pending = false;
    try {
      new MutationObserver(function () { if (pending) return; pending = true; requestAnimationFrame(function () { pending = false; build(); }); })
        .observe(document.body, { childList: true, subtree: true });
    } catch (e) {}
  }

  /* ---------------------------- studio demo -------------------------------- */
  /* A cut-down copy of the app's editor studio, running for real on the page.
     Same head model, same scene set-up as components/3d-viewer/ModelViewer.tsx
     (fov 39 at z 3.5, ACES filmic tone mapping, the studio's four-light rig)
     and nine of the actual sculpt controls from components/panels/SliderPanel
     .tsx — labels and morph target names verbatim. Sliders write morph target
     influences the way the app does (value / 100), so nothing here is faked.

     Weight is the whole point: three.js and the model are a lazy fetch that
     only starts once the section scrolls into view, and the render loop idles
     whenever the section is off-screen, the tab is hidden or the camera and
     sliders are at rest. */
  function buildStudioDemo() {
    var THREE_SRC = "/assets/ath-three.js";
    var MODEL_SRC = "/assets/demo-head.glb";

    /* Straight out of SLIDER_CATEGORIES — category names, slider labels and
       morph targets exactly as the studio defines them. */
    var CATEGORIES = [
      { name: "Main Nose Features", sliders: [
        { label: "Nose Bulbous", targets: ["Nose Bulbous"] },
        { label: "Nose Depth", targets: ["Nose Depth"] },
        { label: "Nose Droop", targets: ["Nose Droop"] },
        { label: "Nose Height", targets: ["Nose Height"] },
        { label: "Nose Relative Depth", targets: ["Nose Relative Depth"] },
        { label: "Nose Scale", targets: ["Nose Scale"] },
        { label: "Nose Upturn", targets: ["Nose Upturn"] },
        { label: "Nose Width", targets: ["Nose Width"] }
      ] }
    ];

    /* The worked edit the demo opens on — the same shape the app stores in a
       session's sliderValues (morph target name -> -100..100). The last four
       have no slider in this cut-down panel; they're part of the face you
       arrive at, not something to drive here. "Reset all" zeroes everything as
       it does in the studio, and "Hold to compare" shows the raw scan. */
    var PRESET = {
      "Nose Depth": -31,
      "Nose Height": -8,
      "Nose Relative Depth": 24,
      "Nose Scale": -35,
      "Nose Upturn": 73,
      "Nose Width": -3,
      "Nose Ridge Curve": -32,
      "browOuterUpLeft": 30,
      "browOuterUpRight": 30,
      "jawForward": 33
    };

    function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
    function reduced() { try { return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } }
    function frugal() {
      // Metered / slow connections: make the ~1.2 MB fetch a deliberate tap.
      try {
        var c = navigator.connection;
        if (!c) return false;
        return !!c.saveData || /^(slow-)?2g$/.test(c.effectiveType || "");
      } catch (e) { return false; }
    }
    function hasWebGL() {
      try {
        var c = document.createElement("canvas");
        return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
      } catch (e) { return false; }
    }
    function topLevelOf(node) {
      var root = document.querySelector("[data-framer-root]");
      if (!root) return null;
      var n = node;
      while (n && n.parentElement && n.parentElement !== root) n = n.parentElement;
      return (n && n.parentElement === root) ? n : null;
    }

    /* Panel chrome, collapsibles and sliders are the resolved form of the
       studio's own components — app/studio/components/ToolPanel.tsx and
       bits.tsx (Collapsible, CountBadge, FlowSlider) — down to the token
       values: 3px #e2eaf8 track, centre-origin cyan→azure→navy fill with the
       zero tick, 16px st-slider-thumb, the azure "edited" dot with its
       per-slider hover reset, and the st-pill actions. */
    var CHEVRON = '<svg class="st-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
    var SLIDERS_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
      + '<path d="M10 5H3"/><path d="M12 19H3"/><path d="M14 3v4"/><path d="M16 17v4"/><path d="M21 12h-9"/>'
      + '<path d="M21 19h-5"/><path d="M21 5h-7"/><path d="M8 10v4"/><path d="M8 12H3"/></svg>';

    /* FlowSlider. The visible track/fill/tick/thumb are painted elements —
       that's the only way to get the studio's centre-origin fill — over a
       transparent native range input, which keeps the drag, the arrow keys and
       the screen-reader semantics the platform already gets right. */
    function sliderHTML(s, id) {
      return '<div class="st-slider" data-slider="' + id + '" style="--pct:0.5;--fl:50%;--fw:0%">'
        + '<div class="st-slider__row">'
          + '<span class="st-slider__name"><span class="st-slider__dot" aria-hidden="true"></span>'
          + '<span class="st-slider__label">' + esc(s.label) + "</span></span>"
          + '<span class="st-slider__right">'
            + '<button type="button" class="st-slider__reset" tabindex="-1" aria-label="Reset ' + esc(s.label) + '">reset</button>'
            + '<span class="st-slider__val">0</span>'
          + "</span>"
        + "</div>"
        + '<div class="st-slider__ctl">'
          + '<div class="st-slider__track"><span class="st-slider__tick" aria-hidden="true"></span>'
          + '<span class="st-slider__fill" aria-hidden="true"></span></div>'
          + '<span class="st-slider__thumb" aria-hidden="true"></span>'
          + '<input class="st-slider__input" id="' + id + '" type="range" min="-100" max="100" step="1" value="0" aria-label="' + esc(s.label) + '">'
        + "</div>"
      + "</div>";
    }
    function categoryHTML(cat, ci) {
      var rows = "";
      for (var i = 0; i < cat.sliders.length; i++) rows += sliderHTML(cat.sliders[i], "ath-sl-" + ci + "-" + i);
      var open = ci === 0;
      return '<div class="st-collapsible">'
        + '<button type="button" class="st-collapsible__btn" aria-expanded="' + (open ? "true" : "false") + '">'
          + '<span class="st-collapsible__title"><span>' + esc(cat.name) + "</span>"
          + '<span class="st-count" data-count-for="' + ci + '" hidden>0</span></span>'
          + CHEVRON
        + "</button>"
        + '<div class="st-collapsible__body" style="grid-template-rows:' + (open ? "1fr" : "0fr") + '"><div><div class="st-collapsible__inner">' + rows + "</div></div></div>"
        + "</div>";
    }

    var cats = "";
    for (var c0 = 0; c0 < CATEGORIES.length; c0++) cats += categoryHTML(CATEGORIES[c0], c0);

    var HTML = '<div class="ath-demo__inner">'
      + '<div class="ath-demo__head">'
        + "<div>"
        + '<h2 class="ath-demo__title">Try the studio</h2>'
        + '<p class="ath-demo__sub">The real editor, running right here on the page. Drag to rotate the scan, move a slider, and watch the face change as you go.</p>'
        + "</div>"
      + "</div>"
      + '<div class="ath-demo__panel">'
        + '<div class="ath-demo__stage">'
          + '<div class="ath-demo__glow" aria-hidden="true"></div>'
          + '<canvas class="ath-demo__canvas"></canvas>'
          + '<div class="ath-demo__state"><span class="ath-demo__spinner" aria-hidden="true"></span><span class="ath-demo__state-text">Loading the 3D scan…</span></div>'
          + '<button type="button" class="ath-demo__load">Load the 3D demo</button>'
          + '<span class="ath-demo__hint">Drag to rotate</span>'
        + "</div>"
        + '<div class="ath-demo__tools">'
          + '<div class="st-toolhead">'
            + '<div class="st-toolhead__id">'
              + '<span class="st-toolhead__icon st-inset">' + SLIDERS_ICON + "</span>"
              + "<div>"
                + '<h3 class="st-toolhead__title">Sculpt</h3>'
                + '<p class="st-toolhead__sub">Morph the anatomy in real time</p>'
              + "</div>"
            + "</div>"
            + '<button type="button" class="st-pill ath-demo__reset">Reset all</button>'
          + "</div>"
          + '<hr class="st-hairline">'
          + '<div class="ath-demo__cats st-scroll">' + cats + "</div>"
          + '<div class="ath-demo__tools-foot">'
            + '<button type="button" class="st-pill ath-demo__compare">Hold to compare</button>'
          + "</div>"
        + "</div>"
      + "</div>"
      + '<div class="ath-demo__foot">'
        + '<p class="ath-demo__note">One of the studio’s eight control groups, opened on a worked case. The full editor adds the rest of the control set, your own patient scans, before-and-after comparison and treatment planning.</p>'
        + '<div class="glass-button-wrap glass-button--haze-light ath-demo__cta">'
          + '<a class="glass-button" href="/request-access"><span class="glass-button-text">Request Access</span></a>'
          + '<div class="glass-button-shadow"></div>'
        + "</div>"
      + "</div>"
      + "</div>";

    /* --------------------------- the three.js scene ------------------------ */
    var loadingThree = null;   // shared promise-ish: one <script> for the page
    function ensureThree(cb, fail) {
      if (window.ATH3D) return cb();
      if (loadingThree) { loadingThree.push({ ok: cb, no: fail }); return; }
      loadingThree = [{ ok: cb, no: fail }];
      var s = document.createElement("script");
      s.src = THREE_SRC;
      s.async = true;
      s.onload = function () { var q = loadingThree; loadingThree = null; for (var i = 0; i < q.length; i++) q[i].ok(); };
      s.onerror = function () { var q = loadingThree; loadingThree = null; for (var i = 0; i < q.length; i++) q[i].no(); };
      document.head.appendChild(s);
    }

    var live = null;   // the running instance, so a rebuild can tear it down

    function startScene(sec) {
      var stage = sec.querySelector(".ath-demo__stage");
      var canvas = sec.querySelector(".ath-demo__canvas");
      var stateEl = sec.querySelector(".ath-demo__state");
      var stateText = sec.querySelector(".ath-demo__state-text");
      var T = window.ATH3D;

      var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
      // Phones cap at 1.5, not 2: a 3x iPhone at dpr 2 backs a 390px stage with
      // ~1.4x the pixels of 1.5 for no visible gain at this size, and the GPU
      // memory that buys is the scarcest thing on the page.
      var PHONE = false;
      try { PHONE = window.matchMedia && window.matchMedia("(max-width: 860px)").matches; } catch (e) {}
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, PHONE ? 1.5 : 2));
      renderer.toneMapping = T.ACESFilmicToneMapping;

      var scene = new T.Scene();
      var camera = new T.PerspectiveCamera(22, 1, 0.1, 100);
      camera.position.set(0, 0, 3.5);

      // The studio's rig, at the studio's default intensity (8).
      var s = 8;
      scene.add(new T.AmbientLight(0xffffff, s * 0.7));
      function dir(x, y, z, i) { var l = new T.DirectionalLight(0xffffff, s * i); l.position.set(x, y, z); scene.add(l); return l; }
      dir(0, 0, 4, 1.8);      // key — azimuth 0, elevation 0, radius 4
      dir(0, -2, 1, 0.4);     // fill from below, softens under the chin and nose
      dir(-2, 1, -3, 0.35);   // rim, for depth separation

      var controls = new T.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.1;
      controls.enablePan = false;          // head stays put, same as the studio
      // Zoom is off and touch drags are horizontal-only: on a page people are
      // scrolling through, the viewer must never eat the wheel or a swipe.
      controls.enableZoom = false;
      renderer.domElement.style.touchAction = "pan-y";
      /* Idle motion sweeps between the two side profiles instead of orbiting:
         a full turn would put the back of the head on screen, which is the one
         angle of a face scan nobody wants to see. Driven off a sine so it eases
         to a stop at each profile and turns back rather than snapping. */
      var AUTO_AMP = Math.PI / 2;      // ±90° — profile to profile
      var AUTO_HALF = 30000;           // ms from one profile to the other
      var autoSpin = !reduced();
      var autoElapsed = 0, autoLast = 0;
      controls.addEventListener("start", function () { autoSpin = false; stage.classList.add("is-touched"); });

      var meshes = [];        // every primitive carrying the morph dictionary
      var values = {};        // morph target name -> -100..100
      var comparing = false;
      var dirty = true;
      var visible = false;
      var disposed = false;
      var raf = 0;
      var headPts = [];       // sparse sample of the head, for framing
      var headMid = null;     // its centre — the orbit target

      /* The studio renders into a full-height stage, so it can hard-code the
         camera at z 3.5; here the stage is whatever shape the section's grid
         gives it. Solve the distance instead: for every sampled head point,
         the smallest distance that keeps it inside the frame is
         (its depth) + (its offset) / (margin · tan(half-fov)), so the fit is
         the largest of those. Neck and shoulders sit below the sample and fall
         out of frame, which is the framing the studio ends up with too. */
      var MARGIN = 0.88;
      var ZOOM_OUT = 1.10;   // 10% wider than the tightest fit
      var RISE = 0.08;       // lift the head by 8% of the frame height
      function fitCamera(initial) {
        if (!headPts.length) return;
        var dir = initial
          ? new T.Vector3(0, 0, 1)
          : camera.position.clone().sub(controls.target).normalize();
        var up = new T.Vector3(0, 1, 0);
        var right = new T.Vector3().crossVectors(up, dir).normalize();
        if (!isFinite(right.x) || right.lengthSq() < 1e-6) right.set(1, 0, 0);
        var camUp = new T.Vector3().crossVectors(dir, right).normalize();

        var tanV = Math.tan(camera.fov * Math.PI / 360);
        var tanH = tanV * camera.aspect;
        var v = new T.Vector3();
        var dist = 0;
        for (var i = 0; i < headPts.length; i++) {
          v.copy(headPts[i]).sub(headMid);
          var depth = v.dot(dir);
          dist = Math.max(dist,
            depth + Math.abs(v.dot(right)) / (MARGIN * tanH),
            depth + Math.abs(v.dot(camUp)) / (MARGIN * tanV));
        }
        dist *= ZOOM_OUT;
        // Sitting the head dead-centre reads low, because the neck and
        // shoulders below it carry visual weight the frame doesn't show.
        // Dropping the target lifts the face by RISE of the frame height,
        // which the zoom-out has already made room for.
        var frameH = 2 * dist * tanV;
        var target = headMid.clone();
        target.y -= frameH * RISE;
        controls.target.copy(target);
        camera.position.copy(target).add(dir.multiplyScalar(dist));
        controls.minDistance = dist * 0.8;
        controls.maxDistance = dist * 1.35;
        controls.update();
        dirty = true;
      }

      function applyMorphs() {
        for (var m = 0; m < meshes.length; m++) {
          var mesh = meshes[m];
          var infl = mesh.morphTargetInfluences;
          var dict = mesh.morphTargetDictionary;
          for (var i = 0; i < infl.length; i++) infl[i] = 0;
          if (comparing) continue;
          for (var name in values) {
            var idx = dict[name];
            if (idx !== undefined) infl[idx] = values[name] / 100;
          }
        }
        dirty = true;
      }

      function resize() {
        var w = stage.clientWidth, h = stage.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        fitCamera(false);
        dirty = true;
      }

      /* Place the camera on the sweep. Radius is read back from the live camera
         rather than cached, so a resize refit is picked up on the next frame;
         the camera stays level with the target, which is where fitCamera puts
         it. Writing the position before controls.update() is fine — update()
         derives its spherical from the current position, then writes it back. */
      function autoPlace(now) {
        // Accumulate only the time the sweep was actually on screen, so
        // scrolling away and back resumes where it left off instead of
        // snapping to the front. The clamp stops a long pause leaping.
        if (autoLast) autoElapsed += Math.min(now - autoLast, 100);
        autoLast = now;
        var az = AUTO_AMP * Math.sin((autoElapsed / AUTO_HALF) * Math.PI);
        var t = controls.target;
        var r = Math.hypot(camera.position.x - t.x, camera.position.z - t.z);
        camera.position.set(t.x + r * Math.sin(az), t.y, t.z + r * Math.cos(az));
        camera.lookAt(t);
        dirty = true;
      }

      /* Don't draw while the page is moving. A fast flick asks the compositor
         for a lot at once, and a WebGL frame per rAF on top of it is the most
         expensive thing on the page — this hands that time back to the scroll
         instead of competing with it. The sweep's clock pauses too, so the head
         picks up where it left off rather than jumping.
         Phones only: this is a fix for a phone crash, and desktop was fine. */
      var scrolling = false, scrollT = null;
      if (PHONE) {
        window.addEventListener("scroll", function () {
          scrolling = true;
          clearTimeout(scrollT);
          scrollT = setTimeout(function () { scrolling = false; autoLast = 0; dirty = true; }, 140);
        }, { passive: true });
      }

      function loop() {
        if (disposed) return;
        raf = requestAnimationFrame(loop);
        if (!visible || document.hidden || scrolling) { autoLast = 0; return; }   // pause the sweep's clock, don't reset it
        if (autoSpin && headPts.length) autoPlace(performance.now());
        var moved = controls.update();
        if (!moved && !dirty) return;
        dirty = false;
        renderer.render(scene, camera);
      }

      function fail(msg) {
        stateEl.classList.add("is-error");
        if (stateText) stateText.textContent = msg;
      }

      var loader = new T.GLTFLoader();
      loader.setMeshoptDecoder(T.MeshoptDecoder);
      loader.load(MODEL_SRC, function (gltf) {
        if (disposed) return;
        gltf.scene.traverse(function (o) {
          if (o.isMesh && o.morphTargetDictionary && o.morphTargetInfluences) meshes.push(o);
        });
        scene.add(gltf.scene);
        // Sample the top 62% of the model — head and jaw, no torso — every
        // 32nd vertex, which is plenty to bound it and costs nothing.
        var box = new T.Box3().setFromObject(gltf.scene);
        var cut = box.max.y - (box.max.y - box.min.y) * 0.62;
        gltf.scene.updateWorldMatrix(true, true);
        gltf.scene.traverse(function (o) {
          if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return;
          var pos = o.geometry.attributes.position;
          for (var i = 0; i < pos.count; i += 32) {
            var p = new T.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(o.matrixWorld);
            if (p.y >= cut) headPts.push(p);
          }
        });
        var hbox = new T.Box3().setFromPoints(headPts.length ? headPts : [box.min, box.max]);
        headMid = hbox.getCenter(new T.Vector3());
        applyMorphs();
        resize();
        fitCamera(true);
        stage.classList.add("is-ready");
        dirty = true;
      }, null, function () { fail("Couldn’t load the 3D scan. Try refreshing the page."); });

      /* ---- controls ---- */
      var ranges = sec.querySelectorAll(".st-slider__input");
      function catIndex(input) { return +input.id.split("-")[2]; }
      function targetsFor(input) {
        var ids = input.id.split("-");             // ath-sl-<cat>-<slider>
        var cat = CATEGORIES[+ids[2]];
        return cat ? cat.sliders[+ids[3]].targets : [];
      }
      /* Centre-origin fill, exactly as FlowSlider computes it: the bar grows
         out of the zero tick rather than up from the left end. */
      function paint(input) {
        var v = +input.value;
        var pct = (v + 100) / 200;
        var wrap = input.closest(".st-slider");
        wrap.style.setProperty("--pct", String(pct));
        wrap.style.setProperty("--fl", (Math.min(pct, 0.5) * 100) + "%");
        wrap.style.setProperty("--fw", (Math.abs(pct - 0.5) * 100) + "%");
        wrap.querySelector(".st-slider__val").textContent = String(v);
        wrap.classList.toggle("is-modified", Math.round(v) !== 0);
      }
      // CountBadge — how many controls in each category are off zero.
      function paintCounts() {
        for (var c = 0; c < CATEGORIES.length; c++) {
          var n = 0;
          for (var i = 0; i < ranges.length; i++) if (catIndex(ranges[i]) === c && +ranges[i].value !== 0) n++;
          var badge = sec.querySelector('[data-count-for="' + c + '"]');
          if (badge) { badge.textContent = String(n); badge.hidden = n === 0; }
        }
      }
      function setSlider(input, v) {
        input.value = v;
        var ts = targetsFor(input);
        for (var t = 0; t < ts.length; t++) values[ts[t]] = +v;
        paint(input);
        paintCounts();
        applyMorphs();
      }
      // Open on the worked edit. The whole PRESET goes to the mesh, including
      // the targets this panel has no slider for; sliders that do exist take
      // their opening position from it.
      for (var k in PRESET) values[k] = PRESET[k];
      for (var r = 0; r < ranges.length; r++) {
        (function (input) {
          input.addEventListener("input", function () { setSlider(input, +input.value); });
          var one = input.closest(".st-slider").querySelector(".st-slider__reset");
          one.addEventListener("click", function () { setSlider(input, 0); });
          var ts = targetsFor(input);
          for (var t = 0; t < ts.length; t++) {
            if (values[ts[t]] === undefined) continue;
            input.value = values[ts[t]];
            break;
          }
          paint(input);
        })(ranges[r]);
      }
      paintCounts();

      var reset = sec.querySelector(".ath-demo__reset");
      if (reset) reset.addEventListener("click", function () {
        values = {};
        for (var i = 0; i < ranges.length; i++) { ranges[i].value = 0; paint(ranges[i]); }
        paintCounts();
        applyMorphs();
      });

      // Press-and-hold the compare button to drop back to the untouched scan.
      var compare = sec.querySelector(".ath-demo__compare");
      if (compare) {
        var hold = function (on) { return function (e) { if (e.cancelable) e.preventDefault(); comparing = on; compare.classList.toggle("is-held", on); applyMorphs(); }; };
        compare.addEventListener("pointerdown", hold(true));
        compare.addEventListener("pointerup", hold(false));
        compare.addEventListener("pointerleave", hold(false));
        compare.addEventListener("pointercancel", hold(false));
        compare.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); comparing = true; compare.classList.add("is-held"); applyMorphs(); } });
        compare.addEventListener("keyup", function (e) { if (e.key === "Enter" || e.key === " ") { comparing = false; compare.classList.remove("is-held"); applyMorphs(); } });
      }

      /* ---- lifecycle ---- */
      try {
        new ResizeObserver(resize).observe(stage);
      } catch (e) { window.addEventListener("resize", resize); }
      try {
        new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0 }).observe(sec);
      } catch (e) { visible = true; }
      document.addEventListener("visibilitychange", function () { dirty = true; });

      resize();
      loop();

      return { dispose: function () { disposed = true; cancelAnimationFrame(raf); controls.dispose(); renderer.dispose(); } };
    }

    function boot(sec) {
      if (sec.getAttribute("data-ath-booted") === "1") return;
      sec.setAttribute("data-ath-booted", "1");
      var stateText = sec.querySelector(".ath-demo__state-text");
      sec.querySelector(".ath-demo__stage").classList.add("is-loading");
      ensureThree(function () {
        if (stateText) stateText.textContent = "Loading the 3D scan…";
        live = startScene(sec);
      }, function () {
        sec.querySelector(".ath-demo__state").classList.add("is-error");
        if (stateText) stateText.textContent = "Couldn’t load the 3D viewer. Try refreshing the page.";
      });
    }

    /* --------------------------------- build ------------------------------- */
    function build() {
      if (document.querySelector(".ath-demo")) return;
      if (!hasWebGL()) return;
      // Above Plans & Pricing; if pricing hasn't landed yet, above the FAQ —
      // pricing then slots in between and the order comes out the same.
      var faq = document.getElementById("faq");
      // After the features box (built first), before the stats card.
      var anchor = document.querySelector(".ath-stats") || document.querySelector(".ath-pr") || (faq ? topLevelOf(faq) : null);
      if (!anchor || !anchor.parentNode) return;

      if (live) { live.dispose(); live = null; }

      var sec = el("section", { class: "ath-demo", "aria-label": "Try the studio" });
      sec.innerHTML = HTML;
      anchor.parentNode.insertBefore(sec, anchor);

      // Accordion — same collapse trick as the pricing feature rows.
      sec.addEventListener("click", function (e) {
        var btn = e.target && e.target.closest ? e.target.closest(".st-collapsible__btn") : null;
        if (!btn) return;
        var open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", open ? "false" : "true");
        var body = btn.nextElementSibling;
        if (body) body.style.gridTemplateRows = open ? "0fr" : "1fr";
      });

      // The CTA joins the request flow with the same veil fade as everything else.
      var cta = sec.querySelector(".ath-demo__cta .glass-button");
      if (cta) cta.addEventListener("click", function (e) {
        e.preventDefault(); e.stopPropagation();
        if (window.athNavigateWithFade) window.athNavigateWithFade("/request-access");
        else window.location.href = "/request-access";
      }, true);

      var loadBtn = sec.querySelector(".ath-demo__load");
      if (frugal()) {
        // Metered connection: wait for an explicit tap before spending the data.
        sec.querySelector(".ath-demo__stage").classList.add("is-deferred");
        loadBtn.addEventListener("click", function () { sec.querySelector(".ath-demo__stage").classList.remove("is-deferred"); boot(sec); });
      } else {
        try {
          var io = new IntersectionObserver(function (es) {
            for (var i = 0; i < es.length; i++) if (es[i].isIntersecting) { io.disconnect(); boot(sec); break; }
          }, { rootMargin: "300px 0px" });
          io.observe(sec);
        } catch (e) { boot(sec); }
      }
    }

    build();
    var pending = false;
    try {
      new MutationObserver(function () { if (pending) return; pending = true; requestAnimationFrame(function () { pending = false; build(); }); })
        .observe(document.body, { childList: true, subtree: true });
    } catch (e) {}
  }

  /* ----------------------------- init ------------------------------------- */
  function init() {
    /* Standalone pages (e.g. /request-access) reuse this behaviour layer for
       the site chrome only: same nav + scroll behaviour, nothing Framer. Links
       point back to the homepage sections. */
    if (document.body && document.body.getAttribute("data-ath-page") === "request") {
      killFramerEditBar();
      CONFIG.homeHref = "/";
      CONFIG.navLinks = [
        { label: "How it works", href: "/#how" },
        { label: "FAQ", href: "/#faq" },
        { label: "Contact", href: "/contact" }
      ];
      var rBuilt = buildNav();
      var rExtras = buildScrollExtras();
      wireScroll(rBuilt.nav, rBuilt.ctaText, rExtras.bar, rExtras.toTop);
      // Fade back to the homepage (logo + nav links + mobile panel) with the
      // same white veil used on the way in — only site-internal links ("/…"),
      // the external "Launch App" CTA navigates normally.
      var navAnchors = document.querySelectorAll(".ath-nav a, .ath-mobile-panel a");
      for (var ai = 0; ai < navAnchors.length; ai++) {
        (function (a) {
          var href = a.getAttribute("href") || "";
          if (href.charAt(0) !== "/" || a.getAttribute("data-ath-fade") === "1") return;
          a.setAttribute("data-ath-fade", "1");
          a.addEventListener("click", function (e) {
            e.preventDefault(); e.stopPropagation();
            navigateWithFade(href);
          }, true);
        })(navAnchors[ai]);
      }
      return;
    }
    killFramerEditBar();
    relabelCta();
    wireRequestAccess();
    // deep links from the request page's nav (its links can't smooth-scroll
    // cross-page, so they land here with a hash we resolve once built).
    if (location.hash === "#how" || location.hash === "#faq") {
      var target = location.hash === "#how" ? ".ath-how-head" : "#faq";
      setTimeout(function () { smoothTo(target); }, 650);
    }
    buildTagline();
    buildHeroShot();
    tweakHeroButtons();
    removeCaseStudy();
    buildLogoMarquee();
    buildHowItWorks();
    buildStatsSection();
    buildCalculator();
    buildBelowWaitlist();
    buildPricing();
    // after buildPricing: the roadmap anchors off .ath-pr, and each builder
    // early-returns once its section exists, so it has to find it first time.
    buildDisplayCards();
    buildFeatures();
    buildStudioDemo();
    var built = buildNav();
    buildFooter();
    buildHeroBadge();
    var extras = buildScrollExtras();
    wireScroll(built.nav, built.ctaText, extras.bar, extras.toTop);
    // Default theme is light; we only ever go dark when the user explicitly
    // chooses it (persisted in localStorage). No OS-preference auto-dark.
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
