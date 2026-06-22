"use client";

import { useEffect } from "react";
import { setAmbientAccent } from "@/lib/ambientBackground";

interface CollectionAmbientTintProps {
  accent?: string;
}

/** Tells the site background to shift its photo tint toward this collection color. */
export default function CollectionAmbientTint({
  accent,
}: CollectionAmbientTintProps) {
  useEffect(() => {
    setAmbientAccent(accent);
    return () => setAmbientAccent(undefined);
  }, [accent]);

  return null;
}
