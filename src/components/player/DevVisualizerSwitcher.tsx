"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePlayer } from "@/contexts/PlayerContext";
import { VISUALIZER_LIBRARY } from "@/lib/visualizerPresets";
import {
  readTempoState,
  sampleTempo,
  setTempoOverride,
  subscribeTempo,
} from "@/lib/tempoClock";

const FAVORITES_KEY = "robcazin-viz-favorites";

const PORTED_IDS = [
  "spectrum-ribbon",
  "phase-braid",
  "contour-memory",
  "packet-stitch",
  "teletext-pulse",
  "transcode-window",
  "perforation-logic",
  "rank-sieve",
  "factor-constellation",
  "gate-register",
] as const;

interface ArchiveSketch {
  id: string;
  name: string;
  category: string;
  file: string;
  item: number;
}

interface ArchiveCatalog {
  sketches: ArchiveSketch[];
}

interface MenuEntry {
  id: string;
  name: string;
  category: string;
}

function readFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function DevVisualizerSwitcherInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);
  const [sketches, setSketches] = useState<ArchiveSketch[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>(readFavorites);
  const [copied, setCopied] = useState(false);
  const currentViz = searchParams.get("viz");
  const { getPlaybackTime } = usePlayer();
  const [tempoText, setTempoText] = useState("—");
  const [bpmDraft, setBpmDraft] = useState("");
  const tapsRef = useRef<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/dev/iwrzwr-archive/catalog.json")
      .then((response) => {
        if (!response.ok) throw new Error(`catalog ${response.status}`);
        return response.json() as Promise<ArchiveCatalog>;
      })
      .then((catalog) => {
        if (!cancelled) setSketches(catalog.sketches ?? []);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setCatalogError(error instanceof Error ? error.message : "catalog failed");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return subscribeTempo(() => {
      const resolved = readTempoState();
      const live = sampleTempo(getPlaybackTime());
      if (!live.known) {
        setTempoText("tempo —");
        return;
      }
      const label =
        resolved.source === "override"
          ? "tap"
          : resolved.source === "catalog"
            ? "catalog"
            : "detected";
      const heard =
        resolved.detectedBpm &&
        Math.abs(resolved.detectedBpm - live.bpm) > 1
          ? ` · heard ${Math.round(resolved.detectedBpm)}`
          : "";
      setTempoText(`${Math.round(live.bpm)} BPM · ${label}${heard}`);
    });
  }, [getPlaybackTime]);

  const menu = useMemo(() => {
    const ported: MenuEntry[] = PORTED_IDS.map((id) => {
      const found = VISUALIZER_LIBRARY.find((entry) => entry.id === id);
      return { id, name: found?.label ?? id, category: "Ported" };
    });
    const site: MenuEntry[] = VISUALIZER_LIBRARY.filter(
      (entry) => !PORTED_IDS.includes(entry.id as (typeof PORTED_IDS)[number])
    ).map((entry) => ({
      id: entry.id,
      name: entry.label,
      category: "Site library",
    }));
    const archive: MenuEntry[] = sketches.map((sketch) => ({
      id: sketch.id,
      name: sketch.name,
      category: sketch.category,
    }));
    return [...ported, ...site, ...archive];
  }, [sketches]);

  const groups = useMemo(() => {
    const order: string[] = [];
    const byCategory = new Map<string, MenuEntry[]>();
    for (const entry of menu) {
      if (!byCategory.has(entry.category)) {
        byCategory.set(entry.category, []);
        order.push(entry.category);
      }
      byCategory.get(entry.category)!.push(entry);
    }
    return order.map((category) => ({
      category,
      entries: byCategory.get(category)!,
    }));
  }, [menu]);

  const current = menu.find((entry) => entry.id === currentViz) ?? null;

  const updateViz = useCallback((vizId: string | null) => {
    const url = new URL(window.location.href);
    if (vizId) url.searchParams.set("viz", vizId);
    else url.searchParams.delete("viz");
    router.replace(url.pathname + url.search);
  }, [router]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (event.key === "x" || event.key === "X") {
        setIsVisible((visible) => !visible);
        event.preventDefault();
        return;
      }
      if (event.key !== "v" && event.key !== "V") return;
      if (menu.length === 0) return;
      const currentIndex = menu.findIndex((entry) => entry.id === currentViz);
      const nextIndex = event.shiftKey
        ? (currentIndex <= 0 ? menu.length - 1 : currentIndex - 1)
        : (currentIndex + 1) % menu.length;
      updateViz(menu[nextIndex].id);
      event.preventDefault();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentViz, menu, updateViz]);

  const toggleFavorite = () => {
    if (!currentViz) return;
    setFavorites((prev) => {
      const next = prev.includes(currentViz)
        ? prev.filter((id) => id !== currentViz)
        : [...prev, currentViz];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  };

  const applyDraftBpm = () => {
    const bpm = Number(bpmDraft);
    if (!Number.isFinite(bpm) || bpm < 40 || bpm > 240) return;
    setTempoOverride(bpm, getPlaybackTime());
  };

  const tapTempo = () => {
    const now = performance.now();
    const taps = tapsRef.current.filter((stamp) => now - stamp < 2500);
    taps.push(now);
    tapsRef.current = taps;
    if (taps.length < 2) return;
    const recent = taps.slice(-6);
    let sum = 0;
    for (let i = 1; i < recent.length; i++) sum += recent[i] - recent[i - 1];
    const bpm = Math.round(60000 / (sum / (recent.length - 1)));
    if (bpm < 40 || bpm > 240) return;
    setBpmDraft(String(bpm));
    setTempoOverride(bpm, getPlaybackTime());
  };

  const copyFavorites = async () => {
    const lines = favorites.map((id) => {
      const entry = menu.find((item) => item.id === id);
      return entry ? `${entry.name} — ${entry.category}` : id;
    });
    const text = lines.join("\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full bg-black/80 px-4 py-2 text-xs text-white/70 hover:bg-black/90 hover:text-white"
        title="Show visualizer switcher (X)"
      >
        VIZ
      </button>
    );
  }

  const starred = currentViz ? favorites.includes(currentViz) : false;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[22rem] max-w-[calc(100vw-2rem)] rounded-lg border border-white/10 bg-black/90 p-4 text-white shadow-lg backdrop-blur-sm">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="text-xs font-mono text-white/50">DEV VISUALIZER</div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-xs text-white/50 hover:text-white"
          title="Hide (X)"
        >
          ✕
        </button>
      </div>

      <div className="mb-2 text-xs text-white/70">
        <div className="text-white/40">{current?.category ?? "Track default"}</div>
        <div className="text-sm text-white">{current?.name ?? "Track default"}</div>
      </div>

      <label htmlFor="viz-select" className="sr-only">
        Visualizer
      </label>
      <select
        id="viz-select"
        size={12}
        value={currentViz || ""}
        onChange={(event) => updateViz(event.target.value || null)}
        className="w-full rounded border border-white/20 bg-white/10 px-2 py-1 text-sm text-white focus:border-white/40 focus:outline-none"
      >
        <option value="">Track default</option>
        {groups.map((group) => (
          <optgroup key={group.category} label={group.category}>
            {group.entries.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {favorites.includes(entry.id) ? "★ " : ""}
                {entry.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="font-mono text-xs text-white/70">{tempoText}</div>
        <input
          value={bpmDraft}
          onChange={(event) => setBpmDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") applyDraftBpm();
          }}
          inputMode="decimal"
          aria-label="BPM override"
          placeholder="BPM"
          className="w-16 rounded border border-white/20 bg-white/10 px-2 py-1 text-xs text-white"
        />
        <button
          type="button"
          onClick={applyDraftBpm}
          className="rounded border border-white/20 px-2 py-1 text-xs text-white/80 hover:text-white"
        >
          Set
        </button>
        <button
          type="button"
          onClick={tapTempo}
          className="rounded border border-white/20 px-2 py-1 text-xs text-white/80 hover:text-white"
        >
          Tap
        </button>
        <button
          type="button"
          onClick={() => {
            tapsRef.current = [];
            setBpmDraft("");
            setTempoOverride(null);
          }}
          className="rounded border border-white/20 px-2 py-1 text-xs text-white/80 hover:text-white"
        >
          Clear
        </button>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={toggleFavorite}
          disabled={!currentViz}
          className="rounded border border-white/20 px-2 py-1 text-xs text-white/80 hover:text-white disabled:opacity-40"
        >
          {starred ? "★ Starred" : "☆ Star"}
        </button>
        <button
          type="button"
          onClick={() => void copyFavorites()}
          disabled={favorites.length === 0}
          className="rounded border border-white/20 px-2 py-1 text-xs text-white/80 hover:text-white disabled:opacity-40"
        >
          {copied ? "Copied" : `Copy favorites (${favorites.length})`}
        </button>
      </div>

      <div className="mt-3 space-y-1 border-t border-white/10 pt-2 text-xs text-white/50">
        <div><kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono">V</kbd> next sketch</div>
        <div><kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono">Shift+V</kbd> previous</div>
        <div><kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono">X</kbd> hide panel</div>
        <div>Open the track visualizer to see the preview.</div>
        {catalogError ? (
          <div className="text-red-300">Archive catalog failed to load ({catalogError}).</div>
        ) : (
          <div>{sketches.length} archive sketches · {menu.length} in the list</div>
        )}
      </div>
    </div>
  );
}

export default function DevVisualizerSwitcher() {
  if (process.env.NODE_ENV !== "development") return null;
  return (
    <Suspense fallback={null}>
      <DevVisualizerSwitcherInner />
    </Suspense>
  );
}
