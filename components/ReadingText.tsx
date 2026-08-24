import type { ReactNode } from "react";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderInline(text: string, cardNames: string[]): ReactNode[] {
  // Some model responses may escape Markdown as \*\*Card Name\*\*.
  // Normalize it so the UI never shows the literal asterisks.
  const normalized = text.replace(/\\\*\\\*/g, "**");
  const uniqueCardNames = Array.from(new Set(cardNames.filter(Boolean))).sort(
    (a, b) => b.length - a.length
  );
  const cardPattern = uniqueCardNames.map(escapeRegExp).join("|");
  const tokenPattern = cardPattern
    ? new RegExp(`(\\*\\*[^*]+\\*\\*|${cardPattern})`, "g")
    : /(\*\*[^*]+\*\*)/g;
  const cardSet = new Set(uniqueCardNames);
  const parts = normalized.split(tokenPattern);

  return parts.filter(Boolean).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      const content = part.slice(2, -2);
      const isCardName = cardSet.has(content);
      return (
        <strong className={isCardName ? "tarot-card-name" : undefined} key={index}>
          {content}
        </strong>
      );
    }

    if (cardSet.has(part)) {
      return (
        <strong className="tarot-card-name" key={index}>
          {part}
        </strong>
      );
    }

    return part;
  });
}

export default function ReadingText({
  text,
  cardNames = []
}: {
  text: string;
  cardNames?: string[];
}) {
  const lines = text.split("\n");
  return (
    <div className="reading-text">
      {lines.map((line, i) => {
        if (line.startsWith("## ")) return <h3 key={i}>{renderInline(line.replace(/^##\s*/, ""), cardNames)}</h3>;
        if (line.startsWith("### ")) return <h4 key={i}>{renderInline(line.replace(/^###\s*/, ""), cardNames)}</h4>;
        if (line.startsWith("- ")) return <div className="bullet" key={i}>✦ {renderInline(line.slice(2), cardNames)}</div>;
        if (/^\d+\.\s/.test(line)) return <div className="bullet" key={i}>{renderInline(line, cardNames)}</div>;
        if (!line.trim()) return <div className="spacer" key={i} />;
        return <p key={i}>{renderInline(line, cardNames)}</p>;
      })}
    </div>
  );
}
