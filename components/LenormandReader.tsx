"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import LenormandReaderMenu from "@/components/LenormandReaderMenu";
import { useReadingRetry } from "@/components/useReadingRetry";
import { useTtsPlayback } from "@/components/useTtsPlayback";
import { createTtsJobId } from "@/lib/tts/job-id";
import { parseLenormandHistory, type LenormandHistoryEntry } from "@/lib/lenormand/history";
import LenormandCardPicker from "@/components/LenormandCardPicker";
import LenormandInteractiveDeck from "@/components/LenormandInteractiveDeck";
import LenormandPracticeCard from "@/components/LenormandPracticeCard";
import { useReaderNavigation } from "@/components/ReaderNavigation";
import { usePlanAccess } from "@/components/AccessContext";
import { getApiAuthHeaders } from "@/lib/supabase/auth-fetch";
import ReadingText from "@/components/ReadingText";
import { HOUSE_NAMES } from "@/lib/lenormand/deck";
import type { DrawnLenormandCard, LenormandCard, LenormandSpread, ReadingStyle } from "@/lib/lenormand/types";

type DrawMode = "random" | "manual";
type ThemeMode = "light" | "dark";
type Significator = "man" | "woman";
type SpreadDefinition = { id: LenormandSpread; count: number; title: string; description: string; questionMode: "required" | "optional" };

const SPREADS: SpreadDefinition[] = [
  { id: "line3", count: 3, title: "3 lá", description: "Tình huống · Trọng tâm · Hướng phát triển", questionMode: "required" },
  { id: "line5", count: 5, title: "5 lá", description: "Trọng tâm · cặp kề · đối xứng · toàn chuỗi", questionMode: "required" },
  { id: "box9", count: 9, title: "Ma trận 3×3", description: "Tâm · hàng · cột · đường chéo · bốn góc", questionMode: "required" },
  { id: "grand_tableau", count: 36, title: "Grand Tableau", description: "36 lá · significator · Houses · chủ đề lớn", questionMode: "optional" }
];

const READING_STYLES: Array<{ id: ReadingStyle; label: string; fullLabel: string }> = [
  { id: "direct", label: "Thẳng thắn", fullLabel: "Thẳng thắn, rõ ràng, đi vào sự việc" },
  { id: "gentle", label: "Nhẹ nhàng", fullLabel: "Nhẹ nhàng, thấu hiểu nhưng không né tránh" },
  { id: "companion", label: "Tâm sự", fullLabel: "Tâm sự, lắng nghe và gần gũi" }
];

type StarKind = "dot" | "sparkle" | "five";
const STAR_FIELD = Array.from({ length: 75 }, (_, index) => {
  const kinds: StarKind[] = ["dot", "sparkle", "five", "dot", "sparkle"];
  return {
    kind: kinds[index % kinds.length], left: `${(index * 37 + 11) % 100}%`, top: `${(index * 53 + 7) % 100}%`,
    size: `${2.7 + (index % 7) * 0.7}px`, delay: `${-(index % 23) * 0.31}s`, duration: `${3.8 + (index % 9) * 0.48}s`,
    driftX: `${((index * 19) % 56) - 28}px`, driftY: `${-24 - (index % 6) * 7}px`, twinkle: `${1.15 + (index % 6) * 0.24}s`
  };
});

function positionsFor(spread: LenormandSpread): string[] {
  if (spread === "line3") return ["Tình huống / điều mở đầu", "Trọng tâm", "Hướng phát triển"];
  if (spread === "line5") return ["Bối cảnh ngoài", "Ảnh hưởng gần", "Trọng tâm", "Ảnh hưởng gần", "Hướng ngoài"];
  if (spread === "box9") return ["Bề mặt · trái", "Bề mặt · giữa", "Bề mặt · phải", "Hiện tại · trái", "Trọng tâm", "Hiện tại · phải", "Nền / hệ quả · trái", "Nền / hệ quả · giữa", "Nền / hệ quả · phải"];
  return HOUSE_NAMES;
}

