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
  function tabsIfMobile() { if (matchMedia("(max-width: 760px)").matches) tabs(); }
  if (document.readyState !== "loading") tabsIfMobile(); else addEventListener("DOMContentLoaded", tabsIfMobile);
  addEventListener("resize", tabsIfMobile);
})();
