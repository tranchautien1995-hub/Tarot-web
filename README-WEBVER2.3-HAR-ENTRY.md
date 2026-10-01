# WebVer2.3 — Continuous WebGL Entry

This version starts from the clean `WebVer2.2-full` source.

## Landing flow

1. Clickable portal.
2. TTAROT identity and the slogan “Mỗi lá bài đang chờ được nhìn thấy.”
3. Tarot / Lenormand / Tarot × Lenormand selection.
4. Continuous card-and-hands hero scene, followed by the login CTA.

The canvas remains mounted across all four scenes. Three.js owns the shared
camera, cards, portal, atmosphere and hand planes; GSAP owns the transition
timeline. DOM overlays are limited to accessible copy and controls.

## Reference policy

The supplied Why Zero HAR was inspected to understand its high-level rendering
architecture: a persistent WebGL scene, GLB/KTX2 staging, camera continuity and
GSAP sequencing. No model, texture or source code from that website is included
in this project. The hand art in `public/entry-v3` was generated specifically
for TTAROT and the cards remain the existing public-domain Rider–Waite assets.

## Existing behavior

- Supabase authentication, OAuth providers and local preview remain intact.
- The selected experience is preserved through authentication redirects.
- Tarot opens the existing reading workspace.
- Lenormand and Tarot × Lenormand are presented but remain unavailable because
  WebVer2.2 contains no reading engine for those modes.
- Prompt Lab, reading prompts, APIs, streaming, plans and quotas are unchanged.
- `prefers-reduced-motion` is supported.
