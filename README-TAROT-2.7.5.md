# Tarot 2.7.5

Fix hover/select fan cards from Tarot 2.7.4:

- Hovered card stays woven inside the fan; no full-card pop-out above the deck.
- Hover lift reduced to 9px but remains visible.
- Added a separate transparent outline guide matching the exact target card.
- The outline guide sits above the deck, so left/right edge cards remain identifiable even when mostly covered.
- One stationary pointer layer remains the only desktop hit target, preserving the low-lag behaviour from 2.7.4.
- XAH/GPT-5.6 Sol, Supabase, card geometry and question hints are unchanged.
