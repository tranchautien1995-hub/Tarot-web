"use client";

import { useMemo, useState } from "react";
import { TAROT_DECK } from "@/lib/deck";
import type { TarotCard } from "@/lib/types";
import CardArtwork from "@/components/CardArtwork";

type Filter = "all" | "major" | "wands" | "cups" | "swords" | "pentacles";

type Props = {
  open: boolean;
  selectedIds: string[];
  slotIndex: number;
  onSelect: (card: TarotCard) => void;
  onClose: () => void;
};

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "major", label: "Major" },
  { id: "wands", label: "Gậy" },
  { id: "cups", label: "Cốc" },
  { id: "swords", label: "Kiếm" },
  { id: "pentacles", label: "Tiền" }
];

export default function CardPicker({ open, selectedIds, slotIndex, onSelect, onClose }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const cards = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("vi-VN");
    return TAROT_DECK.filter((card) => {
      const byFilter = filter === "all" || (filter === "major" ? card.arcana === "major" : card.suit === filter);
      const bySearch = !q || `${card.name} ${card.vi}`.toLocaleLowerCase("vi-VN").includes(q);
      return byFilter && bySearch;
    });
  }, [filter, search]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Chọn lá Tarot" onMouseDown={onClose}>
      <div className="card-picker-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="picker-modal-head">
          <div>
            <span className="mini-label">TỰ CHỌN BÀI</span>
            <h3>Chọn lá cho vị trí {slotIndex + 1}</h3>
          </div>
          <button className="icon-close" onClick={onClose} aria-label="Đóng">×</button>
        </div>

        <div className="picker-tools">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm The Lovers, Hoàng Đế, Queen..." autoFocus />
          <div className="filter-row">
            {FILTERS.map((item) => (
              <button key={item.id} className={filter === item.id ? "active" : ""} onClick={() => setFilter(item.id)}>{item.label}</button>
            ))}
          </div>
        </div>

        <div className="library-grid image-grid">
          {cards.map((card) => {
            const disabled = selectedIds.includes(card.id);
            return (
              <button key={card.id} className={`library-card image-card ${disabled ? "disabled" : ""}`} disabled={disabled} onClick={() => onSelect(card)}>
                <div className="library-art image-mode">
                  <CardArtwork card={card} className="library-image" fallbackClassName="library-fallback" />
                </div>
                <strong>{card.name}</strong>
                <small>{card.vi}</small>
                {disabled && <em>Đã có trong trải bài</em>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
