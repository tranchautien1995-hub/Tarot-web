export const ACTIVE_DECK_NAME = "Rider–Waite–Smith";

export function getCardImageCandidates(cardId: string): string[] {
  const base = `/cards/rider-waite/${cardId}`;
  return [`${base}.jpg`, `${base}.jpeg`, `${base}.png`, `${base}.webp`];
}
