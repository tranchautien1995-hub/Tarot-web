# Tarot-2.7.2 — Normal Reader / No Sponsor Gate

- Based on Tarot-2.7.1 Low GPU build fix.
- Removed Shopee Affiliate / Sponsor Gate from the UI and frontend logic.
- Once a spread is complete, the Reader button works immediately as before.
- Preserves Tarot-2.7 Low-GPU changes.
- Preserves shuffle, draw randomness, upright/reversed logic, Reader prompt, /api/read, /api/chat and XAH integration.
- Keeps the TypeScript build fix in InteractiveDeck.tsx (`disabled={isPicked}`).
