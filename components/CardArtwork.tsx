"use client";

import { useEffect, useMemo, useState } from "react";
import type { TarotCard } from "@/lib/types";
import { getCardImageCandidates } from "@/lib/card-images";

type Props = {
  card: TarotCard;
  alt?: string;
  className?: string;
  fallbackClassName?: string;
  eager?: boolean;
};

export default function CardArtwork({ card, alt, className = "", fallbackClassName = "", eager = false }: Props) {
  const candidates = useMemo(() => getCardImageCandidates(card.id), [card.id]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [card.id]);

  if (index >= candidates.length) {
    return (
      <div className={`card-artwork-fallback ${fallbackClassName}`.trim()} aria-label={alt || card.name}>
        <span>{card.symbol}</span>
        <strong>{card.name}</strong>
        <small>{card.vi}</small>
      </div>
    );
  }

  return (
    <img
      src={candidates[index]}
      alt={alt || `${card.name} - Rider–Waite–Smith`}
      className={className}
      onError={() => setIndex((current) => current + 1)}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={eager ? "high" : "auto"}
    />
  );
}
