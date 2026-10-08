"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function CombinedReaderMenu() {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuHost = toggleRef.current?.closest("main");
  function launch(event: string) { setOpen(false); window.dispatchEvent(new Event(event)); }
  return <>
    <button ref={toggleRef} className="side-menu-toggle" type="button" onClick={() => setOpen(true)} aria-label="Mở menu" aria-expanded={open} title="Mở menu"><span /><span /><span /></button>
    {open && menuHost && createPortal(<div className="side-menu-layer" role="presentation" onMouseDown={() => setOpen(false)}>
      <aside className="side-menu-drawer" role="dialog" aria-modal="true" aria-label="Menu" onMouseDown={event => event.stopPropagation()}>
        <div className="side-menu-head"><div className="side-menu-brand"><span aria-hidden="true">✦</span><strong>TTarot Home</strong></div><button className="side-menu-close" type="button" onClick={() => setOpen(false)} aria-label="Thu gọn menu"><span /><span /><span /></button></div>
        <nav className="side-menu-nav" aria-label="Điều hướng"><span className="side-menu-section-label">Menu</span>
          <button type="button" onClick={() => launch("tarot-open-account")}><span><strong>Tài khoản</strong><small>Thông tin đăng nhập và đăng xuất</small></span><b>›</b></button>
          <button type="button" onClick={() => launch("tarot-open-pricing")}><span><strong>Gói dịch vụ</strong><small>Free, Plus, Pro và Pro Max</small></span><b>›</b></button>
        </nav>
      </aside>
    </div>, menuHost)}
  </>;
}
