"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  HOUSE_TINT,
  TINT_DURATION_MS,
  TINT_MIX,
  getAmbientAccent,
  subscribeAmbientAccent,
} from "@/lib/ambientBackground";
import { mixHex, resolveAccentHex } from "@/lib/utils";

function targetTint(accent?: string): string {
  if (!accent) return HOUSE_TINT;
  return mixHex(HOUSE_TINT, resolveAccentHex(accent), TINT_MIX);
}

function prefersReducedMotion(): boolean {
  return (
    document.documentElement.dataset.motion !== "full" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Fixed studio background: photo + animating soft-light tint + scrim */
export default function SiteBackground() {
  const accent = useSyncExternalStore(
    subscribeAmbientAccent,
    getAmbientAccent,
    () => undefined
  );
  const [tint, setTint] = useState(HOUSE_TINT);
  const tintRef = useRef(HOUSE_TINT);
  const animRef = useRef(0);

  useEffect(() => {
    cancelAnimationFrame(animRef.current);
    const goal = targetTint(accent);

    if (prefersReducedMotion()) {
      tintRef.current = goal;
      setTint(goal);
      return;
    }

    const from = tintRef.current;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / TINT_DURATION_MS);
      const eased = 1 - (1 - t) ** 2;
      const next = mixHex(from, goal, eased);
      tintRef.current = next;
      setTint(next);
      if (t < 1) animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [accent]);

  return (
    <div className="site-bg" aria-hidden="true">
      <div className="site-bg__photo" style={{ backgroundColor: tint }} />
      <div className="site-bg__scrim" />
    </div>
  );
}