function readingStyleFullLabel(style: ReadingStyle | null) {
  return READING_STYLES.find((item) => item.id === style)?.fullLabel || "Cách đọc mặc định";
}

function readingForSpeech(value: string) {
  return value.replace(/```[\s\S]*?```/g, " ")
    .replace(/[*_`#>]/g, "").replace(/^\s*[-•]\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n").trim();
}

export default function LenormandReader() {
  const { selectReader } = useReaderNavigation();
  const { retrySeconds, retryBlocked, startRetry, retryMessage } = useReadingRetry();
  const [spreadChosen, setSpreadChosen] = useState(true);
  const [modeChosen, setModeChosen] = useState(true);
  const { access, userId } = usePlanAccess();
  const historyLimit = access.historyLimit ?? 50;
  const historyKey = `lenormand-practice-v1-history:${userId}`;
  const [history, setHistory] = useState<LenormandHistoryEntry[]>([]);
  const [loadedHistoryKey, setLoadedHistoryKey] = useState("");
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [themeReady, setThemeReady] = useState(false);
  const [flowStep, setFlowStep] = useState<1 | 2>(1);
  const [spread, setSpread] = useState<LenormandSpread>("line3");
  const [mode, setMode] = useState<DrawMode>("random");
  const [question, setQuestion] = useState("");
  const [timeframe, setTimeframe] = useState("Trong 3 tháng tới");
  const [significator, setSignificator] = useState<Significator>("woman");
  const [readingStyle, setReadingStyle] = useState<ReadingStyle | null>("direct");
  const [cards, setCards] = useState<Array<DrawnLenormandCard | undefined>>(() => Array(3).fill(undefined));
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);
  const [drawSession, setDrawSession] = useState(0);
  const [reading, setReading] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [readingOpen, setReadingOpen] = useState(false);
  const { speechStatus, speechError, startReadingAloud, stopReadingAloud, toggleSpeechPause } = useTtsPlayback();

  const definition = SPREADS.find((item) => item.id === spread)!;
  const count = definition.count;
  const positions = useMemo(() => positionsFor(spread), [spread]);
  const selectedCards = useMemo(() => cards.filter((card): card is DrawnLenormandCard => Boolean(card)), [cards]);
  const selectedIds = selectedCards.map((card) => card.id);
  const complete = selectedCards.length === count;

  useEffect(() => {
    try { setHistory(parseLenormandHistory(window.localStorage.getItem(historyKey), historyLimit)); }
    catch { setHistory([]); }
    setLoadedHistoryKey(historyKey);
  }, [historyKey, historyLimit]);
  useEffect(() => {
    if (loadedHistoryKey !== historyKey || historyLimit === 0) return;
    try { window.localStorage.setItem(historyKey, JSON.stringify(history.slice(0, historyLimit))); }
    catch { /* Reading remains available when storage is full. */ }
  }, [history, historyKey, historyLimit, loadedHistoryKey]);

  function restoreHistory(entry: LenormandHistoryEntry) {
    if (loading) return;
    stopReadingAloud();
    setSpread(entry.spread); setSpreadChosen(true); setMode(entry.mode); setModeChosen(true);
    setQuestion(entry.question); setTimeframe(entry.timeframe); setSignificator(entry.significator);
    setReadingStyle(entry.readingStyle); setCards(entry.cards.map(card => ({ ...card })));
    setReading(entry.reading); setError(""); setPickerIndex(null); setFlowStep(2);
    setDrawSession(value => value + 1); setReadingOpen(true);
  }

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("tarot-practice-theme-v2");
      setTheme(stored === "light" ? "light" : "dark");
    } catch { setTheme("dark"); } finally { setThemeReady(true); }
  }, []);
  useEffect(() => {
    if (!themeReady) return;
    document.documentElement.dataset.theme = theme;
    try { window.localStorage.setItem("tarot-practice-theme-v2", theme); } catch { /* Optional persistence. */ }
  }, [theme, themeReady]);

  function chooseSpread(next: LenormandSpread) {
    if (spread === next && spreadChosen) { setSpreadChosen(false); return; }
    stopReadingAloud();
    setSpreadChosen(true);
    const nextDefinition = SPREADS.find((item) => item.id === next)!;
    setSpread(next); setCards(Array(nextDefinition.count).fill(undefined)); setReading(""); setError(""); setDrawSession((value) => value + 1);
  }
  function clearSpread() {
    stopReadingAloud();
    setCards(Array(count).fill(undefined)); setReading(""); setError(""); setReadingOpen(false); setDrawSession((value) => value + 1);
  }
  function completeInteractiveDraw(nextCards: DrawnLenormandCard[]) {
    stopReadingAloud();
    setCards(nextCards); setReading(""); setError("");
  }
  function selectManual(card: LenormandCard) {
    if (pickerIndex === null) return;
    stopReadingAloud();
    setCards((current) => current.map((item, index) => index === pickerIndex ? { ...card, position: positions[index] } : item));
    setPickerIndex(null); setReading("");
  }
  function removeCard(index: number) {
    stopReadingAloud();
    setCards(current => current.map((card, i) => i === index ? undefined : card));
    setReading(""); setError(""); setReadingOpen(false);
  }
  function chooseMode(next: DrawMode) {
    if (mode === next && modeChosen) { setModeChosen(false); return; }
    setModeChosen(true); setMode(next); clearSpread();
  }
  function closeReading() {
    stopReadingAloud();
    setReadingOpen(false);
  }
  async function readCards() {
    if (loading || retryBlocked()) return;
    if (!access.canUseLenormand) return setError("Gói hiện tại chưa hỗ trợ Lenormand. Hãy nâng cấp gói để đọc bài.");
    if (!complete) return setError(`Bạn cần chọn đủ ${count} lá.`);
    if (definition.questionMode === "required" && !question.trim()) return setError("Hãy nhập một câu hỏi cụ thể cho trải bài này.");
    if (!timeframe.trim()) return setError("Hãy nhập khung thời gian để bài đọc không quá rộng.");
    stopReadingAloud();
    setReadingOpen(true); setLoading(true); setError(""); setReading("");
    try {
      const response = await fetch("/api/lenormand/read", { method: "POST", headers: { "Content-Type": "application/json", ...await getApiAuthHeaders() }, body: JSON.stringify({ question, timeframe, spread, cards: selectedCards, significator, readingStyle }) });
      if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.error || `HTTP ${response.status}`); }
      if (!response.body) throw new Error("API không trả về nội dung.");
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let output = "";
      while (true) { const { done, value } = await reader.read(); if (done) break; output += decoder.decode(value, { stream: true }); setReading(output); }
      output += decoder.decode(); setReading(output);
      if (output.trim() && historyLimit > 0) {
        const entry: LenormandHistoryEntry = {
          id: createTtsJobId(), savedAt: new Date().toISOString(), question, timeframe, significator,
          spread, mode, readingStyle, cards: selectedCards.map(card => ({ ...card })), reading: output
        };
        setHistory(current => [entry, ...current].slice(0, historyLimit));
      }
    } catch { setReading(""); setError("Hệ thống đang quá tải."); startRetry(); }
    finally { setLoading(false); }
  }

  return (
    <main className={`theme-${theme} lenormand-reader`} data-theme={theme}>
      <div className="ambient" aria-hidden="true" />
      <div className="star-field" aria-hidden="true">{STAR_FIELD.map((star, index) => <span key={index} className={`star-item star-${star.kind}`} style={{ "--star-left": star.left, "--star-top": star.top, "--star-size": star.size, "--star-delay": star.delay, "--star-duration": star.duration, "--star-drift-x": star.driftX, "--star-drift-y": star.driftY, "--star-twinkle": star.twinkle } as CSSProperties}>{star.kind === "five" ? "★" : star.kind === "sparkle" ? "✦" : ""}</span>)}</div>

      <nav className="product-navigation shell" aria-label="Các công cụ TTarot"><LenormandReaderMenu history={loadedHistoryKey === historyKey ? history.slice(0, historyLimit) : []} historyLimit={historyLimit} readingBusy={loading} onRestore={restoreHistory} onDelete={id => setHistory(current => current.filter(entry => entry.id !== id))} /><div className="product-tabs" role="tablist" aria-label="Loại công cụ"><button type="button" role="tab" aria-selected="false" onClick={() => selectReader("tarot")}>Trải bài Tarot</button><button className="active" type="button" role="tab" aria-selected="true">Trải bài Lenormand</button><button type="button" role="tab" aria-selected="false" disabled>Tarot x Lenormand</button></div></nav>
      <header className="topbar shell"><div className="topbar-left"><div className="brand">✦ LENORMAND PRACTICE</div></div><div className="topbar-right"><div className="theme-toggle-wrap"><button className="theme-toggle" type="button" onClick={() => setTheme((current) => current === "light" ? "dark" : "light")}><span className="theme-toggle-icon">{theme === "light" ? "☾" : "☀"}</span><span>{theme === "light" ? "Dark" : "Light"}</span></button></div></div></header>

      <section className={`intro shell compact-intro flow-intro ${flowStep === 2 ? "flow-intro-hidden" : ""}`}><div className="eyebrow">Không gian trải bài Lenormand cá nhân</div><h1>Tự trải, tự bốc.<br/><em>Đọc điều đang diễn ra.</em></h1><p className="lead">Ghép các lá thành câu, đọc sự việc và hướng phát triển theo đúng phương pháp Petit Lenormand.</p></section>

      <section className="workspace shell">
        {flowStep === 1 && <section className="flow-stage flow-stage-setup" aria-label="Phần 1 - Thiết lập trải bài">
          <div className="flow-stage-head"><div><div className="panel-kicker">PHẦN 1 · THIẾT LẬP</div><h2>Câu hỏi & cách lấy bài</h2></div><div className="flow-stage-head-actions"><button className="upgrade-glow-button" type="button" onClick={() => window.dispatchEvent(new Event("tarot-open-pricing"))}>Nâng cấp</button><span className="flow-step-indicator">1 / 2</span></div></div>
          <div className="panel question-card">
            <div className="panel-kicker">01 · CÂU HỎI</div>
            <textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={definition.questionMode === "optional" ? "Có thể để trống để xem tổng quan, hoặc nhập một chủ đề trọng tâm" : "Mối quan hệ giữa tôi và người ấy sẽ phát triển thế nào?"} aria-label="Câu hỏi cho trải bài Lenormand" />
            <div className="lenormand-reading-settings-row">
              <div className="lenormand-context-row">
                <label><span>KHUNG THỜI GIAN</span><input value={timeframe} onChange={(event) => setTimeframe(event.target.value)} placeholder="Ví dụ: Trong 3 tháng tới" /></label>
                {spread === "grand_tableau" && <label><span>LÁ ĐẠI DIỆN</span><select value={significator} onChange={(event) => setSignificator(event.target.value as Significator)}><option value="woman">Woman · Người nữ</option><option value="man">Man · Người nam</option></select></label>}
              </div>
              <div className="lenormand-reading-style-group">
                <div className="panel-kicker reading-style-label">PHONG CÁCH ĐỌC BÀI</div>
                <div className="reading-style-picker" aria-label="Phong cách đọc bài">{READING_STYLES.map((style) => <button key={style.id} type="button" className={readingStyle === style.id ? "active" : ""} aria-pressed={readingStyle === style.id} title={style.fullLabel} onClick={() => setReadingStyle(current => current === style.id ? null : style.id)}><span className="reading-style-short">{style.label}</span><span className="reading-style-tooltip" role="tooltip">{style.fullLabel}</span></button>)}</div>
              </div>
            </div>
          </div>
          <div className="control-grid v23-controls">
            <div className="panel"><div className="panel-kicker">02 · CÁCH LẤY BÀI</div><div className="mode-switch"><button className={modeChosen && mode === "random" ? "active" : ""} onClick={() => chooseMode("random")}><span>✦</span><b>Xáo & bốc bài</b><small>Xáo bộ bài, trải 36 lá úp rồi kéo từng lá vào vị trí bạn muốn.</small></button><button className={modeChosen && mode === "manual" ? "active" : ""} onClick={() => chooseMode("manual")}><span>🃏</span><b>Tự rút bài</b><small>Dành cho bạn đang học Lenormand và có sẵn bộ bài.</small></button></div></div>
            <div className="panel preset-panel"><div className="panel-kicker">03 · KIỂU TRẢI</div><div className="preset-grid lenormand-preset-grid">{SPREADS.map((item) => <button key={item.id} type="button" className={spreadChosen && spread === item.id ? "active" : ""} onClick={() => chooseSpread(item.id)}><b>{item.title}</b><small>{item.description}</small></button>)}</div></div>
          </div>
          <div className="flow-continue-row"><div className="flow-continue-summary"><span>{spreadChosen ? definition.title : "Chọn kiểu trải"}</span><span>·</span><span>{modeChosen ? (mode === "random" ? "Xáo & bốc bài" : "Tự rút bài") : "Chọn cách lấy bài"}</span></div><button className="gold-button flow-continue-button" disabled={!spreadChosen || !modeChosen} type="button" onClick={() => { if (!spreadChosen || !modeChosen) return; setFlowStep(2); window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0); }}>Tiếp tục →</button></div>
        </section>}

        {flowStep === 2 && <section className="flow-stage flow-stage-spread" aria-label="Phần 2 - Trải bài">
          <div className="flow-stage-head flow-stage-head-spread flow-stage-head-nav-only"><div className="flow-stage-nav"><span className="flow-step-indicator">2 / 2</span><button className="ghost-button" type="button" onClick={() => { setFlowStep(1); window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0); }}>← Quay lại</button></div></div>
          {mode === "random" && <LenormandInteractiveDeck key={`${spread}-${drawSession}`} count={count} positions={positions} spreadLabel={definition.title} spreadPreset={spread} onComplete={completeInteractiveDraw} onCardRemoved={removeCard} actions={<section className="reading-actions-panel reading-actions-inside"><div className="spread-management-actions"><button className="ghost-button danger-action" onClick={clearSpread}>Xóa trải bài</button></div><div className="spread-reading-actions"><button className="gold-button reading-ai-button" disabled={!complete || loading || retrySeconds > 0} onClick={readCards}>{loading ? "Đang đọc bài..." : "✦ Đọc bài"}</button></div></section>} />}
          {mode === "manual" && <div className="manual-spread-reading-shell"><div className="manual-spread-meta"><div className="panel-kicker">04 · TRẢI BÀI · {definition.title}</div><h2>{selectedCards.length}/{count} lá đã có</h2></div><section className="reading-actions-panel reading-actions-inside manual-reading-actions"><div className="spread-management-actions"><button className="ghost-button danger-action" onClick={clearSpread}>Xóa trải bài</button><button className="ghost-button" onClick={() => setPickerIndex(cards.findIndex((card) => !card) >= 0 ? cards.findIndex((card) => !card) : 0)}>🃏 Chọn lá</button></div><div className="spread-reading-actions"><button className="gold-button reading-ai-button" disabled={!complete || loading || retrySeconds > 0} onClick={readCards}>{loading ? "Đang đọc bài..." : "✦ Đọc bài"}</button></div></section><div className={`practice-grid manual-slot-layout count-${count > 6 ? "many" : count} ${count > 12 ? "dense" : ""} spread-layout-${spread}`}>{cards.map((card, index) => <LenormandPracticeCard key={`${index}-${card?.id || "empty"}`} card={card} index={index} position={positions[index]} mode={mode} onPick={() => setPickerIndex(index)} onRemove={() => removeCard(index)} />)}</div></div>}
          {error && !readingOpen && <div className="error-box"><b>Chưa thể đọc bài.</b><p>{error}</p></div>}
        </section>}
      </section>

      <footer className="shell"><span>✦ LENORMAND PRACTICE</span><p>Bộ Dondorf Lenormand · Không dùng lá ngược.</p></footer>
      <LenormandCardPicker open={pickerIndex !== null} selectedIds={selectedIds} slotIndex={pickerIndex || 0} onSelect={selectManual} onClose={() => setPickerIndex(null)} />
      {readingOpen && <div className="ai-reading-modal-backdrop" role="presentation" onMouseDown={closeReading}><section className="ai-reading-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><header className="ai-reading-modal-header"><div><span className="panel-kicker">LENORMAND READING</span><h2>Đọc trải bài</h2><p>{definition.title} · {readingStyleFullLabel(readingStyle)} · {selectedCards.length}/{count} lá</p></div><button className="ai-modal-close" type="button" onClick={closeReading}>×</button></header><div className="ai-reading-modal-body">{loading && !reading && <div className="ai-modal-loading"><span className="ai-loading-orbit">✦</span><div><b>Đang kết nối các lá...</b><p>Đang đọc cặp, chuỗi và vị trí tương quan của trải bài.</p></div></div>}{error && !loading && <div className="error-box ai-modal-error"><b>Không thể đọc trải bài.</b><p role="status" aria-live="polite">{retryMessage}</p><button className="ghost-button" disabled={retrySeconds > 0} onClick={readCards}>Thử lại</button></div>}{reading && <>
        {!loading && <section className="voice-reader" aria-label="Điều khiển giọng đọc">
          <div className="voice-reader-main">
            <span className={`voice-reader-status ${speechStatus}`} aria-hidden="true">◉</span>
            <span><b>Nghe bài đọc</b><small>{readingStyle === "direct" ? "Thẳng thắn · Fola" : readingStyle === "gentle" ? "Nhẹ nhàng · Gacrux" : readingStyle === "companion" ? "Tâm sự · Gacrux" : "Mặc định · Fola"}</small></span>
          </div>
          <div className="voice-reader-controls">
            <button className="voice-reader-play" type="button" onClick={() => void startReadingAloud(readingForSpeech(reading), readingStyle)} disabled={!["idle", "error"].includes(speechStatus)}>▶ Nghe bài</button>
            <button type="button" onClick={() => void toggleSpeechPause()} disabled={!["speaking", "paused"].includes(speechStatus)}>{speechStatus === "paused" ? "▶ Tiếp tục" : "Ⅱ Tạm dừng"}</button>
            <button className="voice-reader-stop" type="button" onClick={stopReadingAloud} disabled={["idle", "error"].includes(speechStatus)}>■ Dừng</button>
          </div>
          <span className="voice-reader-voice-state" role="status" aria-live="polite">{speechStatus === "waiting" ? "Đang chờ" : speechStatus === "generating" ? "Đang tạo giọng" : speechStatus === "speaking" ? "Đang phát" : speechStatus === "paused" ? "Đã tạm dừng" : speechStatus === "error" ? "Lỗi" : ""}</span>
          {speechError && <p className="voice-reader-error">{speechError}</p>}
        </section>}
        <div className="ai-reading-content"><ReadingText text={reading} streaming={loading} cardNames={selectedCards.map(card => card.name)} /></div>
      </>}</div></section></div>}
    </main>
  );
}
