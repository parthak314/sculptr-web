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
    // Center nav links — `scroll` entries smooth-scroll to an in-page section.
    navLinks: [
      { label: "How it works", href: "#", scroll: ".ath-how-head" },
      { label: "FAQ", href: "#faq", scroll: "#faq" },
      { label: "Contact", href: "./contact" }
    ],
    ctaLabel: "Launch App",                 // CTA (stays the same when scrolled)
    ctaLabelScrolled: "Launch App",
    ctaHref: "https://sculptr.vercel.app",
    footerLinks: [
      { label: "How it works", href: "#", scroll: ".ath-how-head" },
      { label: "FAQ", href: "#faq", scroll: "#faq" },
      { label: "Contact", href: "./contact" },
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" }
    ],
    socials: [],   // hidden for now
    copyright: "© " + 2026 + " Sculptr. All rights reserved."
  };

  var THEME_KEY = "sculptr-theme";
  var SVGNS = "http://www.w3.org/2000/svg";

  /* --- Mobile: gently slow the continuous WebGL background ("particles") -------
     They read too fast on small screens; desktop is left exactly as-is. On phones
     we scale the timestamp handed to rAF callbacks so time-based loops (the
     endless particle shader) advance more slowly. RAF0 is the ORIGINAL, unscaled
     rAF — our own count-up / dial / swap loops use it so their speed is unchanged,
     and scaling only kicks in ~1.8s after load so the hero's one-shot fade-ins
     play at full speed first. Tune SLOW_FACTOR (or delete this block) to taste. */
  var RAF0 = window.requestAnimationFrame
    ? window.requestAnimationFrame.bind(window)
    : function (f) { return setTimeout(function () { f(Date.now()); }, 16); };
  (function slowBackgroundOnMobile() {
    var isMobile = false;
    try { isMobile = window.matchMedia && window.matchMedia("(max-width: 860px)").matches; } catch (e) {}
    if (!isMobile || !window.requestAnimationFrame) return;
    var SLOW_FACTOR = 0.55, base = null, active = false;
    setTimeout(function () { active = true; }, 1800);
    window.requestAnimationFrame = function (cb) {
      return RAF0(function (t) {
        if (!active) return cb(t);
        if (base === null) base = t;
        cb(base + (t - base) * SLOW_FACTOR);
      });
    };
  })();

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
  function buildFooter() {
    var logo = el("a", { class: "ath-footer__logo", href: CONFIG.homeHref, "aria-label": "Sculptr home" },
      [el("img", { src: CONFIG.logo, alt: "Sculptr" })]);
    var links = el("div", { class: "ath-footer__links" },
      CONFIG.footerLinks.map(function (l) {
        var a = el("a", { href: l.href, html: l.label });
        if (l.scroll) wireScrollLink(a, l.scroll);
        return a;
      }));
    // socials hidden for now (CONFIG.socials empty) — skip the block entirely
    var social = CONFIG.socials.length ? el("div", { class: "ath-footer__social" },
      CONFIG.socials.map(function (s) {
        return el("a", { href: s.href, target: "_blank", rel: "noopener noreferrer", "aria-label": s.label }, [filledIcon(s.path)]);
      })) : null;
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
    /* Watch cheaply: debounce to once-per-frame (a raw observer here ran a
       document-wide querySelectorAll on EVERY mutation — a constant main-thread
       tax that competed with scrolling), scope to <body>, and disconnect once
       things have settled. The edit bar only injects in Framer's editor context,
       so continuous observation in production is pure overhead. */
    try {
      var scheduled = false;
      var obs = new MutationObserver(function () {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(function () { scheduled = false; strip(); });
      });
      obs.observe(document.body, { childList: true, subtree: true });
      setTimeout(function () { try { obs.disconnect(); } catch (e) {} }, 30000);
    } catch (e) {}
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
    try {
      // Phones use the cheap opacity fade below (no per-letter blur / 3D perspective),
      // which was a sustained GPU cost on the hero. Same path as reduced-motion.
      reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        || window.matchMedia("(max-width: 860px)").matches;
    } catch (e) {}

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
        // Don't cycle a backgrounded tab — resume when it's visible again.
        if (document.hidden) {
          document.addEventListener("visibilitychange", function once() {
            if (document.hidden) return;
            document.removeEventListener("visibilitychange", once);
            advanceTo(nextIdx);
          });
          return;
        }
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
        // Phones get a 900px webp (~19KB, ~10x less decode RAM) instead of the
        // full 2818px hero — a real saving in scroll-time memory. Desktop keeps
        // the full-res webp; jpg is the universal fallback.
        var sourceMobile = el("source", { srcset: "assets/hero-app-mobile.webp", type: "image/webp", media: "(max-width: 860px)" });
        var source = el("source", { srcset: "assets/hero-app.webp", type: "image/webp" });
        var img = el("img", { class: "ath-heroshot__img", src: "assets/hero-app.jpg", alt: "Sculptr Studio — 2D consult", decoding: "async" });
        var pic = el("picture", null, [sourceMobile, source, img]);
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
  var MARQUEE_LOGOS = [
    { name: "Queen Mary University of London", img: "/images/qmul_logo-removebg-preview.png" },
    { name: "Imperial College London", img: "/images/avfqfm9mk-removebg-preview.png" },
    { name: "Barts and The London School of Medicine and Dentistry", img: "/images/Barts_and_The_London_School_of_Medicine_and_Dentistry_coat_of_arms.svg.png", tall: true },
    { name: "Web Summit", img: "/images/Web_Summit_logo.svg.png" }
  ];

  function buildLogoMarquee() {
    function logoNode(l) {
      var img = el("img", { class: "ath-logo__img" + (l.tall ? " ath-logo__img--tall" : ""),
        src: l.img, alt: l.name, loading: "lazy", draggable: "false" });
      return el("div", { class: "ath-logo" }, [img]);
    }
    function makeLogos() {
      // Repeat the set enough times that ONE group is wider than the viewport,
      // otherwise the marquee scrolls past the few logos and leaves an empty
      // gap each loop (the "logos disappear" bug). ~8+ items per group fills it.
      var per = MARQUEE_LOGOS.length;
      var reps = Math.max(2, Math.ceil(8 / per));
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
      var sec = el("div", { class: "ath-logos", "aria-label": "Featured logos" }, [vp]);
      hero.parentNode.insertBefore(sec, hero.nextSibling);
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
    { match: "3D facial scanning", title: "Scan",    sub: "A few photos. Any Phone." },
    { match: "facial editing",     title: "Sculpt",  sub: "Full 3D control.", cls: "ath-cap--nudge" },
    { match: "visual simulations", title: "Satisfy", sub: "Align expectations. Convert." }
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
            ps[i].innerHTML = '<span class="ath-cap-t' + ex + '">' + HOW_CAPS[j].title +
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
        if (t < 1) RAF0(frame);
      }
      RAF0(frame);
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
        if (t < 1) RAF0(frame);
      }
      RAF0(frame);
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

    function chaser(node) {
      var cur = 0, target = 0, raf = null;
      function tick() {
        var d = target - cur;
        if (Math.abs(d) < 0.5) { cur = target; node.textContent = money(cur); node.style.filter = ""; raf = null; return; }
        cur += d * 0.18;
        node.textContent = money(cur);
        var rem = Math.abs(target - cur) / (Math.abs(target) || 1);
        node.style.filter = "blur(" + Math.min(5, rem * 45).toFixed(2) + "px)";
        raf = requestAnimationFrame(tick);
      }
      return {
        set: function (v) {
          target = v;
          if (reduced()) { cur = v; node.textContent = money(v); node.style.filter = ""; if (raf) { cancelAnimationFrame(raf); raf = null; } return; }
          if (raf == null) raf = requestAnimationFrame(tick);
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

    /* ---- PLACEHOLDER data ---- */
    var TM = [
      { q: "This changed everything for me.", a: "Sarah Chen", r: "Designer at Figma",
        img: "https://images.unsplash.com/photo-1701615004837-40d8573b6652?q=80&w=1480&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { q: "Simply brilliant. Nothing else compares.", a: "Marcus Johnson", r: "Engineer at Vercel",
        img: "https://plus.unsplash.com/premium_photo-1671656349218-5218444643d8?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { q: "The attention to detail is unmatched.", a: "Elena Rodriguez", r: "Founder at Craft",
        img: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { q: "My patients love seeing the results first.", a: "James Whitfield", r: "Clinic Director",
        img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1200&auto=format&fit=crop" },
      { q: "It paid for itself within a month.", a: "Aisha Bello", r: "Aesthetic Nurse",
        img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1200&auto=format&fit=crop" },
      { q: "I can't imagine consulting without it.", a: "David Okafor", r: "Lead Practitioner",
        img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=1200&auto=format&fit=crop" }
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
          + '<span class="ath-tm__mark ath-tm__mark--l" aria-hidden="true">“</span>'
          + '<p class="ath-tm__quote">' + esc(TM[0].q) + '</p>'
          + '<span class="ath-tm__mark ath-tm__mark--r" aria-hidden="true">”</span>'
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

    var HTML = tmHTML() + countsHTML();   // team section merged into testimonials (big photo)

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
        if (t < 1) RAF0(frame); else setFinal(node);
      }
      RAF0(frame);
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
          var sec = el("section", { class: "ath-below", "aria-label": "What clinicians say and traction" });
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

  /* ----------------------------- init ------------------------------------- */
  function init() {
    killFramerEditBar();
    relabelCta();
    buildTagline();
    buildHeroShot();
    tweakHeroButtons();
    removeCaseStudy();
    buildLogoMarquee();
    buildHowItWorks();
    buildStatsSection();
    buildCalculator();
    buildBelowWaitlist();
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
