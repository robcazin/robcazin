import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import type { NextRequest } from "next/server";

const ROOT = path.join(process.cwd(), "vendor/iwrzwr-visual-archive");

/** Full-bleed square pages. The archive isolator would squash them to a 44px strip. */
const NO_ISOLATE = new Set([
  "studies/signal-assembly.html",
  "studies/phase-mechanics.html",
  "studies/orbital-memory.html",
  "studies/square-signal-assembly.html",
  "studies/square-signal-assembly-slow.html",
]);

const fileCache = new Map<string, { mtimeMs: number; bytes: Buffer }>();
const htmlCache = new Map<string, { mtimeMs: number; html: string }>();

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

/**
 * Forwards the site's analyser into the archive's existing iwrSignal seam.
 * Sketches that never read iwrSignal keep their own simulated motion.
 */
const AUDIO_BRIDGE = `<script>
(function () {
  var history = [];
  var state = {
    active: false, source: "off", mode: "play", status: "off",
    level: 0, low: 0, mid: 0, high: 0, amp: 0, pulse: 0, hit: 0,
    kickAge: 30, snareAge: 30, hatAge: 30, noteAge: 30,
    beat: 0, loopTime: 0, songTime: 0
  };
  function nearest(age, key) {
    if (!history.length) return state[key] || 0;
    var target = performance.now() / 1000 - (age || 0);
    var best = history[0];
    for (var i = 1; i < history.length; i++) {
      if (Math.abs(history[i].t - target) < Math.abs(best.t - target)) best = history[i];
    }
    return best[key] || 0;
  }
  window.iwrSignal = {
    get active() { return state.active; },
    get source() { return state.source; },
    get mode() { return state.mode; },
    get status() { return state.status; },
    get level() { return state.level; },
    get low() { return state.low; },
    get mid() { return state.mid; },
    get high() { return state.high; },
    get amp() { return state.amp; },
    get pulse() { return state.pulse; },
    get hit() { return state.hit; },
    get kickAge() { return state.kickAge; },
    get snareAge() { return state.snareAge; },
    get hatAge() { return state.hatAge; },
    get noteAge() { return state.noteAge; },
    get beat() { return state.beat; },
    get loopTime() { return state.loopTime; },
    get songTime() { return state.songTime; },
    levelAt: function (age) { return nearest(age, "level"); },
    hitAt: function (age) { return nearest(age, "hit"); },
    bandAt: function (band, age) {
      var key = band === "amp" ? "level" : band;
      return nearest(age, key);
    },
    spectrumAt: function (freq, age) {
      var f = typeof freq === "number" ? freq : 0.5;
      if (f < 0.33) return nearest(age, "low");
      if (f < 0.66) return nearest(age, "mid");
      return nearest(age, "high");
    },
    eventAt: function (kind) {
      var age = state[kind + "Age"];
      return { n: Math.floor(state.beat), age: typeof age === "number" ? age : 30 };
    }
  };
  var contexts = [];
  function wrapAudio(name) {
    var Native = window[name];
    if (typeof Native !== "function") return;
    var Wrapped = function (options) {
      var ctx = new Native(options);
      contexts.push(ctx);
      return ctx;
    };
    Wrapped.prototype = Native.prototype;
    window[name] = Wrapped;
  }
  wrapAudio("AudioContext");
  wrapAudio("webkitAudioContext");
  function closeAudio() {
    contexts.forEach(function (ctx) {
      try { ctx.close(); } catch (e) {}
    });
    contexts = [];
  }
  window.addEventListener("pagehide", closeAudio);
  window.addEventListener("message", function (event) {
    var data = event.data;
    if (!data || data.type !== "iwr-audio") return;
    state.active = !!data.active;
    state.source = data.active ? "track" : "off";
    state.status = data.active ? "playing" : "off";
    state.level = data.level || 0;
    state.low = data.low || 0;
    state.mid = data.mid || 0;
    state.high = data.high || 0;
    state.amp = data.level || 0;
    state.hit = data.hit || 0;
    state.pulse = data.hit || 0;
    state.kickAge = data.kickAge;
    state.snareAge = data.snareAge;
    state.hatAge = data.hatAge;
    state.noteAge = data.noteAge;
    state.beat = data.beat || 0;
    state.songTime = data.songTime || 0;
    state.loopTime = data.songTime || 0;
    history.push({
      t: performance.now() / 1000,
      level: state.level, hit: state.hit,
      low: state.low, mid: state.mid, high: state.high
    });
    if (history.length > 200) history.shift();
  });
  window.__iwrTempo = { bpm: 0, beat: 0, phase: 0, bar: 0, barPhase: 0 };
  window.addEventListener("message", function (event) {
    var data = event.data;
    if (!data || data.type !== "iwr-tempo") return;
    window.__iwrTempo = data;
  });
  window.addEventListener("message", function (event) {
    var data = event.data;
    if (!data || data.type !== "iwr-dispose") return;
    closeAudio();
    window.requestAnimationFrame = function () { return 0; };
    window.cancelAnimationFrame = function () {};
  });
})();
</script>`;

