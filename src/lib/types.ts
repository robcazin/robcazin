export type MediaKind = "audio" | "video";

export interface Track {
  id: string;
  title: string;
  collection: string; // collection slug
  kind: MediaKind;
  src: string; // URL to self-hosted audio/video
  poster?: string; // optional artwork/still
  duration?: number; // seconds
  year?: number;
  credits?: string;
  notes?: string;
  // Intentionally open — every key/value is rendered as a monospace
  // "lab readout" row (tuning, bpm, seed, generative, software, era, ...).
  meta?: Record<string, unknown>;
  accent?: string; // per-track accent color override
}

export interface Collection {
  slug: string;
  title: string;
  blurb?: string;
  accent?: string; // per-series accent color
  tracks: Track[];
}
