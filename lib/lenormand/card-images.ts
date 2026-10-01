export function getLenormandCardImageUrl(cardNumber: number) {
  const safeNumber = Math.max(1, Math.min(36, Math.floor(cardNumber)));
  return `/cards/dondorf-lenormand/card-${String(safeNumber).padStart(2, "0")}.webp`;
}
