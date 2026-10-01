"use client";

import { memo } from "react";
import { getLenormandCardImageUrl } from "@/lib/lenormand/card-images";
import type { LenormandCard } from "@/lib/lenormand/types";

type Props = {
  card: LenormandCard;
  alt?: string;
  className?: string;
  fallbackClassName?: string;
  eager?: boolean;
};

function LenormandCardArtwork({ card, alt, className = "", eager = false }: Props) {
  return (
    <img
      src={getLenormandCardImageUrl(card.number)}
      alt={alt || `${card.name} · ${card.vi} · Dondorf Lenormand`}
      className={`lenormand-sprite-card ${className}`.trim()}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
    />
  );
}

export default memo(LenormandCardArtwork);
