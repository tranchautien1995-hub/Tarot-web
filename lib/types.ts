export type Orientation = "upright" | "reversed";

export type TarotCard = {
  id: string;
  name: string;
  vi: string;
  arcana: "major" | "minor";
  suit?: "wands" | "cups" | "swords" | "pentacles";
  rank?: string;
  symbol: string;
  upright: string[];
  reversed: string[];
};

export type DrawnCard = TarotCard & {
  orientation: Orientation;
  position: string;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};
