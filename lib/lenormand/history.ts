import type { DrawnLenormandCard, LenormandSpread, ReadingStyle } from "./types";

export type LenormandHistoryEntry = {
  id: string;
  savedAt: string;
  question: string;
  timeframe: string;
  significator: "man" | "woman";
  spread: LenormandSpread;
  mode: "random" | "manual";
  readingStyle: ReadingStyle | null;
  cards: DrawnLenormandCard[];
  reading: string;
};

export function parseLenormandHistory(raw: string | null, limit: number): LenormandHistoryEntry[] {
  if (!raw || limit <= 0) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    const counts = { line3: 3, line5: 5, box9: 9, grand_tableau: 36 };
    return data.filter((entry): entry is LenormandHistoryEntry => {
      if (!entry || typeof entry !== "object") return false;
      const expected = counts[entry.spread as LenormandSpread];
      return Boolean(expected) && typeof entry.id === "string" && typeof entry.savedAt === "string"
        && typeof entry.question === "string" && typeof entry.timeframe === "string"
        && ["man", "woman"].includes(entry.significator) && ["random", "manual"].includes(entry.mode)
        && [null, "direct", "gentle", "companion"].includes(entry.readingStyle)
        && typeof entry.reading === "string" && Boolean(entry.reading.trim())
        && Array.isArray(entry.cards) && entry.cards.length === expected
        && entry.cards.every((card: DrawnLenormandCard) => card && typeof card.id === "string" && typeof card.name === "string" && typeof card.vi === "string" && (typeof card.position === "string" || typeof card.position === "number"))
        && new Set(entry.cards.map((card: DrawnLenormandCard) => card.id)).size === expected;
    }).slice(0, limit);
  } catch { return []; }
}
