# Tarot-2.1

UI-only follow-up from Tarot-2.0.

- Desktop: hovering a card in the 78-card fan now raises the visible card by 24px so the current target is obvious.
- The actual mouse hit-box never moves; the lift is rendered as a pointer-events-none visual clone to avoid bringing back the overlap-seam hover flicker fixed in earlier versions.
- Hovered card is promoted above neighboring cards and gets a light brightness/shadow emphasis.
- Light theme gets a matching light-card hover preview.
- Mobile/touch behavior remains unchanged.
- Reader prompts, `/api/read`, `/api/chat`, and XAH integration are unchanged.