/**
 * Phone studies keep their canvas inside a `[class*="controls"]` node that
 * typography.css sets to display:none. position:fixed does not escape that,
 * so the first measure is 0×0 and the sketch bakes a 1px bitmap. Browser zoom
 * changes devicePixelRatio without a CSS-box change, and ResizeObserver does
 * not run, so the bitmap stays stale. This sizes the visible canvas from the
 * iframe viewport and pokes the sketch's own resize on zoom.
 * Square studies paint a fixed 1080 buffer; only their CSS box tracks the iframe.
 * Strip studies are authored at 226×44. The canvas keeps that layout size so
 * the sketch does not redraw a wider composition, then a uniform scale fits
 * it in the iframe. getBoundingClientRect is patched because CSS scale would
 * otherwise report the enlarged box and the sketch would stretch.
 */
const PREVIEW_FIT = `<script>
(function () {
  var hinted = { w: 0, h: 0, dpr: 0 };
  var zoomQuery;
  function viewport() {
    var w = window.innerWidth || 0;
    var h = window.innerHeight || 0;
    if (w < 2) w = hinted.w || 0;
    if (h < 2) h = hinted.h || 0;
    return {
      w: Math.max(1, Math.round(w)),
      h: Math.max(1, Math.round(h)),
      dpr: window.devicePixelRatio || hinted.dpr || 1
    };
  }
  function collapsed(node) {
    var box = node.getBoundingClientRect();
    if (box.width < 2 || box.height < 2) return true;
    for (var el = node.parentElement; el && el !== document.body; el = el.parentElement) {
      if (getComputedStyle(el).display === "none") return true;
    }
    return false;
  }
  function artNodes() {
    var isolated = document.querySelector("[data-isolated]");
    if (isolated) return [isolated];
    var square = document.querySelector(".composition-square canvas, .composition-export canvas");
    if (square) return [square];
    return [].slice.call(document.querySelectorAll("canvas, svg")).filter(collapsed);
  }
  var STRIP_W = 226, STRIP_H = 44, ROUND = 200;
  function designOf(node) {
    if (document.body.hasAttribute("data-round-art") || node.tagName === "svg" || node.tagName === "SVG") {
      return { w: ROUND, h: ROUND };
    }
    return { w: STRIP_W, h: STRIP_H };
  }
  function lockMeasure(node, cssW, cssH) {
    node.__iwrBox = { w: cssW, h: cssH };
    if (node.__iwrLocked) return;
    node.__iwrLocked = true;
    node.getBoundingClientRect = function () {
      var b = node.__iwrBox;
      return {
        x: 0, y: 0, left: 0, top: 0, right: b.w, bottom: b.h,
        width: b.w, height: b.h, toJSON: function () { return this; }
      };
    };
  }
  function place(node, view) {
    var square = node.closest && node.closest(".composition-square");
    if (square) {
      var side = Math.max(1, Math.min(view.w, view.h));
      square.style.setProperty("position", "fixed", "important");
      square.style.setProperty("left", "50%", "important");
      square.style.setProperty("top", "50%", "important");
      square.style.setProperty("transform", "translate(-50%, -50%)", "important");
      square.style.setProperty("width", side + "px", "important");
      square.style.setProperty("height", side + "px", "important");
      square.style.setProperty("max-width", "none", "important");
      node.style.setProperty("width", "100%", "important");
      node.style.setProperty("height", "100%", "important");
      return side;
    }
    if (collapsed(node) && node.parentNode !== document.body) document.body.appendChild(node);
    var design = designOf(node);
    var scale = Math.min(view.w / design.w, view.h / design.h);
    if (!isFinite(scale) || scale <= 0) scale = 1;
    node.style.setProperty("display", "block", "important");
    node.style.setProperty("position", "fixed", "important");
    node.style.setProperty("left", "50%", "important");
    node.style.setProperty("top", "50%", "important");
    node.style.setProperty("width", design.w + "px", "important");
    node.style.setProperty("height", design.h + "px", "important");
    node.style.setProperty("max-width", "none", "important");
    node.style.setProperty("max-height", "none", "important");
    node.style.setProperty("transform-origin", "center center", "important");
    node.style.setProperty("transform", "translate(-50%, -50%) scale(" + scale + ")", "important");
    lockMeasure(node, design.w, design.h);
    return design.w;
  }
  var restoreTimer = 0;
  function poke(node, cssWidth) {
    if (!node || node.tagName !== "CANVAS") return;
    // This Chrome delivers ResizeObserver after requestAnimationFrame, so a
    // one-frame shrink is restored before the observer runs and the DPR
    // change is lost. Hold the shrunk box across a task, then restore it.
    node.style.setProperty("width", Math.max(1, cssWidth - 8) + "px", "important");
    clearTimeout(restoreTimer);
    restoreTimer = setTimeout(function () {
      node.style.setProperty("width", cssWidth + "px", "important");
    }, 32);
  }
  function fit() {
    var guard = document.getElementById("archive-initial-guard");
    if (guard) guard.remove();
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.margin = "0";
    document.body.style.visibility = "visible";
    var view = viewport();
    artNodes().forEach(function (node) {
      var cssWidth = place(node, view);
      if (!node.closest || !node.closest(".composition-square")) poke(node, cssWidth);
    });
  }
  function watchZoom() {
    var query = "(resolution: " + (window.devicePixelRatio || 1) + "dppx)";
    if (query === zoomQuery || !window.matchMedia) return;
    zoomQuery = query;
    try {
      var media = window.matchMedia(query);
      var onChange = function () { zoomQuery = ""; fit(); watchZoom(); };
      if (media.addEventListener) media.addEventListener("change", onChange, { once: true });
      else if (media.addListener) media.addListener(onChange);
    } catch (e) {}
  }
  window.addEventListener("resize", fit);
  if (window.visualViewport) window.visualViewport.addEventListener("resize", fit);
  window.addEventListener("message", function (event) {
    var data = event.data;
    if (!data || data.type !== "iwr-viewport") return;
    if (data.width) hinted.w = data.width;
    if (data.height) hinted.h = data.height;
    if (data.dpr) hinted.dpr = data.dpr;
    fit();
  });
  var seenDpr = window.devicePixelRatio || 1;
  setInterval(function () {
    var next = window.devicePixelRatio || 1;
    if (next === seenDpr) return;
    seenDpr = next;
    fit();
  }, 200);
  fit();
  requestAnimationFrame(fit);
  setTimeout(fit, 60);
  watchZoom();
})();
</script>`;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  if (process.env.NODE_ENV !== "development") {
    return new Response("Not found", { status: 404 });
  }

  const { path: parts } = await params;
  const rel = parts.join("/");
  if (!rel || rel.includes("..") || rel.includes("\0")) {
    return new Response("Bad path", { status: 400 });
  }

  const file = path.resolve(ROOT, rel);
  if (!file.startsWith(ROOT + path.sep) && file !== ROOT) {
    return new Response("Bad path", { status: 400 });
  }

  let info;
  try {
    info = statSync(file);
  } catch {
    return new Response("Not found", { status: 404 });
  }
  if (!info.isFile()) return new Response("Not found", { status: 404 });

  const ext = path.extname(file);
  const cached = fileCache.get(file);
  const bytes =
    cached && cached.mtimeMs === info.mtimeMs
      ? cached.bytes
      : readFileSync(file);
  if (!cached || cached.mtimeMs !== info.mtimeMs) {
    fileCache.set(file, { mtimeMs: info.mtimeMs, bytes });
  }

  let body: BodyInit = new Uint8Array(bytes);
  if (ext === ".html") {
    const item = request.nextUrl.searchParams.get("item") ?? "";
    const htmlKey = `${file}?${item}`;
    const htmlHit = htmlCache.get(htmlKey);
    if (htmlHit && htmlHit.mtimeMs === info.mtimeMs) {
      body = htmlHit.html;
    } else {
      let html = bytes.toString("utf8");
      if (html.includes("<head>")) {
        html = html.replace("<head>", "<head>" + AUDIO_BRIDGE);
      }
      if (
        item !== "" &&
        !html.includes("isolate.js") &&
        !NO_ISOLATE.has(rel)
      ) {
        html = html.replace(
          "</body>",
          '<script src="../isolate.js"></script></body>'
        );
      }
      if (rel.endsWith("sound-machines.html")) {
        html = html.replace(
          "time+=dt;recordTime+=dt;",
          "var tempo=window.__iwrTempo;if(tempo&&tempo.bpm>1){var stepped=Math.floor(tempo.beat*2)/2;if(state.style==='sand')time=stepped*1.8;else if(state.style==='motor')time=stepped/1.5;else if(state.style==='pendulum')time=stepped*0.5;else if(state.style==='grains')time=stepped*(35/16);else time+=dt;}else time+=dt;recordTime+=dt;"
        );
      }
      if (html.includes("</body>")) {
        html = html.replace("</body>", PREVIEW_FIT + "</body>");
      }
      htmlCache.set(htmlKey, { mtimeMs: info.mtimeMs, html });
      body = html;
    }
  }

  return new Response(body, {
    headers: {
      "Content-Type": TYPES[ext] ?? "application/octet-stream",
      // Shared scripts are static. HTML stays fresh so the injected bridge
      // updates with the dev server without a hard reload.
      "Cache-Control": ext === ".html" ? "no-store" : "private, max-age=300",
    },
  });
}
