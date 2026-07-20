/* =============================================================================
   Request Access form — validation, submit, success + hand-off to sign-up.

   Flow: clinic fills the form → POST /api/access-requests on the app → the
   request appears in the admin Sign-ups tab ("clinic request") → success view
   → veil fade to the app's sign-up with the email prefilled, where the account
   they create is matched back to this request by that same email.
   ========================================================================== */
(function () {
  "use strict";

  /* App origin. Overridable (window.ATH_REQ_API) for previews and testing. */
  var API_BASE = window.ATH_REQ_API || "https://app.sculptrlabs.com";
  var SIGNUP_DELAY_S = 6;

  var form = document.getElementById("req-form");
  if (!form) return;

  var submitWrap = form.querySelector(".ath-req__submit-wrap");
  var submitText = form.querySelector("#req-submit .glass-button-text");
  var formError = document.getElementById("req-error");
  var success = document.getElementById("req-success");

  function val(id) { var e = document.getElementById(id); return e ? (e.value || "").trim() : ""; }
  function emailish(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }

  /* A field id may be a plain input OR the hidden input backing a custom
     dropdown; resolve the element that shows the invalid ring + what to focus. */
  function controlFor(id) {
    var input = document.getElementById(id);
    var dd = input && input.closest ? input.closest(".ath-dd") : null;
    return { input: input, visual: dd || input, focusEl: dd ? dd.querySelector(".ath-dd__trigger") : input };
  }

  function setFieldError(id, message) {
    var c = controlFor(id);
    var slot = form.querySelector('[data-error-for="' + id + '"]');
    if (message) {
      if (c.visual) c.visual.classList.add("is-invalid");
      if (c.input && c.input.tagName === "INPUT" && c.input.type !== "hidden") c.input.setAttribute("aria-invalid", "true");
      if (slot) { slot.textContent = message; slot.classList.add("is-on"); }
    } else {
      if (c.visual) c.visual.classList.remove("is-invalid");
      if (c.input && c.input.removeAttribute) c.input.removeAttribute("aria-invalid");
      if (slot) { slot.textContent = ""; slot.classList.remove("is-on"); }
    }
  }

  var FIELDS = ["f-clinic", "f-name", "f-email", "f-instagram", "f-heard"];

  function clearErrors() {
    FIELDS.forEach(function (id) { setFieldError(id, null); });
    formError.textContent = "";
    formError.classList.remove("is-on");
  }

  function noInstagram() { var b = document.getElementById("f-noig"); return !!(b && b.checked); }

  function validate() {
    var firstBad = null;
    function bad(id, msg) { setFieldError(id, msg); if (!firstBad) firstBad = id; }
    if (!val("f-clinic")) bad("f-clinic", "Please add your clinic or practice name.");
    if (!val("f-name")) bad("f-name", "Please add your name.");
    if (!val("f-email")) bad("f-email", "Please add the email you’ll sign up with.");
    else if (!emailish(val("f-email"))) bad("f-email", "That doesn’t look like an email — double-check it.");
    if (!noInstagram() && !val("f-instagram")) bad("f-instagram", "Add your Instagram, or tick the box below.");
    if (!val("f-heard")) bad("f-heard", "Please pick one — it really helps us.");
    if (firstBad) { var c = controlFor(firstBad); if (c.focusEl && c.focusEl.focus) c.focusEl.focus(); }
    return !firstBad;
  }

  // Clear a field's error as soon as it's corrected (custom dropdowns fire a
  // synthetic "change" on their hidden input when an option is chosen).
  FIELDS.forEach(function (id) {
    var e = document.getElementById(id);
    if (!e) return;
    e.addEventListener("input", function () { setFieldError(id, null); });
    e.addEventListener("change", function () { setFieldError(id, null); });
  });

  /* --------------------------- custom dropdowns ---------------------------- */
  function closeAllDropdowns(except) {
    var open = document.querySelectorAll(".ath-dd.is-open");
    for (var i = 0; i < open.length; i++) {
      if (open[i] === except) continue;
      open[i].classList.remove("is-open");
      var t = open[i].querySelector(".ath-dd__trigger");
      if (t) t.setAttribute("aria-expanded", "false");
    }
  }
  function initDropdown(dd) {
    var trigger = dd.querySelector(".ath-dd__trigger");
    var valueEl = dd.querySelector(".ath-dd__value");
    var hidden = dd.querySelector('input[type="hidden"]');
    var opts = Array.prototype.slice.call(dd.querySelectorAll(".ath-dd__opt"));
    for (var i = 0; i < opts.length; i++) {
      opts[i].setAttribute("role", "option");
      opts[i].setAttribute("tabindex", "-1");
      opts[i].setAttribute("aria-selected", "false");
    }
    function open() {
      closeAllDropdowns(dd);
      dd.classList.add("is-open");
      trigger.setAttribute("aria-expanded", "true");
      var sel = dd.querySelector(".ath-dd__opt.is-selected") || opts[0];
      if (sel) setTimeout(function () { sel.focus(); }, 0);
    }
    function close() {
      dd.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");
    }
    function choose(opt) {
      for (var j = 0; j < opts.length; j++) { opts[j].classList.remove("is-selected"); opts[j].setAttribute("aria-selected", "false"); }
      opt.classList.add("is-selected");
      opt.setAttribute("aria-selected", "true");
      valueEl.textContent = opt.textContent;
      valueEl.classList.remove("is-placeholder");
      hidden.value = opt.getAttribute("data-value") || "";
      dd.classList.remove("is-invalid");
      try { hidden.dispatchEvent(new Event("change", { bubbles: true })); } catch (e) {}
      close();
      trigger.focus();
    }
    trigger.addEventListener("click", function (e) {
      e.stopPropagation();
      if (dd.classList.contains("is-open")) close(); else open();
    });
    trigger.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    });
    for (var k = 0; k < opts.length; k++) {
      (function (opt) {
        opt.addEventListener("click", function (e) { e.stopPropagation(); choose(opt); });
        opt.addEventListener("keydown", function (e) {
          var idx = opts.indexOf(opt);
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(opt); }
          else if (e.key === "ArrowDown") { e.preventDefault(); (opts[idx + 1] || opts[0]).focus(); }
          else if (e.key === "ArrowUp") { e.preventDefault(); (opts[idx - 1] || opts[opts.length - 1]).focus(); }
          else if (e.key === "Escape") { e.preventDefault(); close(); trigger.focus(); }
          else if (e.key === "Tab") { close(); }
        });
      })(opts[k]);
    }
  }
  var dds = document.querySelectorAll(".ath-dd");
  for (var d = 0; d < dds.length; d++) initDropdown(dds[d]);
  document.addEventListener("click", function () { closeAllDropdowns(null); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeAllDropdowns(null); });

  /* --------------- referrer reveal (picked "Colleague or friend") ---------- */
  var referrerWrap = document.getElementById("f-referrer-wrap");
  var referrerInput = document.getElementById("f-referrer");
  var heardHidden = document.getElementById("f-heard");
  if (referrerWrap && referrerInput && heardHidden) {
    heardHidden.addEventListener("change", function () {
      var on = heardHidden.value === "colleague";
      referrerWrap.classList.toggle("is-on", on);
      referrerWrap.setAttribute("aria-hidden", on ? "false" : "true");
      referrerInput.setAttribute("tabindex", on ? "0" : "-1");
      if (on) setTimeout(function () { referrerInput.focus(); }, 240);
      else referrerInput.value = "";
    });
  }

  /* ----------------------- Instagram opt-out checkbox ---------------------- */
  var noIG = document.getElementById("f-noig");
  var igInput = document.getElementById("f-instagram");
  if (noIG && igInput) {
    noIG.addEventListener("change", function () {
      igInput.disabled = noIG.checked;
      if (noIG.checked) { igInput.value = ""; setFieldError("f-instagram", null); }
      else { igInput.focus(); }
    });
  }

  function setBusy(busy) {
    submitWrap.classList.toggle("is-busy", busy);
    submitText.textContent = busy ? "Sending…" : "Send request";
  }

  function signupUrl(email) {
    return API_BASE + "/?view=signup&email=" + encodeURIComponent(email) + "&from=request";
  }
  function goToSignup(email) {
    if (window.athNavigateWithFade) window.athNavigateWithFade(signupUrl(email));
    else window.location.href = signupUrl(email);
  }

  function showSuccess(email) {
    var card = form;
    card.classList.add("is-leaving");
    setTimeout(function () {
      card.style.display = "none";
      document.getElementById("req-success-email").textContent = email;
      var continueBtn = document.getElementById("req-continue");
      continueBtn.setAttribute("href", signupUrl(email));
      continueBtn.addEventListener("click", function (e) {
        e.preventDefault();
        stopCountdown();
        goToSignup(email);
      });
      success.hidden = false;
      success.classList.add("is-in");

      // Auto-continue so the sign-up feels like step two of the same flow.
      var left = SIGNUP_DELAY_S;
      var note = document.getElementById("req-countdown");
      function tick() {
        note.textContent = "Taking you to sign-up in " + left + "s…";
        if (left <= 0) { stopCountdown(); goToSignup(email); return; }
        left -= 1;
      }
      tick();
      window.__athReqTimer = setInterval(tick, 1000);
    }, 420);
  }
  function stopCountdown() {
    if (window.__athReqTimer) { clearInterval(window.__athReqTimer); window.__athReqTimer = null; }
    var note = document.getElementById("req-countdown");
    if (note) note.textContent = "";
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    clearErrors();
    if (!validate()) return;

    var email = val("f-email");
    // "Colleague or friend" follow-up rides along in the message, so it shows
    // in the admin request panel without any schema change.
    var message = val("f-message");
    if (val("f-heard") === "colleague" && val("f-referrer")) {
      message = "Referred by: " + val("f-referrer") + (message ? "\n\n" + message : "");
    }
    var payload = {
      clinicName: val("f-clinic"),
      contactName: val("f-name"),
      role: val("f-role") || undefined,
      email: email,
      phone: val("f-phone") || undefined,
      website: noInstagram() ? undefined : (val("f-instagram") || undefined),
      heardFrom: val("f-heard"),
      message: message || undefined,
      company: val("f-company") || undefined   // honeypot
    };

    setBusy(true);
    fetch(API_BASE + "/api/access-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (res.ok) { showSuccess(email); return; }
        setBusy(false);
        formError.textContent = data.error || "Something went wrong. Please try again.";
        formError.classList.add("is-on");
      });
    }).catch(function () {
      setBusy(false);
      formError.textContent = "Could not reach the server. Check your connection and try again.";
      formError.classList.add("is-on");
    });
  });
})();
