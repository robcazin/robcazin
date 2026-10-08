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
  const bytes = readFileSync(file);
  let body: BodyInit = new Uint8Array(bytes);
  if (ext === ".html") {
    let html = bytes.toString("utf8");
    if (html.includes("<head>")) {
      html = html.replace("<head>", "<head>" + AUDIO_BRIDGE);
    }
    const item = request.nextUrl.searchParams.get("item");
    if (
      item !== null &&
      !html.includes("isolate.js") &&
      !NO_ISOLATE.has(rel)
    ) {
      html = html.replace(
        "</body>",
        '<script src="../isolate.js"></script></body>'
      );
    }
    body = html;
  }

  return new Response(body, {
    headers: {
      "Content-Type": TYPES[ext] ?? "application/octet-stream",
      "Cache-Control": "no-store",
    },
  });
}
