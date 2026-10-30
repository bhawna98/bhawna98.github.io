// Terminal behaviour. Without this file every function is shown as one long page.
(function () {
  "use strict";

  var FUNCS = [
    { code: "DES",  label: "Profile",         alias: ["PROFILE", "ABOUT", "BIO", "HOME", "BSHARMA"] },
    { code: "GP",   label: "Career graph",    alias: ["GRAPH", "CHART", "CAREER", "TIMELINE"] },
    { code: "DEAL", label: "Selected work",   alias: ["WORK", "WINS", "CASES", "DEALS", "RFP"] },
    { code: "HP",   label: "History",         alias: ["HISTORY", "CV", "RESUME", "EXPERIENCE", "JOBS"] },
    { code: "CN",   label: "Coverage",        alias: ["NEWS", "MEDIA", "COVERAGE", "PRESS", "TOP"] },
    { code: "ANR",  label: "Recommendations", alias: ["RECS", "RECOMMENDATIONS", "REFERENCES", "REVIEWS"] },
    { code: "HELP", label: "Questions",       alias: ["FAQ", "QUESTIONS", "?"] },
    { code: "MSG",  label: "Contact",         alias: ["CONTACT", "EMAIL", "HIRE", "IB", "CALL"] },
    { code: "CF",   label: "Download",        alias: ["PDF", "DOWNLOAD", "FILES", "PORTFOLIO"] }
  ];
  var IGNORE = { BSHARMA: 0, SP: 1, EQUITY: 1, GO: 1, "<GO>": 1 };
  var DEFAULT_STATUS = "Type a function and press Enter, or press 1 to 9.";

  var root = document.documentElement;
  var input = document.getElementById("cmd-in");
  var form = document.getElementById("cmd");
  var list = document.getElementById("cmd-list");
  var status = document.getElementById("status");
  var navLinks = document.querySelectorAll(".fkeys a");
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var current = null;

  function byCode(code) {
    for (var i = 0; i < FUNCS.length; i++) if (FUNCS[i].code === code) return FUNCS[i];
    return null;
  }

  function resolve(word) {
    if (/^[1-9]$/.test(word)) return FUNCS[+word - 1];
    for (var i = 0; i < FUNCS.length; i++) {
      var f = FUNCS[i];
      if (f.code === word || f.alias.indexOf(word) > -1) return f;
    }
    return null;
  }

  function say(text, isError) {
    status.textContent = text;
    status.classList.toggle("err", !!isError);
  }

  // ---------- routing ----------
  function show(code, target, fromUser) {
    var f = byCode(code) || FUNCS[0];
    var sec = document.getElementById(f.code);
    document.querySelectorAll(".fn.on").forEach(function (s) { s.classList.remove("on"); });
    sec.classList.add("on");
    navLinks.forEach(function (a) {
      if (a.getAttribute("href") === "#" + f.code) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    document.title = f.code + " <GO> | Bhawna Sharma";
    if (current !== f.code) say(f.code + " " + f.label + " loaded.");
    // On narrow screens the career graph opens on the most recent years.
    var wrap = sec.querySelector(".chart-wrap");
    if (wrap) wrap.scrollLeft = wrap.scrollWidth;
    current = f.code;

    if (target && target.tagName === "DETAILS") {
      target.open = true;
      target.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
      target.querySelector("summary").focus({ preventScroll: true });
    } else {
      window.scrollTo(0, 0);
      if (fromUser) sec.focus({ preventScroll: true });
    }
  }

  function route(fromUser) {
    var id = decodeURIComponent(location.hash.slice(1));
    var el = id && document.getElementById(id);
    if (!el) return show("DES", null, fromUser);
    var sec = el.classList.contains("fn") ? el : el.closest(".fn");
    show(sec ? sec.id : "DES", el === sec ? null : el, fromUser);
  }

  function go(code) {
    if (location.hash === "#" + code) show(code, null, true);
    else location.hash = code;
  }

  window.addEventListener("hashchange", function () { route(true); });

  // ---------- command line ----------
  function run(raw) {
    var words = raw.toUpperCase().replace(/<GO>/g, " ").trim().split(/\s+/).filter(Boolean);
    if (!words.length) return;
    if (words.length === 1 && words[0] === "CFA") { go("DES"); say("CFA Level I passed above the 90th percentile. Level II: November 2026."); return; }
    for (var i = words.length - 1; i >= 0; i--) {
      if (IGNORE[words[i]] === 1) continue;
      var f = resolve(words[i]);
      if (f) {
        go(f.code);
        if (words[i] === "HIRE") say("Good call. MSG Contact loaded.");
        return;
      }
    }
    if (words.every(function (w) { return w in IGNORE; })) { go("DES"); return; }
    say("Unknown function " + words.join(" ") + ". Try DES, DEAL, CN or HELP.", true);
  }

  var sel = -1, shown = [];
  function renderList() {
    var q = input.value.toUpperCase().trim();
    shown = FUNCS.filter(function (f) {
      if (!q) return true;
      return f.code.indexOf(q) === 0 ||
        f.label.toUpperCase().split(" ").some(function (w) { return w.indexOf(q) === 0; }) ||
        f.alias.some(function (a) { return a.indexOf(q) === 0; });
    });
    list.innerHTML = "";
    shown.forEach(function (f, i) {
      var li = document.createElement("li");
      li.id = "opt-" + f.code;
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", i === sel ? "true" : "false");
      li.innerHTML = "<b>" + f.code + "</b><span>" + f.label + "</span>";
      li.addEventListener("mousedown", function (e) { e.preventDefault(); pick(f); });
      list.appendChild(li);
    });
    var open = shown.length > 0 && document.activeElement === input;
    list.hidden = !open;
    input.setAttribute("aria-expanded", open ? "true" : "false");
    if (sel > -1 && shown[sel]) input.setAttribute("aria-activedescendant", "opt-" + shown[sel].code);
    else input.removeAttribute("aria-activedescendant");
  }
  function closeList() { list.hidden = true; sel = -1; input.setAttribute("aria-expanded", "false"); input.removeAttribute("aria-activedescendant"); }
  function pick(f) { input.value = ""; closeList(); input.blur(); go(f.code); }

  input.addEventListener("input", function () { sel = -1; renderList(); });
  input.addEventListener("focus", function () { sel = -1; renderList(); });
  input.addEventListener("blur", function () { setTimeout(closeList, 0); });
  input.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!shown.length) return;
      sel = e.key === "ArrowDown" ? (sel + 1) % shown.length : (sel <= 0 ? shown.length - 1 : sel - 1);
      renderList();
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (input.value) { input.value = ""; renderList(); }
      else { closeList(); input.blur(); go("DES"); }
    } else if (e.key === "Enter" && sel > -1 && shown[sel]) {
      e.preventDefault();
      pick(shown[sel]);
    }
  });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = input.value;
    input.value = "";
    closeList();
    if (!v.trim()) { input.focus(); return; }
    input.blur();
    run(v);
  });

  // Anywhere on the page: letters go to the command line, digits jump, Esc goes home.
  document.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
    var t = e.target;
    if (t === input || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable) return;
    if (e.key === "/") { e.preventDefault(); input.focus(); }
    else if (/^[1-9]$/.test(e.key)) { go(FUNCS[+e.key - 1].code); }
    else if (e.key === "Escape") { go("DES"); }
    else if (/^[a-z]$/i.test(e.key)) { input.focus(); }
  });

  // Keep sticky offsets in step with the header's real height.
  var chrome = document.getElementById("chrome");
  function measure() { root.style.setProperty("--chrome", chrome.offsetHeight + "px"); }
  measure();
  window.addEventListener("resize", measure);

  // ---------- clock ----------
  var clock = document.getElementById("clock");
  function tick() {
    try {
      var p = {};
      new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Singapore", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false })
        .formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
      clock.textContent = p.hour + ":" + p.minute + " SGT " + p.day + " " + p.month.slice(0, 3).toUpperCase();
      clock.setAttribute("datetime", new Date().toISOString());
    } catch (err) { /* old browsers keep the static label */ }
  }
  tick();
  setInterval(tick, 20000);

  // ---------- ticker: duplicate once so the loop is seamless ----------
  var track = document.querySelector(".tape-track");
  if (track) track.innerHTML += track.innerHTML;

  // ---------- CN filters ----------
  var filterBtns = document.querySelectorAll(".filters button");
  filterBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      var k = b.getAttribute("data-f");
      filterBtns.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      document.querySelectorAll(".news li").forEach(function (li) {
        li.hidden = k !== "all" && li.getAttribute("data-k") !== k;
      });
    });
  });

  // ---------- MSG: send through Web3Forms without leaving the page ----------
  var compose = document.getElementById("compose");
  var hint = document.getElementById("m-hint");
  var sendBtn = compose.querySelector("button[type=submit]");
  function note(text, cls) {
    hint.textContent = text;
    hint.className = "hint" + (cls ? " " + cls : "");
    say(text, cls === "err");
  }
  compose.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!window.fetch || !window.FormData) { compose.submit(); return; }
    sendBtn.disabled = true;
    note("Sending...");
    fetch(compose.action, { method: "POST", headers: { Accept: "application/json" }, body: new FormData(compose) })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success) throw new Error(res.message);
        compose.reset();
        note("Message sent. Bhawna will reply to your email.", "ok");
      })
      .catch(function () {
        note("Could not send. Please email bhawna98@hotmail.com instead.", "err");
      })
      .then(function () { sendBtn.disabled = false; });
  });

  // ---------- first paint: type the command, then draw the screen ----------
  if (!location.hash && !reduce) {
    root.classList.add("booting");
    route(false);
    var text = "DES", i = 0;
    input.placeholder = "";
    (function type() {
      input.value = text.slice(0, ++i);
      if (i < text.length) return setTimeout(type, 110);
      setTimeout(function () {
        input.value = "";
        input.placeholder = "Type a function, e.g. DEAL";
        root.classList.remove("booting");
        root.classList.add("booted");
        say(DEFAULT_STATUS);
      }, 260);
    })();
  } else {
    route(false);
    say(DEFAULT_STATUS);
  }
})();
