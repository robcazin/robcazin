/** Format seconds as M:SS */
export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Build a CSS hsl string with optional alpha */
export function hexToRgba(hex: string, alpha = 1): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Linear blend between two #rrggbb colors (t = 0 → a, t = 1 → b). */
export function mixHex(a: string, b: string, t: number): string {
  const parse = (hex: string) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const ch = (from: number, to: number) =>
    Math.round(from + (to - from) * t)
      .toString(16)
      .padStart(2, "0");
  return `#${ch(ar, br)}${ch(ag, bg)}${ch(ab, bb)}`;
}

/** Resolve an accent to a #rrggbb hex string (canvas cannot use CSS vars). */
export function resolveAccentHex(color: string): string {
  if (/^#[0-9a-fA-F]{8}$/.test(color)) return color.slice(0, 7);
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return color;
  if (typeof window !== "undefined") {
    const fromVar = getComputedStyle(document.documentElement)
      .getPropertyValue("--accent")
      .trim();
    if (/^#[0-9a-fA-F]{8}$/.test(fromVar)) return fromVar.slice(0, 7);
    if (/^#[0-9a-fA-F]{6}$/.test(fromVar)) return fromVar;
  }
  return "#0A4053";
}
