/**
 * Shared musical clock for visualizers.
 *
 * Priority: a dev tap/BPM override, then an optional catalog `meta.bpm`
 * (and optional `meta.beatOffset` seconds), then an offline onset estimate
 * from the decoded track. Beat position is always derived from the audio
 * element's currentTime, so pause and seek stay locked.
 */

export type TempoSource = "override" | "catalog" | "detected" | "none";

export interface TempoReading {
  bpm: number;
  /** Fractional beat index. Beat 0 sits at `offset` seconds. */
  beat: number;
  /** 0–1 position inside the current beat. */
  phase: number;
  /** 4/4 bar index. */
  bar: number;
  /** 0–1 position inside the current bar. */
  barPhase: number;
  /** 0–1 position inside the current eighth note. */
  eighth: number;
  /** 0–1 position inside the current sixteenth note. */
  sixteenth: number;
  beatsPerBar: number;
  known: boolean;
  source: TempoSource;
  offset: number;
}

export interface TempoEstimate {
  bpm: number;
  offset: number;
}

const state = {
  catalogBpm: null as number | null,
  catalogOffset: null as number | null,
  detectedBpm: null as number | null,
  detectedOffset: null as number | null,
  overrideBpm: null as number | null,
  overrideOffset: null as number | null,
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeTempo(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setCatalogTempo(bpm: number | null, offset: number | null) {
  state.catalogBpm = bpm;
  state.catalogOffset = offset;
  emit();
}

export function setDetectedTempo(bpm: number | null, offset: number | null) {
  state.detectedBpm = bpm;
  state.detectedOffset = offset;
  emit();
}

/** Pass null to clear a tap-tempo / numeric override. */
export function setTempoOverride(bpm: number | null, offset: number | null = null) {
  state.overrideBpm = bpm;
  state.overrideOffset = offset;
  emit();
}

export function readTempoState(): {
  bpm: number;
  source: TempoSource;
  offset: number;
  detectedBpm: number | null;
  catalogBpm: number | null;
} {
  let source: TempoSource = "none";
  let bpm = 0;
  if (state.overrideBpm && state.overrideBpm > 0) {
    source = "override";
    bpm = state.overrideBpm;
  } else if (state.catalogBpm && state.catalogBpm > 0) {
    source = "catalog";
    bpm = state.catalogBpm;
  } else if (state.detectedBpm && state.detectedBpm > 0) {
    source = "detected";
    bpm = state.detectedBpm;
  }
  const offset =
    state.overrideOffset ??
    state.catalogOffset ??
    state.detectedOffset ??
    0;
  return {
    bpm,
    source,
    offset,
    detectedBpm: state.detectedBpm,
    catalogBpm: state.catalogBpm,
  };
}

export function sampleTempo(currentTime: number): TempoReading {
  const resolved = readTempoState();
  const beatsPerBar = 4;
  if (!(resolved.bpm > 0)) {
    return {
      bpm: 0,
      beat: 0,
      phase: 0,
      bar: 0,
      barPhase: 0,
      eighth: 0,
      sixteenth: 0,
      beatsPerBar,
      known: false,
      source: "none",
      offset: 0,
    };
  }
  const beat = (currentTime - resolved.offset) * (resolved.bpm / 60);
  const phase = beat - Math.floor(beat);
  const barFloat = beat / beatsPerBar;
  const eighthFloat = beat * 2;
  const sixteenthFloat = beat * 4;
  return {
    bpm: resolved.bpm,
    beat,
    phase,
    bar: Math.floor(barFloat),
    barPhase: barFloat - Math.floor(barFloat),
    eighth: eighthFloat - Math.floor(eighthFloat),
    sixteenth: sixteenthFloat - Math.floor(sixteenthFloat),
    beatsPerBar,
    known: true,
    source: resolved.source,
    offset: resolved.offset,
  };
}

/**
 * Onset spectrum over the first ~45s. `lockedBpm` keeps a catalog tempo
 * and only estimates where beat 0 falls. Ambiguous tracks return null
 * so visualizers keep their own timing.
 */
export function detectTempoFromMono(
  samples: Float32Array,
  sampleRate: number,
  lockedBpm: number | null = null
): TempoEstimate | null {
  if (sampleRate < 8000 || samples.length < sampleRate) return null;
  const hop = 512;
  const length = Math.min(samples.length, Math.floor(sampleRate * 45));
  const frames = Math.floor(length / hop);
  if (frames < 32) return null;

  const flux = new Float32Array(frames);
  let previous = 0;
  for (let i = 0; i < frames; i++) {
    let energy = 0;
    const start = i * hop;
    for (let j = 0; j < hop; j += 2) {
      const s = samples[start + j];
      energy += s * s;
    }
    const diff = energy - previous;
    previous = energy;
    flux[i] = diff > 0 ? diff : 0;
  }

  const onset = new Float32Array(frames);
  const window = 43;
  let rolling = 0;
  for (let i = 0; i < frames; i++) {
    rolling += flux[i];
    if (i >= window) rolling -= flux[i - window];
    const local = rolling / Math.min(i + 1, window);
    onset[i] = Math.max(0, flux[i] - local);
  }

  const hopSec = hop / sampleRate;
  const magnitude = (bpm: number) => {
    const w = (2 * Math.PI * bpm) / 60 * hopSec;
    let re = 0;
    let im = 0;
    for (let i = 0; i < frames; i++) {
      const o = onset[i];
      re += o * Math.cos(w * i);
      im -= o * Math.sin(w * i);
    }
    return Math.hypot(re, im) / frames;
  };

  let bpm = lockedBpm ?? 0;
  if (!lockedBpm) {
    const scored: { bpm: number; score: number }[] = [];
    for (let candidate = 70; candidate <= 168; candidate += 0.5) {
      scored.push({
        bpm: candidate,
        score: magnitude(candidate) + magnitude(candidate * 2) * 0.25,
      });
    }
    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];
    if (!best || best.score < 0.02) return null;
    const harmonic = (a: number, b: number) => {
      const ratio = a > b ? a / b : b / a;
      return [1.5, 2, 3, 4].some((step) => Math.abs(ratio - step) < 0.06);
    };
    const rival = scored.find(
      (entry) => Math.abs(entry.bpm - best.bpm) > 3.5 && !harmonic(entry.bpm, best.bpm)
    );
    const confidence = rival ? best.score / rival.score : 2;
    if (confidence < 1.04) return null;
    bpm = Math.round(best.bpm);
  }

  if (!(bpm >= 40) || bpm > 240) return null;
  const lag = Math.max(1, Math.min(frames - 1, Math.round(60 / bpm / hopSec)));
  let bestOffset = 0;
  let bestHit = -1;
  for (let off = 0; off < lag; off++) {
    let hit = 0;
    for (let i = off; i < frames; i += lag) hit += onset[i];
    if (hit > bestHit) {
      bestHit = hit;
      bestOffset = off;
    }
  }
  return { bpm, offset: bestOffset * hopSec };
}

export function detectTempoFromBuffer(
  buffer: AudioBuffer,
  lockedBpm: number | null = null
): TempoEstimate | null {
  const length = Math.min(buffer.length, Math.floor(buffer.sampleRate * 45));
  const mono = new Float32Array(length);
  const channels = buffer.numberOfChannels;
  for (let c = 0; c < channels; c++) {
    const data = buffer.getChannelData(c);
    const gain = 1 / channels;
    for (let i = 0; i < length; i++) mono[i] += data[i] * gain;
  }
  return detectTempoFromMono(mono, buffer.sampleRate, lockedBpm);
}

export async function analyzeTrackTempo(
  url: string,
  lockedBpm: number | null = null
): Promise<TempoEstimate | null> {
  const response = await fetch(url);
  if (!response.ok) return null;
  const bytes = await response.arrayBuffer();
  const Ctor =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  const context = new Ctor();
  try {
    const audio = await context.decodeAudioData(bytes.slice(0));
    const heard = detectTempoFromBuffer(audio, null);
    const locked = lockedBpm ? detectTempoFromBuffer(audio, lockedBpm) : null;
    if (!heard && !locked) return null;
    return {
      bpm: heard?.bpm ?? 0,
      offset: (locked ?? heard)?.offset ?? 0,
    };
  } finally {
    await context.close();
  }
}
