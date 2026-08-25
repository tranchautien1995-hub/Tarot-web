"use client";

import { memo } from "react";
import CardArtwork from "@/components/CardArtwork";
import type { DrawnCard } from "@/lib/types";

type Props = {
  card: DrawnCard;
  revealed: boolean;
  index: number;
};

function TarotCardView({ card, revealed, index }: Props) {
  const keywords = card.orientation === "upright" ? card.upright : card.reversed;
  return (
    <div className="card-slot" style={{ animationDelay: `${index * 90}ms` }}>
      <div className={`tarot-card ${revealed ? "revealed" : ""}`}>
        <div className="card-face card-back">
          <div className="back-frame">
            <div className="moon-mark">☾</div>
            <div className="back-star">✦</div>
            <div className="back-title">TAROT</div>
            <div className="back-star small">✧</div>
          </div>
        </div>
        <div className="card-face card-front">
          <div className={`front-inner image-mode ${card.orientation === "reversed" ? "is-reversed" : ""}`}>
            <div className="card-index">{String(index + 1).padStart(2, "0")}</div>
            <CardArtwork card={card} className="viewer-image" fallbackClassName="viewer-fallback" />
            <div className="card-name">{card.name}</div>
            <div className="card-vi">{card.vi}</div>
            <div className="keyword-line">{keywords.slice(0, 3).join(" · ")}</div>
          </div>
        </div>
      </div>
      <div className="card-meta">
        <span>{card.position}</span>
        <b className={card.orientation}>{card.orientation === "upright" ? "↑ XUÔI" : "↓ NGƯỢC"}</b>
      </div>
    </div>
  );
}

export default memo(TarotCardView);
