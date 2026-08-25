# Tarot-2.4 Performance 60FPS

Baseline: Tarot-2.3.

Frontend-only performance pass. Shuffle order, draw logic, upright/reversed logic, Reader prompt and API routes are unchanged.

Changes:
- Reworked the 78-card fan so each card uses one stationary hit-box and one visual layer; removed the 78 duplicate hover-card clones.
- Hover still lifts only the visible card artwork by 13px while the hit-box remains fixed.
- Removed expensive per-card outer shadows from the dense fan; a shared fan shadow preserves depth.
- Kept all 75 background stars visible but reduced active idle animations to about 1/3 on desktop and 1/4 on mobile; animations use transform/opacity instead of brightness filters.
- Star animation remains paused during intensive deck interaction.
- Added layout/paint containment around the fan/deck stage and drag ghost.
- Memoized Rider-Waite artwork and result card rendering to avoid unnecessary React renders.

Validation:
- Changed TSX files pass TypeScript syntax transpilation checks.
- Reader/API checksums match Tarot-2.3 exactly.
- Full npm install/build could not be completed in this environment because npm install timed out.
