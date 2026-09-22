# Tarot 2.7.4

Base: Tarot 2.7.3, itself built from the user's Tarot 2.7.2 source.

Fixes to the 78-card fan:
- Removed the overlapping desktop hit-box system that caused lag and cursor/card mismatch.
- Added one stationary transparent pointer layer over the whole fan.
- The nearest selectable card is resolved from the mouse X position against the actual fan card centers.
- Hover targeting updates at most once per animation frame and changes the target class directly, avoiding a React re-render on every mouse movement.
- The targeted card artwork rises 18px while its real hit geometry remains fixed.
- A strong outline appears around the exact targeted card, including the difficult far-left/far-right cards.
- Touch/mobile keeps the original per-card interaction path.

Question hint behavior from 2.7.3 is unchanged.
