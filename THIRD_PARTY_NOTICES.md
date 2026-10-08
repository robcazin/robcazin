# Third-Party Notices

This project includes code from third-party sources under the following licenses:

## iwrzwr-visual-archive

Visualizers ported from the [iwrzwr-visual-archive](https://github.com/kaganin/iwrzwr-visual-archive) project by Kagan Yaldizkaya:

- Spectrum Ribbon
- Mono Wave
- Silk Layers
- Liquid Wave
- Fine Spectrum
- Phosphor Sweep
- XY Dust
- Phase Braid
- Terminal Trace
- Contour Memory
- Packet Stitch
- Teletext Pulse
- Vector Scope
- Wireframe Echo
- ASCII Stream
- Spectral Tape
- Transcode Window
- Perforation Logic
- Rank Sieve
- Factor Constellation
- Gate Register

**Original work:** https://github.com/kaganin/iwrzwr-visual-archive  
**Live demo:** https://www.kagan.in/iwrzwr/visual-archive/  
**Author:** Kagan Yaldizkaya  
**License:** MIT License

```
MIT License

Copyright (c) 2026 Kagan Yaldizkaya

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

**Note:** The five visualizers above were adapted from Canvas 2D to WebGL/GLSL shaders and tuned with muted color palettes and calmer motion to match the aesthetic of robcazin.com.

The full archive is also vendored, unmodified, for a development-only preview browser:

- `vendor/iwrzwr-visual-archive/` — original study HTML and the small runtime scripts those pages load (`motion-runtime.js`, `isolate.js`, and the three square-composition scripts)
- `vendor/iwrzwr-visual-archive/LICENSE` — MIT license text
- `vendor/iwrzwr-visual-archive/catalog.json` — index of each sketch, its category, and the study file

These files are not imported by production pages. A dev-only route serves them when `next dev` is running. The preview leaves each sketch on its own simulated input unless the sketch already reads the archive's `iwrSignal` hook, in which case the player forwards the current track's analyser bands into that hook.

---

## Audio-reactive GLSL Shaders

Additional visualizers vendored from https://github.com/TjardoOrtan/audio-reactive-shaders (no license file in original repository).
