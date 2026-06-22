# robcazin.com — Site

A from-scratch rebuild of [robcazin.com](https://robcazin.com). Next.js (App Router) + TypeScript + Tailwind CSS 4. Custom persistent audio-reactive player powered by Web Audio API.

---

## Quick Start

```bash
cd site
npm install
npm run dev       # → http://localhost:3000
npm run build     # production build
npm run start     # serve production build
```

Deploy target: **Vercel** (connect repo, deploy `site/` as root).

---

## Adding Tracks & Collections

All catalog content lives in editable **JSON** under `content/` — no React required.

```
content/
  collections.json              # ordered list of collection slugs (controls display order)
  collections/
    science.json
    vaurals.json
    guitar-improv.json
    film-theatre.json
    animation.json
    fragments.json
```

The JSON is read and **validated with Zod** at build time (`src/lib/content.ts`). A malformed
entry fails the build loudly with a clear message rather than silently breaking the UI.

### 1. Add a media file

Drop the file in `public/audio/` or `public/video/` (per-collection subfolders are fine):

```
public/
  audio/science/return.flac
  video/animation/softimage-demo-1994.mp4
```

Audio is **FLAC** in production (bounced from Logic or converted with ffmpeg), served with
`Content-Type: audio/flac`. Video items are `.mp4` / `.webm`. For a CDN, just use an absolute
URL in `src` (e.g. `https://cdn.example.com/return.flac`).

> The seed data currently points at the existing MP3/M4A/MP4 files so the player is
> demonstrable today. Swap each `src` to the real FLAC as Rob supplies it.

### 2. Add a track to a collection

Edit the collection's JSON file and add an object to its `tracks` array:

```json
{
  "id": "science-resonance",
  "title": "Resonance Study",
  "kind": "audio",
  "src": "/audio/science/resonance.flac",
  "year": 2025,
  "notes": "Short description shown in the detail panel.",
  "meta": { "tuning": "A = 432 Hz", "bpm": 84, "generative": true }
}
```

`id` must be unique. `meta` is **freeform** — every key/value renders as a monospace
"lab readout" row, so a music track can show `tuning / bpm / generative` while the Softimage
reel shows `software / era`. (The `collection` slug is injected automatically by the loader.)

### 3. Add a new collection

1. Create `content/collections/<slug>.json`:

```json
{
  "slug": "live",
  "title": "Live Recordings",
  "blurb": "One-sentence description shown on the grid.",
  "accent": "#22d3ee",
  "tracks": []
}
```

2. Add the slug to the `order` array in `content/collections.json`.

The `order` array drives display order everywhere. **A collection not listed in `order` is
hidden** — handy for drafts. The slug becomes the route automatically via `generateStaticParams`.

### Track fields

| field | required | notes |
|---|---|---|
| `id` | yes | unique slug, used in URLs/queue |
| `title` | yes | |
| `kind` | yes | `"audio"` or `"video"` |
| `src` | yes | `.flac` for audio; `.mp4`/`.webm` for video |
| `poster` | no | artwork/still image path |
| `duration` | no | seconds; if omitted, read from media metadata on load |
| `year` | no | |
| `credits` | no | e.g. "dir. Hamid Rahmanian" |
| `notes` | no | short prose for the detail panel |
| `meta` | no | freeform object → monospace lab readout |
| `accent` | no | per-track override of collection accent |

---

## Audio Hosting Options

| Option | When to use | How |
|---|---|---|
| `public/audio/` | Small files, local dev | `src: "/audio/filename.mp3"` |
| Cloudflare R2 / S3 / Bunny CDN | Production, large files | `src: "https://your-cdn.com/filename.mp3"` |
| SoundCloud direct | Not recommended — no reliable raw URL | — |

Migration path: update each track's `src` one at a time; the player just needs a playable URL.

---

## Component Map

| Component | Location | Purpose |
|---|---|---|
| content loader | `src/lib/content.ts` | Reads `content/*.json`, validates with Zod, exports ordered collections. |
| `PlayerProvider` | `src/contexts/PlayerContext.tsx` | Global player state + Web Audio API. Mounted once at root — playback persists across routes. |
| `PlayerDock` | `src/components/player/PlayerDock.tsx` | Fixed bottom bar: transport, progress, time, volume, queue toggle. |
| `Visualizer` | `src/components/player/Visualizer.tsx` | Canvas frequency visualizer driven by `AnalyserNode` + `requestAnimationFrame`. Respects `prefers-reduced-motion`. |
| `Waveform` | `src/components/player/Waveform.tsx` | WaveSurfer.js waveform with scrubbing. |
| `Queue` | `src/components/player/Queue.tsx` | Slide-up queue panel, lists upcoming tracks. |
| `TrackRow` | `src/components/TrackRow.tsx` | Single track in a collection list — play indicator, title, duration. |
| `CollectionGrid` | `src/components/CollectionGrid.tsx` | Grid of collection cards for `/work`. |
| `CollectionPage` | `src/components/CollectionPage.tsx` | Client page for `/work/[collection]` — track list + detail panel. |
| `MetaReadout` | `src/components/MetaReadout.tsx` | Monospace lab-readout block: BPM, tuning, seed, etc. |
| `Nav` | `src/components/Nav.tsx` | Sticky top navigation. |
| `Footer` | `src/components/Footer.tsx` | Footer with external links. |
| `ContactForm` | `src/components/ContactForm.tsx` | Client-side contact form (mailto action). |

---

## Design Tokens

Defined as CSS variables in `src/app/globals.css`:

```css
--bg:        #0a0b0d;   /* near-black canvas */
--surface:   #14161a;   /* cards, panels */
--surface-2: #1c1f26;   /* hover states */
--text:      #e9ecef;   /* primary text */
--text-dim:  #8b9199;   /* secondary, labels */
--accent:    #ff5a3c;   /* default accent — overridden per collection */
--line:      #23262b;   /* hairline borders */
--player-h:  5rem;      /* player dock height (add to content padding-bottom) */
```

Per-collection accent colors are set in `data.ts` on the `Collection.accent` field. The `PlayerDock` and `Visualizer` automatically pick up the current track's collection accent.

---

## Keyboard Controls

| Key | Action |
|---|---|
| `Space` | Play / Pause |
| `←` | Seek back 10 s |
| `→` | Seek forward 10 s |
| `↑` | Volume up |
| `↓` | Volume down |

---

## Notes

- **Email address**: The contact page currently uses `rob@robcazin.com`. The old site's mailto pointed to a Gmail address. Confirm the canonical address and update `src/app/contact/page.tsx` and `src/components/ContactForm.tsx`.
- **Video tracks**: When a track's `kind` is `"video"`, the collection detail panel shows an inline `<video>` element. The player dock transport still works for navigation but play/pause is handled by the native video controls.
- **Reduced motion**: The `Visualizer` falls back to a static sine-wave line when `prefers-reduced-motion: reduce` is set. All Framer Motion animations are bypassed globally via the CSS rule in `globals.css`.
- **Volume persistence**: Volume is stored in `localStorage` under the key `rc_volume`.
