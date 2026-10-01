export type LenormandCard = {
  id: string;
  number: number;
  name: string;
  vi: string;
  symbol: string;
  playingCard: string;
  keywords: string[];
  tone: "positive" | "neutral" | "challenging";
};

export type LenormandSpread = "line3" | "line5" | "box9" | "grand_tableau";

export type DrawnLenormandCard = LenormandCard & {
  position: number | string;
  house?: string;
};

export type ReadingStyle = "direct" | "gentle" | "companion";
