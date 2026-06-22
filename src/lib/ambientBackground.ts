/** House purple wash on the studio photo */
export const HOUSE_TINT = "#140820";

export const TINT_DURATION_MS = 7000;

/** How far toward the collection accent the wash shifts (0–1). */
export const TINT_MIX = 0.55;

type Listener = () => void;

const listeners = new Set<Listener>();

let accent: string | undefined;

export function getAmbientAccent(): string | undefined {
  return accent;
}

export function setAmbientAccent(next?: string): void {
  accent = next;
  listeners.forEach((l) => l());
}

export function subscribeAmbientAccent(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
