"use client";

import { useMemo, useState } from "react";
import { LENORMAND_DECK } from "@/lib/lenormand/deck";
import type { LenormandCard } from "@/lib/lenormand/types";
import LenormandCardArtwork from "@/components/LenormandCardArtwork";

type Props = {
  open: boolean;
  selectedIds: string[];
  slotIndex: number;
  onSelect: (card: LenormandCard) => void;
  onClose: () => void;
};

export default function LenormandCardPicker({ open, selectedIds, slotIndex, onSelect, onClose }: Props) {
  const [search, setSearch] = useState("");

  const cards = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("vi-VN");
    return LENORMAND_DECK.filter((card) => {
      const bySearch = !q || `${card.name} ${card.vi}`.toLocaleLowerCase("vi-VN").includes(q);
      return bySearch;
    });
  }, [search]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Chọn lá Lenormand" onMouseDown={onClose}>
      <div className="card-picker-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="picker-modal-head">
          <div>
            <span className="mini-label">TỰ CHỌN BÀI</span>
            <h3>Chọn lá cho vị trí {slotIndex + 1}</h3>
          </div>
          <button className="icon-close" onClick={onClose} aria-label="Đóng">×</button>
        </div>

        <div className="picker-tools">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm Rider, Heart, Trái tim..." autoFocus />
          <div className="filter-row"><button className="active" type="button">Đủ 36 lá</button></div>
        </div>

        <div className="library-grid image-grid">
          {cards.map((card) => {
            const disabled = selectedIds.includes(card.id);
            return (
              <button key={card.id} className={`library-card image-card ${disabled ? "disabled" : ""}`} disabled={disabled} onClick={() => onSelect(card)}>
                <div className="library-art image-mode">
                  <LenormandCardArtwork card={card} className="library-image" fallbackClassName="library-fallback" />
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
