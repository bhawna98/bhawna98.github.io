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
  var HOME_TITLE = document.title;

  function trackView(f) {
    if (window.trackPage) window.trackPage(f.code, f.label);
    else window.pendingPage = [f.code, f.label];
  }

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
    // The home view keeps the descriptive title search engines show; the rest read like the terminal.
    document.title = f.code === "DES" ? HOME_TITLE : f.code + " <GO> | Bhawna Sharma";
    if (current !== f.code) { say(f.code + " " + f.label + " loaded."); trackView(f); }
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
        if (window.trackEvent) window.trackEvent("generate_lead", { method: "contact_form" });
        note("Message sent. Bhawna will reply to your email.", "ok");
      })
      .catch(function () {
        note("Could not send. Please email bhawna98@hotmail.com instead.", "err");
      })
      .then(function () { sendBtn.disabled = false; });
  });

  // ---------- GP: crosshair, highlights and a readout strip ----------
  // Positions come straight from the SVG: x = 120 + (year - 2016.583) * 80.
  var gp = document.querySelector("svg.gp");
  var readout = document.getElementById("gp-read");
  if (gp && readout) (function () {
    var X0 = 120, X1 = 933.4, PER_YEAR = 80, Y0 = 2016.583;
    var MONTHS = "JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC".split(" ");
    var LANES = [["study", "Study"], ["cfa", "CFA"], ["comms", "Comms"], ["pm", "Private mkts"]];
    var xhair = gp.querySelector(".xhair");
    var xline = xhair.querySelector("line"), xtag = xhair.querySelector("rect"), xtext = xhair.querySelector("text");

    function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; }); }
    function monthAt(x) {
      var m = Math.floor((Y0 + (x - X0) / PER_YEAR) * 12 + 1e-6);
      return MONTHS[m % 12] + " " + Math.floor(m / 12);
    }
    // Details for a bar come from its HP row, so the chart never repeats content.
    var items = [].map.call(gp.querySelectorAll(".item"), function (g) {
      var r = g.querySelector("rect"), x = +r.getAttribute("x"), w = +r.getAttribute("width");
      var hp = g.getAttribute("data-hp") && document.getElementById(g.getAttribute("data-hp"));
      var pick = function (sel, attr) { return hp ? hp.querySelector(sel).textContent : g.getAttribute(attr); };
      var info = { g: g, x: x, end: x + w + (g.querySelector(".future") ? 13.3 : 0), lane: g.parentNode.classList[1],
        org: pick(".org", "data-org"), pos: pick(".pos", "data-pos"), d: pick(".d", "data-d"), hp: hp };
      g.setAttribute("aria-label", info.org + ", " + info.pos + ", " + info.d);
      if (hp) g.setAttribute("role", "link");
      return info;
    });
    var flags = [].map.call(gp.querySelectorAll(".flag"), function (g) {
      var n = g.getAttribute("data-flag"), row = document.querySelector('.legend tr[data-flag="' + n + '"]');
      var cells = row.querySelectorAll("td");
      var info = { g: g, n: n, row: row, x: +g.querySelector("line").getAttribute("x1"), d: cells[1].textContent, text: cells[2].textContent };
      g.setAttribute("aria-label", "Flag " + n + ", " + info.d + ": " + info.text);
      return info;
    });

    function paint(x, onItem, onFlag) {
      x = Math.max(X0, Math.min(X1, x));
      var cols = { study: [], cfa: [], comms: [], pm: [] };
      items.forEach(function (it) {
        var hot = onItem ? it === onItem : x >= it.x - 0.5 && x <= it.end + 0.5;
        it.g.classList.toggle("hot", hot);
        if (hot) cols[it.lane].push(it);
      });
      var flag = onFlag || null;
      if (!flag && !onItem) flags.forEach(function (f) { if (Math.abs(f.x + 4 - x) <= 6) flag = f; });
      flags.forEach(function (f) { f.g.classList.toggle("hot", f === flag); f.row.classList.toggle("hot", f === flag); });

      gp.classList.add("hovering");
      xline.setAttribute("x1", x); xline.setAttribute("x2", x);
      var tx = Math.max(X0 + 30, Math.min(X1, x));
      xtag.setAttribute("x", tx - 30); xtext.setAttribute("x", tx);
      xtext.textContent = monthAt(x);

      render(onItem ? esc(onItem.d) : monthAt(x), onItem && onItem.hp ? "Enter or click: open in HP" : "", cols, flag);
      readout.classList.add("live");
    }
    // Always the same rows, so the chart below never jumps while the pointer moves.
    function render(date, hint, cols, flag) {
      var html = '<p class="gr-date"><b>' + date + '</b><span class="gr-hint">' + hint + "</span></p><dl>";
      LANES.forEach(function (l) {
        var its = cols[l[0]] || [];
        html += '<div class="gr-' + l[0] + (its.length ? "" : " off") + '"><dt>' + l[1] + "</dt><dd>" +
          (its.length ? its.map(function (it) { return "<b>" + esc(it.org) + "</b> " + esc(it.pos); }).join("; ") : "&ndash;") + "</dd></div>";
      });
      html += '</dl><p class="gr-flag' + (flag ? "" : " off") + '">' +
        (flag ? "<i>" + flag.n + "</i>" + esc(flag.d) + " &middot; " + esc(flag.text) : "<i>&ndash;</i>No flagged event at this date") + "</p>";
      readout.innerHTML = html;
    }
    function clear() {
      gp.classList.remove("hovering");
      items.forEach(function (it) { it.g.classList.remove("hot"); });
      flags.forEach(function (f) { f.g.classList.remove("hot"); f.row.classList.remove("hot"); });
      readout.classList.remove("live");
      render("GP", "Move across the chart to read any month.", {}, null);
    }
    function svgX(e) {
      var pt = gp.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      return pt.matrixTransform(gp.getScreenCTM().inverse()).x;
    }
    function owner(t, list) { for (var i = 0; i < list.length; i++) if (list[i].g.contains(t)) return list[i]; return null; }

    gp.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      var it = owner(e.target, items), fl = owner(e.target, flags);
      paint(fl ? fl.x : svgX(e), it, fl);
    });
    gp.addEventListener("pointerleave", function () { if (!gp.contains(document.activeElement)) clear(); });
    gp.addEventListener("focusin", function (e) {
      var it = owner(e.target, items), fl = owner(e.target, flags);
      if (it) paint((it.x + Math.min(it.end, X1)) / 2, it, null);
      else if (fl) paint(fl.x, null, fl);
    });
    gp.addEventListener("focusout", function (e) { if (!gp.contains(e.relatedTarget)) clear(); });
    function open(it) { if (it && it.hp) location.hash = it.hp.id; }
    gp.addEventListener("click", function (e) {
      var it = owner(e.target, items);
      if (it && it.hp) open(it);
      else paint(svgX(e), it, owner(e.target, flags));
    });
    gp.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { var it = owner(e.target, items); if (it && it.hp) { e.preventDefault(); open(it); } }
    });
    // The legend and the flags point at each other.
    flags.forEach(function (f) {
      f.row.addEventListener("mouseenter", function () { paint(f.x, null, f); });
      f.row.addEventListener("mouseleave", clear);
    });
    readout.hidden = false;
    clear();
  })();

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
