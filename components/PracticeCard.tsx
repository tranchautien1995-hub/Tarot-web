"use client";

import CardArtwork from "@/components/CardArtwork";
import type { DrawnCard } from "@/lib/types";

type Props = {
  card?: DrawnCard;
  index: number;
  position: string;
  mode: "random" | "manual";
  onPick: () => void;
  onFlip: () => void;
  onRemove: () => void;
};

export default function PracticeCard({ card, index, position, mode, onPick, onFlip, onRemove }: Props) {
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

  const keywords = card.orientation === "upright" ? card.upright : card.reversed;
  return (
    <div className="spread-slot-item practice-card-wrap manual-slot-item">
      <div className="slot-position-heading">
        <span>{String(index + 1).padStart(2, "0")}</span>
        <span className="slot-position-name">{card.position || position}</span>
      </div>
      <div className={`practice-card-face ${card.orientation === "reversed" ? "reversed-card" : ""}`}>
        <div className="practice-card-inner image-mode">
          <span className="practice-number">{String(index + 1).padStart(2, "0")}</span>
          <CardArtwork card={card} className="practice-card-image" fallbackClassName="practice-card-fallback" />
        </div>
      </div>
      <div className="practice-card-caption">
        <strong>{card.name}</strong>
        <small>{card.vi}</small>
        <p>{keywords.slice(0, 3).join(" · ")}</p>
      </div>
      <div className="card-actions">
        <button onClick={onFlip}>{card.orientation === "upright" ? "↑ Xuôi" : "↓ Ngược"}</button>
        <button onClick={onPick}>Thay lá</button>
        <button className="danger-link" onClick={onRemove}>Xóa</button>
      </div>
    </div>
  );
}
