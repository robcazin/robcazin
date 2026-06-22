# Catalog content

**Edit collection files here:** `site/content/collections/*.json`

The `collections.json` index in this folder controls display order. A collection
not listed in `order` is hidden (handy for drafts).

Changes are picked up on the next page refresh in dev — no server restart needed.

> Do **not** edit the copy at the repo root (`/science.json` etc.) — only files
> in this folder are loaded by the site.

## Collections

| Slug | File | Media folder |
|------|------|--------------|
| `science` | `science.json` | `public/audio/science/` |
| `journeys` | `journeys.json` | `public/audio/journeys/` |
| `vaurals` | `vaurals.json` | `public/video/vaurals/` (+ shared audio) |
| `film-music` | `film-music.json` | `public/audio/film-music/` |
| `guitar-improv` | `guitar-improv.json` | `public/video/` |
| `film-theatre` | `film-theatre.json` | — |
| `animation` | `animation.json` | `public/video/animation/` |
| `fragments` | `fragments.json` | — |

Audio files: FLAC preferred (`Content-Type: audio/flac` is configured in
`next.config.ts`). Video: `.mp4` in `public/video/`.
