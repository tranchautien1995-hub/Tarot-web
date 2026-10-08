"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import InteractiveDeck from "@/components/InteractiveDeck";
import LenormandInteractiveDeck from "@/components/LenormandInteractiveDeck";
import LenormandReaderMenu from "@/components/LenormandReaderMenu";
import ReadingText from "@/components/ReadingText";
import { useReaderNavigation } from "@/components/ReaderNavigation";
import { usePlanAccess } from "@/components/AccessContext";
import { useReadingRetry } from "@/components/useReadingRetry";
import { getApiAuthHeaders } from "@/lib/supabase/auth-fetch";
import { COMBINED_SPREADS, type CombinedSpread } from "@/lib/combined/spreads";
import type { DrawnCard } from "@/lib/types";
import type { DrawnLenormandCard } from "@/lib/lenormand/types";
import type { ReadingStyle } from "@/lib/prompts";

const STYLES = [
  { id: "direct", label: "Thẳng thắn", title: "Thẳng thắn, sâu sắc" },
  { id: "gentle", label: "Nhẹ nhàng", title: "Nhẹ nhàng, thấu hiểu" },
  { id: "companion", label: "Tâm sự", title: "Tâm sự, lắng nghe" }
] as const;
// Same ambient stars as the existing reader, confined to this new page.
const STARS = Array.from({ length: 75 }, (_, index) => ({
  kind: ["dot", "sparkle", "five", "dot", "sparkle"][index % 5],
  style: { "--star-left": `${(index * 37 + 11) % 100}%`, "--star-top": `${(index * 53 + 7) % 100}%`, "--star-size": `${2.7 + (index % 7) * .7}px`, "--star-delay": `${-(index % 23) * .31}s`, "--star-duration": `${3.8 + (index % 9) * .48}s`, "--star-drift-x": `${((index * 19) % 56) - 28}px`, "--star-drift-y": `${-24 - (index % 6) * 7}px`, "--star-twinkle": `${1.15 + (index % 6) * .24}s` } as CSSProperties
}));

