function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function stripDisplayedCardOrientationDash(text: string, cardNames: string[]) {
  const uniqueCardNames = Array.from(new Set(cardNames.filter(Boolean))).sort(
    (a, b) => b.length - a.length
  );

  if (!uniqueCardNames.length) return text;

  const canonicalNames = new Map(
    uniqueCardNames.map((name) => [name.toLocaleLowerCase(), name])
  );
  const cardPattern = uniqueCardNames.map(escapeRegExp).join("|");
  const orientationAfterCard = new RegExp(
    `(\\*\\*)?(${cardPattern})(\\*\\*)?\\s*[—–-]+\\s*(xuôi|ngược)\\b`,
    "gi"
  );

  return text.replace(
    orientationAfterCard,
    (
      _match,
      opening: string | undefined,
      matchedName: string,
      closing: string | undefined,
      orientation: string
    ) => {
      const cardName = canonicalNames.get(matchedName.toLocaleLowerCase()) || matchedName;
      return `${opening || ""}${cardName}${closing || ""} ${orientation.toLocaleLowerCase("vi")}`;
    }
  );
}
