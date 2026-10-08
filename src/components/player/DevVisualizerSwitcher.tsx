"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState, useCallback } from "react";
import { VISUALIZER_LIBRARY } from "@/lib/visualizerPresets";

/**
 * Dev-only visualizer switcher
 * 
 * Active in development mode, lets you cycle through visualizers
 * with keyboard shortcuts or dropdown selection.
 * 
 * Usage:
 * - Press 'V' to cycle forward through visualizers
 * - Press Shift+'V' to cycle backward
 * - Click the dropdown to select directly
 * - Press 'X' to toggle the panel
 */

function DevVisualizerSwitcherInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);
  const currentViz = searchParams.get("viz");

  const updateViz = useCallback((vizId: string | null) => {
    const url = new URL(window.location.href);
    if (vizId) {
      url.searchParams.set("viz", vizId);
    } else {
      url.searchParams.delete("viz");
    }
    router.replace(url.pathname + url.search);
  }, [router]);

  useEffect(() => {
    // Keyboard shortcuts
    const handleKey = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "x" || e.key === "X") {
        setIsVisible((v) => !v);
        e.preventDefault();
        return;
      }

      if (e.key === "v" || e.key === "V") {
        const currentIndex = VISUALIZER_LIBRARY.findIndex((v) => v.id === currentViz);
        let nextIndex;
        
        if (e.shiftKey) {
          // Shift+V: cycle backward
          nextIndex = currentIndex <= 0 ? VISUALIZER_LIBRARY.length - 1 : currentIndex - 1;
        } else {
          // V: cycle forward
          nextIndex = (currentIndex + 1) % VISUALIZER_LIBRARY.length;
        }

        const nextViz = VISUALIZER_LIBRARY[nextIndex].id;
        updateViz(nextViz);
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentViz, updateViz]);

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

  const currentLabel = currentViz 
    ? VISUALIZER_LIBRARY.find((v) => v.id === currentViz)?.label || "Unknown"
    : "Default";

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-black/90 p-4 text-white shadow-lg backdrop-blur-sm border border-white/10">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="text-xs font-mono text-white/50">DEV VISUALIZER</div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-white/50 hover:text-white text-xs"
          title="Hide (X)"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label htmlFor="viz-select" className="block text-xs text-white/70 mb-1.5">
            Current: {currentLabel}
          </label>
          <select
            id="viz-select"
            value={currentViz || ""}
            onChange={(e) => updateViz(e.target.value || null)}
            className="w-full rounded bg-white/10 border border-white/20 px-3 py-1.5 text-sm text-white focus:border-white/40 focus:outline-none"
          >
            <option value="">Track Default</option>
            <optgroup label="All Visualizers">
              {VISUALIZER_LIBRARY.map((viz) => (
                <option key={viz.id} value={viz.id}>
                  {viz.label}
                  {viz.collection ? ` (${viz.collection})` : ""}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        <div className="text-xs text-white/50 space-y-1 border-t border-white/10 pt-2">
          <div><kbd className="font-mono bg-white/10 px-1.5 py-0.5 rounded">V</kbd> Cycle forward</div>
          <div><kbd className="font-mono bg-white/10 px-1.5 py-0.5 rounded">Shift+V</kbd> Cycle back</div>
          <div><kbd className="font-mono bg-white/10 px-1.5 py-0.5 rounded">X</kbd> Toggle panel</div>
        </div>

        <div className="text-xs text-white/40 pt-2 border-t border-white/10">
          {VISUALIZER_LIBRARY.length} visualizers available
        </div>
      </div>
    </div>
  );
}

export default function DevVisualizerSwitcher() {
  // Only show in development or if ?viz param is present
  const isDev = process.env.NODE_ENV === "development";
  
  if (!isDev) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <DevVisualizerSwitcherInner />
    </Suspense>
  );
}
