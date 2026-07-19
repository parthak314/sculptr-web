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

  function val(id) { return (document.getElementById(id).value || "").trim(); }
  function emailish(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }

  function setFieldError(id, message) {
    var input = document.getElementById(id);
    var slot = form.querySelector('[data-error-for="' + id + '"]');
    if (message) {
      input.setAttribute("aria-invalid", "true");
      if (slot) { slot.textContent = message; slot.classList.add("is-on"); }
    } else {
      input.removeAttribute("aria-invalid");
      if (slot) { slot.textContent = ""; slot.classList.remove("is-on"); }
    }
  }

  function clearErrors() {
    ["f-clinic", "f-name", "f-email", "f-heard"].forEach(function (id) { setFieldError(id, null); });
    formError.textContent = "";
    formError.classList.remove("is-on");
  }

  function validate() {
    var firstBad = null;
    function bad(id, msg) { setFieldError(id, msg); if (!firstBad) firstBad = id; }
    if (!val("f-clinic")) bad("f-clinic", "Please add your clinic or practice name.");
    if (!val("f-name")) bad("f-name", "Please add your name.");
    if (!val("f-email")) bad("f-email", "Please add the email you’ll sign up with.");
    else if (!emailish(val("f-email"))) bad("f-email", "That doesn’t look like an email — double-check it.");
    if (!val("f-heard")) bad("f-heard", "Please pick one — it really helps us.");
    if (firstBad) document.getElementById(firstBad).focus();
    return !firstBad;
  }

  // Clear a field's error as soon as it's corrected.
  ["f-clinic", "f-name", "f-email", "f-heard"].forEach(function (id) {
    document.getElementById(id).addEventListener("input", function () { setFieldError(id, null); });
    document.getElementById(id).addEventListener("change", function () { setFieldError(id, null); });
  });

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
    var payload = {
      clinicName: val("f-clinic"),
      contactName: val("f-name"),
      role: val("f-role") || undefined,
      email: email,
      phone: val("f-phone") || undefined,
      website: val("f-website") || undefined,
      heardFrom: val("f-heard"),
      message: val("f-message") || undefined,
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
