/* Tommythai – app-installasjon */
(function () {
  if ("serviceWorker" in navigator) {
    addEventListener("load", function () { navigator.serviceWorker.register("/sw.js").catch(function () {}); });
  }
  var path = location.pathname;
  var standalone = (matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  var ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  var deferred = null, KEY = "tt-install-dismissed", dismissed = false;
  try { dismissed = +localStorage.getItem(KEY) > Date.now(); } catch (e) {}
  window.ttStandalone = standalone; window.ttIos = ios; window.ttCanPrompt = function () { return !!deferred; };

  /* App-modus: ingen admin-tilgang i den installerte appen */
  if (standalone) {
    if (/admin\.html$/.test(path)) { location.replace("hjem.html"); return; }
    var hideAdmin = function () {
      document.body.classList.add("app-modus");
      document.querySelectorAll('a[href$="admin.html"]').forEach(function (a) {
        var prev = a.previousSibling;
        if (prev && prev.nodeType === 3 && /·\s*$/.test(prev.textContent)) prev.textContent = prev.textContent.replace(/\s*·\s*$/, "");
        var li = a.closest("li"); (li || a).remove();
      });
    };
    if (document.readyState !== "loading") hideAdmin(); else addEventListener("DOMContentLoaded", hideAdmin);
  }

  function removeBar() { var d = document.getElementById("tt-install"); if (d) d.remove(); }
  function bar() {
    if (standalone || document.getElementById("tt-install") || /index\.html$|\/$|admin\.html$|app\.html$/.test(path)) return;
    var d = document.createElement("div"); d.id = "tt-install";
    d.innerHTML = '<span>Få <b>Tommythai</b> som app på hjemskjermen</span><a class="knapp" id="tt-inst-btn" href="app.html">Last ned</a><button id="tt-inst-x" type="button" aria-label="Lukk">&#10005;</button>';
    document.body.appendChild(d);
    document.getElementById("tt-inst-btn").addEventListener("click", function (ev) { if (deferred) { ev.preventDefault(); install(); } });
    document.getElementById("tt-inst-x").addEventListener("click", function () { removeBar(); try { localStorage.setItem(KEY, Date.now() + 7 * 864e5); } catch (e) {} });
  }
  function install() {
    if (!deferred) { if (!/app\.html$/.test(path)) location.href = "app.html"; return Promise.resolve("none"); }
    var p = deferred; deferred = null;
    p.prompt();
    return p.userChoice.then(function (r) { if (r.outcome === "accepted") removeBar(); else deferred = p; return r.outcome; });
  }
  window.ttInstall = install;
  addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault(); deferred = e;
    document.dispatchEvent(new Event("tt-installable"));
    if (!dismissed) { if (document.body) bar(); else addEventListener("DOMContentLoaded", bar); }
  });
  if (ios && !dismissed) { if (document.readyState !== "loading") bar(); else addEventListener("DOMContentLoaded", bar); }
  addEventListener("appinstalled", function () { removeBar(); document.dispatchEvent(new Event("tt-installed")); });

  /* Fanelinje nederst på mobil – enklere navigasjon */
  function tabs() {
    if (/index\.html$|\/$|admin\.html$/.test(path) || document.querySelector(".tt-faner")) return;
    var I = {
      hjem: '<svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M10 20v-5h4v5"/></svg>',
      meny: '<svg viewBox="0 0 24 24"><path d="M7 3v8"/><path d="M5 3v4a2 2 0 0 0 4 0V3"/><path d="M7 11v10"/><path d="M16 3c-2 2-2 6-2 8h4c0-2 0-6-2-8z"/><path d="M16 11v10"/></svg>',
      events: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17"/><path d="M8 3v4M16 3v4"/></svg>',
      send: '<svg viewBox="0 0 24 24"><path d="M21 3 3 10.5l7.5 2.5L13 21z"/><path d="M10.5 13 21 3"/></svg>',
      mer: '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
    };
    var here = path.replace(/^.*\//, "") || "hjem.html";
    var items = [
      ["hjem.html", "Hjem", I.hjem], ["meny.html", "Menyer", I.meny], ["events.html", "Events", I.events],
      ["hjem.html#forespoersel", "Forespørsel", I.send, "cta"]
    ];
    var n = document.createElement("div"); n.className = "tt-faner"; n.setAttribute("role", "navigation"); n.setAttribute("aria-label", "Hurtigmeny");
    n.innerHTML = items.map(function (it) {
      var act = it[0] === here && !it[3] ? " aktiv" : "";
      return '<a href="' + it[0] + '" class="' + (it[3] || "") + act + '">' + it[2] + '<span>' + it[1] + '</span></a>';
    }).join("") + '<button type="button" id="tt-mer">' + I.mer + '<span>Meny</span></button>';
    document.body.appendChild(n); document.body.classList.add("har-faner");
    document.getElementById("tt-mer").addEventListener("click", function () {
      var t = document.getElementById("nav-t"); if (t) { t.checked = !t.checked; if (t.checked) scrollTo({ top: 0, behavior: "smooth" }); }
    });
  }
  /* Bilder: små, raske miniatyrer i galleriet – full oppløsning når du trykker */
  var THUMB_W = 640, FULL_W = 2000;
  function scaled(src, w) {
    // Gratis bildeproxy som skalerer på farten (wsrv.nl). Kun for vanlige bildefiler på nett.
    if (!/^https?:/.test(src) && !/^\//.test(src) && !/^[\w-]/.test(src)) return null;
    if (/^data:|\.svg(\?|$)/i.test(src)) return null;
    var abs = new URL(src, location.href).href;
    return "https://wsrv.nl/?url=" + encodeURIComponent(abs) + "&w=" + w + "&q=82&output=webp&we";
  }
  function prepImages() {
    var imgs = document.querySelectorAll(".galleri img, img.bilde, article.post img, .event img");
    imgs.forEach(function (img) {
      if (img.dataset.prepped) return; img.dataset.prepped = "1";
      img.loading = "lazy"; img.decoding = "async";
      var orig = img.getAttribute("src"), thumb = scaled(orig, THUMB_W);
      img.dataset.full = orig;
      if (thumb) {
        img.addEventListener("error", function () { if (img.src !== new URL(orig, location.href).href) img.src = orig; }, { once: true });
        img.src = thumb;
      }
      img.style.cursor = "zoom-in";
      img.addEventListener("click", function (e) { e.preventDefault(); openLightbox(Array.prototype.slice.call(imgs), Array.prototype.indexOf.call(imgs, img)); });
    });
    var logo = document.querySelector("header img.logo");
    if (logo && !logo.dataset.prepped) { logo.dataset.prepped = "1"; var l = scaled(logo.getAttribute("src"), 900); if (l) { var o = logo.getAttribute("src"); logo.addEventListener("error", function () { logo.src = o; }, { once: true }); logo.src = l; } }
  }
  function openLightbox(list, idx) {
    var lb = document.getElementById("tt-lys");
    if (!lb) {
      lb = document.createElement("div"); lb.id = "tt-lys"; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-label", "Bildevisning");
      lb.innerHTML = '<div class="tt-lys-ramme"><img alt=""></div><button class="tt-lys-x" type="button" aria-label="Lukk">&#10005;</button><button class="tt-lys-p" type="button" aria-label="Forrige">&#8249;</button><button class="tt-lys-n" type="button" aria-label="Neste">&#8250;</button><div class="tt-lys-tekst"></div><div class="tt-lys-last">Laster full oppløsning…</div>';
      document.body.appendChild(lb);
      lb.querySelector(".tt-lys-x").addEventListener("click", closeLightbox);
      lb.addEventListener("click", function (e) { if (e.target === lb || e.target.classList.contains("tt-lys-ramme")) closeLightbox(); });
      lb.querySelector(".tt-lys-p").addEventListener("click", function () { show(cur - 1); });
      lb.querySelector(".tt-lys-n").addEventListener("click", function () { show(cur + 1); });
      var img = lb.querySelector("img"), ramme = lb.querySelector(".tt-lys-ramme");
      img.addEventListener("dblclick", function () { ramme.classList.toggle("zoom"); });
      var tx = 0, tlast = 0;
      lb.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; var now = Date.now(); if (now - tlast < 300) ramme.classList.toggle("zoom"); tlast = now; }, { passive: true });
      lb.addEventListener("touchend", function (e) { if (ramme.classList.contains("zoom")) return; var dx = e.changedTouches[0].clientX - tx; if (dx > 60) show(cur - 1); else if (dx < -60) show(cur + 1); }, { passive: true });
      addEventListener("keydown", function (e) { if (!lb.classList.contains("vis")) return; if (e.key === "Escape") closeLightbox(); if (e.key === "ArrowLeft") show(cur - 1); if (e.key === "ArrowRight") show(cur + 1); });
    }
    var cur = idx, items = list;
    function show(i) {
      cur = (i + items.length) % items.length;
      var src = items[cur].dataset.full || items[cur].src, full = scaled(src, FULL_W) || src;
      var img = lb.querySelector("img"), last = lb.querySelector(".tt-lys-last");
      lb.querySelector(".tt-lys-ramme").classList.remove("zoom");
      img.src = items[cur].currentSrc || items[cur].src; last.style.display = "block";
      var hi = new Image(); hi.onload = function () { if (cur === i || cur === (i + items.length) % items.length) { img.src = hi.src; last.style.display = "none"; } }; hi.onerror = function () { img.src = src; last.style.display = "none"; }; hi.src = full;
      var cap = items[cur].closest("figure"); var fc = cap && cap.querySelector("figcaption");
      lb.querySelector(".tt-lys-tekst").textContent = fc ? fc.textContent : (items[cur].alt || "");
      lb.querySelector(".tt-lys-p").style.display = lb.querySelector(".tt-lys-n").style.display = items.length > 1 ? "" : "none";
    }
    lb.show = show; lb.classList.add("vis"); document.body.style.overflow = "hidden"; show(cur);
  }
  function closeLightbox() { var lb = document.getElementById("tt-lys"); if (lb) { lb.classList.remove("vis"); document.body.style.overflow = ""; } }
  if (document.readyState !== "loading") prepImages(); else addEventListener("DOMContentLoaded", prepImages);

  function tabsIfMobile() { if (matchMedia("(max-width: 760px)").matches) tabs(); }
  if (document.readyState !== "loading") tabsIfMobile(); else addEventListener("DOMContentLoaded", tabsIfMobile);
  addEventListener("resize", tabsIfMobile);
})();
