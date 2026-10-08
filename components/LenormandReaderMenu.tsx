"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { LenormandHistoryEntry } from "@/lib/lenormand/history";

type Props = {
  history: LenormandHistoryEntry[];
  historyLimit: number;
  readingBusy: boolean;
  onRestore: (entry: LenormandHistoryEntry) => void;
  onDelete: (id: string) => void;
};

export default function LenormandReaderMenu({ history, historyLimit, readingBusy, onRestore, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"main" | "history">("main");
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuHost = toggleRef.current?.closest("main");
  function launch(event: string) { setOpen(false); window.dispatchEvent(new Event(event)); }
  return <>
    <button ref={toggleRef} className="side-menu-toggle" type="button" onClick={() => setOpen(true)} aria-label="Mở menu" aria-expanded={open} title="Mở menu"><span /><span /><span /></button>
    {open && menuHost && createPortal(<div className="side-menu-layer" role="presentation" onMouseDown={() => setOpen(false)}>
      <aside className="side-menu-drawer" role="dialog" aria-modal="true" aria-label="Menu" onMouseDown={event => event.stopPropagation()}>
        <div className="side-menu-head"><div className="side-menu-brand"><span aria-hidden="true">✦</span><strong>TTarot Home</strong></div><button className="side-menu-close" type="button" onClick={() => setOpen(false)} aria-label="Thu gọn menu"><span /><span /><span /></button></div>
        {view === "main" ? <nav className="side-menu-nav" aria-label="Điều hướng"><span className="side-menu-section-label">Menu</span>
          <button type="button" onClick={() => setView("history")}><span><strong>Lịch sử trải bài</strong><small>Xem lại và nghe bài Lenormand đã lưu</small></span><b>›</b></button>
          <button type="button" onClick={() => launch("tarot-open-account")}><span><strong>Tài khoản</strong><small>Thông tin đăng nhập và đăng xuất</small></span><b>›</b></button>
          <button type="button" onClick={() => launch("tarot-open-pricing")}><span><strong>Gói dịch vụ</strong><small>Free, Plus, Pro và Pro Max</small></span><b>›</b></button>
        </nav> : <div className="side-history-view">
          <div className="side-history-toolbar"><button className="side-history-back" type="button" onClick={() => setView("main")}>← Menu</button></div>
          {historyLimit === 0 ? <div className="history-empty side-history-empty">Gói hiện tại chưa hỗ trợ lưu lịch sử.<button className="gold-button" type="button" onClick={() => launch("tarot-open-pricing")}>Nâng cấp</button></div>
            : history.length === 0 ? <div className="history-empty side-history-empty">Chưa có trải bài Lenormand được lưu. Bài đọc hoàn tất sẽ được tự động lưu trên trình duyệt này.</div>
            : <div className="history-list side-history-list">{history.map(entry => <article className="history-card side-history-card" key={entry.id}>
              <div className="history-card-top"><div><span>{new Date(entry.savedAt).toLocaleString("vi-VN")} · {entry.cards.length} lá</span><h3>{entry.question || "Không có câu hỏi cụ thể"}</h3></div></div>
              <div className="side-history-actions"><button type="button" disabled={readingBusy} onClick={() => { onRestore(entry); setOpen(false); }}>Mở lại</button><button type="button" onClick={() => onDelete(entry.id)}>Xóa</button></div>
              <div className="history-cards-line">{entry.cards.map((card, index) => <span key={card.id}>{index + 1}. {card.vi}</span>)}</div>
              <p className="history-reading-preview">{entry.reading.replace(/[#*_`]/g, "").slice(0, 180)}{entry.reading.length > 180 ? "…" : ""}</p>
            </article>)}</div>}
        </div>}
      </aside>
    </div>, menuHost)}
  </>;
}
