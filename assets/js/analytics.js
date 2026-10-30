// Google Analytics 4. Set the measurement ID once here; every page loads this file.
// Each terminal function (DES, GP, DEAL...) is reported as its own page, e.g. /GP.
(function () {
  "use strict";
  var GA_ID = "G-R4J9R0F5J7";

  var live = /^G-[A-Z0-9]+$/.test(GA_ID) && GA_ID !== "G-XXXXXXXXXX" &&
    !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  var sent = null;

  // Called by terminal.js when a function loads; other pages report themselves below.
  window.trackPage = function (code, label) {
    if (!live || sent === code) return;
    sent = code;
    gtag("event", "page_view", {
      page_title: code + " " + label + " | Bhawna Sharma",
      page_location: location.origin + "/" + code + location.search,
      page_referrer: document.referrer
    });
  };
  window.trackEvent = function (name, params) {
    if (live) gtag("event", name, params || {});
  };

  if (!live) return;
  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
  document.head.appendChild(s);
  gtag("js", new Date());
  gtag("config", GA_ID, { send_page_view: false });
  if (!document.getElementById("cmd")) gtag("event", "page_view");
  else if (window.pendingPage) window.trackPage.apply(null, window.pendingPage);
})();
