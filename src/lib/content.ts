import fs from "fs";
import path from "path";
import { z } from "zod";
import type { Collection, Track } from "./types";

/* ─── Zod schemas ─────────────────────────────────────────────────────────── */

const trackSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  kind: z.enum(["audio", "video"]),
  src: z.string().min(1),
  poster: z.string().optional(),
  duration: z.number().optional(),
  year: z.number().optional(),
  credits: z.string().optional(),
  notes: z.string().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
  accent: z.string().optional(),
});

const collectionSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  blurb: z.string().optional(),
  accent: z.string().optional(),
  tracks: z.array(trackSchema),
});

const indexSchema = z.object({
  order: z.array(z.string().min(1)),
});

/* ─── Loader ──────────────────────────────────────────────────────────────── */

const CONTENT_DIR = path.join(process.cwd(), "content");

function readJson(filePath: string): unknown {
  const raw = fs.readFileSync(filePath, "utf-8");
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(
      `[content] Invalid JSON in ${path.relative(process.cwd(), filePath)}: ${
        (e as Error).message
      }`
    );
  }
}

function loadCollections(): Collection[] {
  const indexPath = path.join(CONTENT_DIR, "collections.json");
  if (!fs.existsSync(indexPath)) {
    throw new Error(`[content] Missing index file: ${indexPath}`);
  }

  const index = indexSchema.parse(readJson(indexPath));

  return index.order.map((slug) => {
    const filePath = path.join(CONTENT_DIR, "collections", `${slug}.json`);
    if (!fs.existsSync(filePath)) {
      throw new Error(
        `[content] Collection "${slug}" is listed in collections.json but ${path.relative(
          process.cwd(),
          filePath
        )} does not exist.`
      );
    }

    const parsed = collectionSchema.safeParse(readJson(filePath));
    if (!parsed.success) {
      throw new Error(
        `[content] Invalid collection "${slug}" (${slug}.json):\n${z.prettifyError(
          parsed.error
        )}`
      );
    }

    if (parsed.data.slug !== slug) {
      throw new Error(
        `[content] Slug mismatch in ${slug}.json: file declares slug "${parsed.data.slug}" but is loaded as "${slug}".`
      );
    }

    const tracks: Track[] = parsed.data.tracks.map((t) => ({
      ...t,
      collection: parsed.data.slug,
    }));

    return { ...parsed.data, tracks };
  });
}

/* ─── Public API ──────────────────────────────────────────────────────────── */
// Read JSON from disk on every call so edits in dev show up immediately
// without restarting the server. (Previously cached at module init, which
// froze the first snapshot until restart.)

export function getCollections(): Collection[] {
  return loadCollections();
}

export function getCollection(slug: string): Collection | undefined {
  return getCollections().find((c) => c.slug === slug);
}

export function getTrack(id: string) {
  for (const col of getCollections()) {
    const track = col.tracks.find((t) => t.id === id);
    if (track) return { track, collection: col };
  }
  return null;
}

export function getAllTracks(): Track[] {
  return getCollections().flatMap((c) => c.tracks);
}
