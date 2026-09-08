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
})();