export default function CombinedReader() {
  const { selectReader } = useReaderNavigation();
  const { access } = usePlanAccess();
  const { retrySeconds, retryBlocked, startRetry, retryMessage } = useReadingRetry();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [themeReady, setThemeReady] = useState(false);
  const [spread, setSpread] = useState<CombinedSpread>("contrast");
  const [spreadChosen, setSpreadChosen] = useState(true);
  const [question, setQuestion] = useState("");
  const [readingStyle, setReadingStyle] = useState<ReadingStyle>("direct");
  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState<"tarot" | "lenormand" | "complete">("tarot");
  const [tarotSelected, setTarotSelected] = useState<DrawnCard[]>([]);
  const [lenormandSelected, setLenormandSelected] = useState<DrawnLenormandCard[]>([]);
  const [tarotSession, setTarotSession] = useState(0);
  const [lenormandSession, setLenormandSession] = useState(0);
  const [loading, setLoading] = useState(false);
  const [readingOpen, setReadingOpen] = useState(false);
  const [reading, setReading] = useState("");
  const [error, setError] = useState("");
  const requestRef = useRef<AbortController | null>(null);
  const readingBusy = useRef(false);
  const definition = COMBINED_SPREADS[spread];
  const complete = phase === "complete" && tarotSelected.length === definition.tarotPositions.length && lenormandSelected.length === definition.lenormandPositions.length;

  useEffect(() => {
    try { setTheme(localStorage.getItem("tarot-practice-theme-v2") === "light" ? "light" : "dark"); } catch { /* Optional persistence. */ }
    setThemeReady(true);
    return () => requestRef.current?.abort();
  }, []);
  useEffect(() => {
    if (!themeReady) return;
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("tarot-practice-theme-v2", theme); } catch { /* Optional persistence. */ }
  }, [theme, themeReady]);

  function clearReading() { setReading(""); setError(""); setReadingOpen(false); }
  function resetTarot() {
    if (readingBusy.current) return;
    clearReading(); setTarotSelected([]); setLenormandSelected([]); setPhase("tarot");
    setTarotSession(value => value + 1); setLenormandSession(value => value + 1);
  }
  function chooseSpread(next: CombinedSpread) {
    if (readingBusy.current) return;
    resetTarot();
    if (next === spread && spreadChosen) { setSpreadChosen(false); return; }
    setSpread(next); setSpreadChosen(true);
  }
  async function readCards() {
    if (!complete || readingBusy.current || retryBlocked() || !access.canUseLenormand) return;
    readingBusy.current = true;
    const abort = new AbortController(); requestRef.current = abort;
    setLoading(true); setReadingOpen(true); setReading(""); setError("");
    try {
      const response = await fetch("/api/combined/read", {
        method: "POST", signal: abort.signal,
        headers: { "Content-Type": "application/json", ...await getApiAuthHeaders() },
        body: JSON.stringify({ question, spread, readingStyle,
          tarot: tarotSelected.map(({ id, name, orientation, position }) => ({ id, name, orientation, position })),
          lenormand: lenormandSelected.map(({ id, name, number, position }) => ({ id, name, number, position }))
        })
      });
      if (!response.ok || !response.body) throw new Error("Không thể đọc trải bài.");
      const reader = response.body.getReader(), decoder = new TextDecoder(); let output = "";
      try {
        while (true) {
          const { done, value } = await reader.read(); if (done) break;
          output += decoder.decode(value, { stream: true }); setReading(output);
        }
        output += decoder.decode();
        if (!output.trim()) throw new Error("Không có nội dung bài đọc.");
        setReading(output);
      } finally { reader.releaseLock(); }
    } catch {
      if (!abort.signal.aborted) { setReading(""); setError("Hệ thống đang quá tải."); startRetry(); }
    } finally {
      readingBusy.current = false;
      if (!abort.signal.aborted) setLoading(false);
      if (requestRef.current === abort) requestRef.current = null;
    }
  }

  return <main className={`theme-${theme} combined-reader`} data-theme={theme}>
    <div className="ambient" aria-hidden="true" />
    <div className="star-field" aria-hidden="true">{STARS.map((star, index) => <span key={index} className={`star-item star-${star.kind}`} style={star.style}>{star.kind === "five" ? "★" : star.kind === "sparkle" ? "✦" : ""}</span>)}</div>
    {<nav className="product-navigation shell" aria-label="Các công cụ TTarot"><LenormandReaderMenu /><div className="product-tabs" role="tablist" aria-label="Loại công cụ"><button type="button" role="tab" aria-selected="false" onClick={() => selectReader("tarot")}>Trải bài Tarot</button><button type="button" role="tab" aria-selected="false" onClick={() => selectReader("lenormand")}>Trải bài Lenormand</button><button className="active" type="button" role="tab" aria-selected="true">Tarot x Lenormand</button></div></nav>}
    <header className="topbar shell"><div className="brand">✦ TTAROT HOME</div><button className="theme-toggle" type="button" onClick={() => setTheme(current => current === "dark" ? "light" : "dark")}>{theme === "dark" ? "☀ Light" : "☾ Dark"}</button></header>
    {!started && <section className="intro shell compact-intro flow-intro"><h1>Tarot × Lenormand</h1><p className="lead">Tarot đi vào chiều sâu. Lenormand kiểm chứng bằng diễn biến thực tế.</p></section>}
    <section className="workspace shell">
      {!access.canUseLenormand ? <div className="panel"><h2>Tarot × Lenormand</h2><p>Gói hiện tại chưa hỗ trợ Lenormand.</p><button className="gold-button" onClick={() => window.dispatchEvent(new Event("tarot-open-pricing"))}>Nâng cấp</button></div> : !started ? <section className="flow-stage flow-stage-setup">
        <div className="flow-stage-head"><div><div className="panel-kicker">PHẦN 1 · THIẾT LẬP</div><h2>Câu hỏi & kiểu trải</h2></div></div>
        <div className="panel question-card"><div className="panel-kicker">01 · CÂU HỎI</div><textarea aria-label="Câu hỏi Tarot × Lenormand" maxLength={5000} value={question} onChange={event => setQuestion(event.target.value)} placeholder="Người yêu cũ còn tình cảm với tôi không và mối quan hệ này có khả năng tiến triển thực tế không?" /><div className="panel-kicker reading-style-label">PHONG CÁCH ĐỌC BÀI</div><div className="reading-style-picker">{STYLES.map(style => <button key={style.id} type="button" className={readingStyle === style.id ? "active" : ""} aria-pressed={readingStyle === style.id} title={style.title} onClick={() => setReadingStyle(current => current === style.id ? "default" : style.id)}>{style.label}</button>)}</div></div>
        <div className="panel preset-panel"><div className="panel-kicker">02 · KIỂU TRẢI</div><div className="preset-grid combined-spreads">{(Object.keys(COMBINED_SPREADS) as CombinedSpread[]).map(id => <button key={id} type="button" className={spreadChosen && spread === id ? "active" : ""} aria-pressed={spreadChosen && spread === id} onClick={() => chooseSpread(id)}><b>{COMBINED_SPREADS[id].title}</b><small>{COMBINED_SPREADS[id].description}</small></button>)}</div></div>
        <div className="flow-continue-row"><div className="flow-continue-summary">{spreadChosen ? definition.title : "Chọn kiểu trải"}</div><button className="gold-button flow-continue-button" disabled={!question.trim() || !spreadChosen} onClick={() => { if (!question.trim() || !spreadChosen) return; setStarted(true); }}>Tiếp tục →</button></div>
      </section> : <section className="flow-stage flow-stage-draw">
        <div className="flow-stage-head flow-stage-head-nav-only"><span className="flow-step-indicator">{definition.title}</span><button className="ghost-button flow-back-button" disabled={loading} onClick={() => setStarted(false)}>← Quay lại</button></div>
        <div className="combined-table interactive-draw panel draw-table v25-table v26-table v27-table" data-phase={phase} data-spread={spread}>
          <section className={`combined-deck combined-tarot ${phase !== "tarot" ? "combined-deck-locked" : ""}`} aria-label="Tarot trên bàn">
            <div className="combined-deck-label"><h2>Tarot</h2></div>
            <div inert={phase !== "tarot"}><InteractiveDeck key={`tarot-${spread}-${tarotSession}`} count={definition.tarotPositions.length} positions={definition.tarotPositions} spreadLabel="Tarot" onComplete={cards => { setTarotSelected(cards); setPhase("lenormand"); }} onCardRemoved={() => { setTarotSelected([]); clearReading(); }} /></div>
          </section>
          <section className={`combined-deck combined-lenormand ${phase !== "lenormand" ? "combined-deck-locked" : ""}`} aria-label="Lenormand trên bàn">
            <div className="combined-deck-label"><h2>Lenormand</h2></div>
            <div inert={phase === "tarot"}><LenormandInteractiveDeck key={`lenormand-${spread}-${lenormandSession}`} count={definition.lenormandPositions.length} positions={definition.lenormandPositions} spreadLabel="Lenormand" actions={complete ? <button className="gold-button reading-ai-button" disabled={loading || retrySeconds > 0} onClick={readCards}>{loading ? "Đang đọc bài..." : retrySeconds > 0 ? `Đọc bài (${retrySeconds}s)` : "✦ Đọc bài"}</button> : undefined} spreadPreset={spread === "overview" ? "box9" : undefined} onComplete={cards => { setLenormandSelected(cards); setPhase("complete"); }} onCardRemoved={() => { setLenormandSelected([]); setPhase("lenormand"); clearReading(); }} /></div>
          </section>
          {phase !== "complete" && <div className="combined-stage-space" aria-hidden="true" />}

        </div>
      </section>}
    </section>
    {readingOpen && <div className="ai-reading-modal-backdrop" role="presentation" onMouseDown={() => setReadingOpen(false)}><section className="ai-reading-modal" role="dialog" aria-modal="true" aria-label="Bài đọc Tarot × Lenormand" onMouseDown={event => event.stopPropagation()}><header className="ai-reading-modal-header"><div><span className="panel-kicker">TAROT × LENORMAND</span><h2>Đọc trải bài</h2><p>{definition.title} · {STYLES.find(style => style.id === readingStyle)?.title || "Cách đọc mặc định"}</p></div><button className="ai-modal-close" aria-label="Đóng bài đọc" onClick={() => setReadingOpen(false)}>×</button></header><div className="ai-reading-modal-body">{loading && !reading && <div className="ai-modal-loading"><b>Đang kết nối chiều sâu và diễn biến thực tế...</b></div>}{error && !loading && <div className="error-box"><p role="status" aria-live="polite">{retryMessage}</p><button className="ghost-button" disabled={retrySeconds > 0} onClick={readCards}>Thử lại</button></div>}{reading && <div className="ai-reading-content"><ReadingText text={reading} streaming={loading} cardNames={[...tarotSelected.map(card => card.name), ...lenormandSelected.map(card => card.name)]} /></div>}</div></section></div>}
  </main>;
}
