"use client";

import LenormandCardArtwork from "@/components/LenormandCardArtwork";
import type { DrawnLenormandCard } from "@/lib/lenormand/types";

type Props = {
  card?: DrawnLenormandCard;
  index: number;
  position: string;
  mode: "random" | "manual";
  onPick: () => void;
  onRemove: () => void;
};

export default function LenormandPracticeCard({ card, index, position, mode, onPick, onRemove }: Props) {
  if (!card) {
    return (
      <div className="spread-slot-item practice-card-wrap manual-slot-item">
        <div className="slot-position-heading">
          <span>{String(index + 1).padStart(2, "0")}</span>
          <span className="slot-position-name">{position}</span>
        </div>
        <button className="empty-card-slot manual-empty-slot" onClick={onPick}>
          <b>＋</b>
          <em>{mode === "manual" ? "Chọn một lá" : "Chưa rút"}</em>
        </button>
      </div>
    );
  }

  return (
    <div className="spread-slot-item practice-card-wrap manual-slot-item">
      <div className="slot-position-heading">
        <span>{String(index + 1).padStart(2, "0")}</span>
        <span className="slot-position-name">{card.position || position}</span>
      </div>
      <div className="practice-card-face">
        <div className="practice-card-inner image-mode">
          <span className="practice-number">{String(index + 1).padStart(2, "0")}</span>
          <LenormandCardArtwork card={card} className="practice-card-image" fallbackClassName="practice-card-fallback" />
        </div>
      </div>
      <div className="practice-card-caption">
        <strong>{card.name}</strong>
        <small>{card.vi}</small>
        <p>{card.keywords.slice(0, 3).join(" · ")}</p>
      </div>
      <div className="card-actions">
        <button onClick={onPick}>Thay lá</button>
        <button className="danger-link" onClick={onRemove}>Xóa</button>
      </div>
    </div>
  );
}
