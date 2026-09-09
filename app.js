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
    // Store skjermer (foldetelefon, nettbrett, "desktop"-visning): lås appen til mobilbredde så teksten blir stor
    if (screen.width > 760 || innerWidth > 760) {
      var vp = document.querySelector('meta[name="viewport"]');
      if (!vp) { vp = document.createElement("meta"); vp.name = "viewport"; document.head.appendChild(vp); }
      vp.content = "width=480, initial-scale=1, viewport-fit=cover";
    }
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

  /* Én stor Meny-knapp nederst på mobil – åpner hele menyen med alle temaene */
  var ICONS = {
    "hjem.html": '<svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M10 20v-5h4v5"/></svg>',
    "artikler.html": '<svg viewBox="0 0 24 24"><rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
    "bilder.html": '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M4 17l5-4 3 2.5 3-3.5 5 5"/></svg>',
    "meny.html": '<svg viewBox="0 0 24 24"><path d="M7 3v8"/><path d="M5 3v4a2 2 0 0 0 4 0V3"/><path d="M7 11v10"/><path d="M16 3c-2 2-2 6-2 8h4c0-2 0-6-2-8z"/><path d="M16 11v10"/></svg>',
    "oppskrifter.html": '<svg viewBox="0 0 24 24"><path d="M6 3v6a3 3 0 0 0 3 3v9"/><path d="M6 3v6M9 3v6M12 3v6"/><path d="M18 3c-2.2 1.2-3 3-3 6s.8 4.5 3 6v6"/></svg>',
    "events.html": '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17"/><path d="M8 3v4M16 3v4"/></svg>',
    "app.html": '<svg viewBox="0 0 24 24"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18h2"/></svg>',
    "forespoersel.html": '<svg viewBox="0 0 24 24"><path d="M21 3 3 10.5l7.5 2.5L13 21z"/><path d="M10.5 13 21 3"/></svg>',
    "personvern.html": '<svg viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/></svg>',
    "admin.html": '<svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>'
  };
  function menuButton() {
    if (/index\.html$|\/$|admin\.html$/.test(path) || document.querySelector(".tt-menyknapp")) return;
    var t = document.getElementById("nav-t"), ul = document.querySelector(".nav-l");
    if (!t || !ul) return;
    // ikoner + overskrift i menyen
    ul.querySelectorAll("a").forEach(function (a) {
      var key = a.getAttribute("href");
      if (key === "forespoersel.html" && !a.dataset.relabel) { a.dataset.relabel = "1"; a.textContent = "Catering-forespørsel"; }
      if (ICONS[key] && !a.querySelector("svg")) a.insertAdjacentHTML("afterbegin", ICONS[key]);
    });
    if (!ul.querySelector(".nav-topp")) {
      var li = document.createElement("li"); li.className = "nav-topp";
      li.innerHTML = '<span>Meny</span><button type="button" class="nav-lukk" aria-label="Lukk menyen">&#10005;</button>';
      ul.insertBefore(li, ul.firstChild);
      li.querySelector("button").addEventListener("click", function () { t.checked = false; sync(); });
    }
    if (!ul.querySelector(".nav-personvern")) {
      var lp = document.createElement("li"); lp.className = "nav-personvern";
      lp.innerHTML = '<a href="personvern.html">' + ICONS["personvern.html"] + 'Personvern</a>';
      var adm = ul.querySelector("a.admin"); if (adm) ul.insertBefore(lp, adm.closest("li")); else ul.appendChild(lp);
    }
    var wrap = document.createElement("div"); wrap.className = "tt-menyknapp";
    wrap.innerHTML = '<button type="button" id="tt-meny-btn" aria-controls="nav-t" aria-expanded="false"><svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg><span>Meny</span></button>';
    document.body.appendChild(wrap); document.body.classList.add("har-faner");
    var btn = wrap.querySelector("button");
    function sync() {
      var open = t.checked;
      document.body.classList.toggle("meny-aapen", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.innerHTML = open ? '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg><span>Lukk</span>' : '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg><span>Meny</span>';
    }
    btn.addEventListener("click", function () { t.checked = !t.checked; sync(); });
    t.addEventListener("change", sync);
    ul.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { t.checked = false; sync(); }); });
    sync();
  }
  function tabsIfMobile() { if (matchMedia("(max-width: 760px)").matches || (standalone && matchMedia("(max-width: 1400px)").matches)) menuButton(); }
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

  if (document.readyState !== "loading") tabsIfMobile(); else addEventListener("DOMContentLoaded", tabsIfMobile);
  addEventListener("resize", tabsIfMobile);
})();
