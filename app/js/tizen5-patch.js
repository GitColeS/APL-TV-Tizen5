/* ============================================================
   tizen5-patch.js: a small layer over the official APL TV code. boot.js loads it LAST, over the
   installed version or over an automatic update; an update never replaces it. ES5.

   1. Header bar: on Home and Library, "in-rows" (set while a row is focused) hides the top bar.
      When a page has no banner, leaving the rows for the tab bar kept the state, and the bar stayed
      hidden with the focus on it. Whenever the focus is on the tab bar, the state is cleared.
      (A class that is already set and stays set fires no change event, so this is checked by timer.)

   2. Pluto TV audio: a Pluto TV playlist lists its English audio twice, inside the video segments and as a
      separate audio-only stream. AVPlay on Tizen 5 picks the separate one and plays no sound. A Pluto stream is
      therefore opened through the helper service's /hls (service.js), which hands over the same playlist without
      the separate audio entry. If the helper is not answering, or anything fails, the stream is opened as it comes.
   ============================================================ */
(function (global) {
    "use strict";

    /* ---------- 1. header ---------- */
    function fix() {
        try {
            var TV = global.TV, b = document.body;
            if (b && TV && TV.shell && TV.shell.focusOn && b.classList.contains("in-rows") && TV.shell.focusOn() === "tabs") {
                b.classList.remove("in-rows");
            }
        } catch (e) {}
    }
    setInterval(fix, 150);
    document.addEventListener("keydown", function () { setTimeout(fix, 60); }, true);

    /* ---------- 2. Pluto TV audio ---------- */
    var PLUTO = /^https?:\/\/(jmp2\.uk\/plu-[0-9a-f]+\.m3u8|[a-z0-9.-]*\.pluto\.tv\/)/i;
    var helperUp = false, viaHelper = false, hooked = false, blockedUntil = 0;

    function base() {
        var TV = global.TV;
        return "http://127.0.0.1:" + ((TV && TV.helper && TV.helper.PORT) || 8765);
    }

    /* Is the helper answering? If not, start it (the app does the same whenever it needs it). A /ping also
       counts as a request, so the helper does not close itself after its 15 idle minutes while this runs. */
    function check() {
        var TV = global.TV;
        if (!TV || !TV.http || !TV.helper || !TV.helper.start) return;
        TV.http(base() + "/ping", { timeout: 1500 }).then(function (r) {
            if (r.status !== 200) throw new Error("no");
            helperUp = Date.now() >= blockedUntil;
        }).then(null, function () {
            return TV.helper.start().then(function () { helperUp = Date.now() >= blockedUntil; }, function () { helperUp = false; });
        });
    }

    function hasPluto() {
        try {
            var c = global.TV.data.catalog(), chans = (c && c.live && c.live.chans) || [];
            for (var i = 0; i < chans.length; i++) if (PLUTO.test(chans[i].url || "")) return true;
        } catch (e) {}
        return false;
    }

    function hook() {
        var av = global.webapis && global.webapis.avplay;
        if (hooked || !av || typeof av.open !== "function") return;
        hooked = true;
        var open = av.open, prepare = av.prepareAsync;
        av.open = function (url) {
            var u = url;
            viaHelper = false;
            try {
                if (typeof url === "string" && PLUTO.test(url)) {
                    if (helperUp) { u = base() + "/hls.m3u8?u=" + encodeURIComponent(url) + (global.TV && global.TV.pref && global.TV.pref("t5debug") ? "&d=1" : ""); viaHelper = true; }
                    else check();                                    // asleep: woken for the next channel, this one plays as before
                }
            } catch (e) { u = url; viaHelper = false; }
            return open.call(av, u);
        };
        if (typeof prepare === "function") {
            av.prepareAsync = function (ok, fail) {
                var via = viaHelper;
                viaHelper = false;
                return prepare.call(av, ok, function (e) {
                    if (via) { helperUp = false; blockedUntil = Date.now() + 10 * 60 * 1000; }   // the helper path failed: plain addresses for 10 minutes
                    if (typeof fail === "function") fail(e);
                });
            };
        }
    }

    hook();
    setTimeout(hook, 2000);
    // soon after the start (the playlist is read within seconds): until the helper has answered once
    [6000, 15000, 30000, 60000, 120000].forEach(function (ms) { setTimeout(function () { if (!helperUp && hasPluto()) check(); }, ms); });
    // then every few minutes: keeps the helper awake while the app runs, and notices if it stopped
    setInterval(function () { if (hasPluto()) check(); }, 4 * 60 * 1000);

    /* ---------- 3. diagnostics: the app's own log, readable from a PC on the home network ---------- */
    // While Settings > Tizen 5 Diagnostics is on, the lines TV.log keeps (updates, errors, playback) are sent to the helper
    // every few seconds; it shows them at http://<screen>:8765/hls-debug. Off: nothing is sent and the helper clears its notes.
    // TV.log already hides passwords in addresses (TV.redact).
    var sentTotal = -1, wasOn = false, sending = false;
    function errLine(prefix, m) { try { global.TV.log(prefix + ": " + String(m).slice(0, 300)); } catch (e) {} }
    global.addEventListener("error", function (ev) { errLine("js error", (ev && ev.message) + " @" + String(ev && ev.filename || "").split("/").pop() + ":" + (ev && ev.lineno)); });
    global.addEventListener("unhandledrejection", function (ev) { errLine("unhandled rejection", ev && ev.reason && (ev.reason.message || ev.reason)); });
    function flush() {
        var TV = global.TV;
        if (!TV || !TV.pref || !TV.http || sending) return;
        var on = !!TV.pref("t5debug");
        if (!on && !wasOn) return;
        var total = TV.logTotal || 0, lines = [];
        if (on) {
            if (sentTotal < 0) sentTotal = Math.max(0, total - (TV.logs || []).length);       // first time: everything still kept
            var n = Math.min(total - sentTotal, (TV.logs || []).length);
            if (n > 0) lines = TV.logs.slice(TV.logs.length - n);
        }
        if (on && !lines.length && wasOn) return;
        sending = true;
        TV.http(base() + "/t5log", { method: "POST", timeout: 4000, body: JSON.stringify({ d: on ? 1 : 0, lines: lines }) }).then(function (r) {
            if (r.status === 200) { wasOn = on; if (on) sentTotal = total; else sentTotal = -1; }
        }).then(null, function () { if (on) check(); }).then(function () { sending = false; });
    }
    setInterval(flush, 4000);
})(window);
