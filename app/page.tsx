"use client";

import { FormEvent, useEffect, useMemo, useState, type CSSProperties } from "react";
import CardPicker from "@/components/CardPicker";
import InteractiveDeck from "@/components/InteractiveDeck";
import PracticeCard from "@/components/PracticeCard";
import AuthGate from "@/components/AuthGate";
import ReadingText from "@/components/ReadingText";
import { makeSelectedCard } from "@/lib/deck";
import type { ChatMessage, DrawnCard, TarotCard } from "@/lib/types";
import { getApiAuthHeaders } from "@/lib/supabase/auth-fetch";

type DrawMode = "random" | "manual";
type SpreadPreset = "three" | "six" | "celtic" | "custom";
type ThemeMode = "light" | "dark";

type HistoryEntry = {
  id: string;
  savedAt: string;
  question: string;
  mode: DrawMode;
  preset: SpreadPreset;
  count: number;
  cards: DrawnCard[];
  reading: string;
  chat: ChatMessage[];
};

const HISTORY_KEY = "tarot-practice-v2.3-history";
const HISTORY_LIMIT = 50;
const THEME_KEY = "tarot-practice-theme";

type StarKind = "dot" | "sparkle" | "five";

const STAR_FIELD = Array.from({ length: 150 }, (_, index) => {
  const kinds: StarKind[] = ["dot", "sparkle", "five", "dot", "sparkle"];
  return {
    kind: kinds[index % kinds.length],
    left: `${(index * 37 + 11) % 100}%`,
    top: `${(index * 53 + 7) % 100}%`,
    size: `${2.7 + (index % 7) * 0.7}px`,
    delay: `${-(index % 23) * 0.31}s`,
    duration: `${3.8 + (index % 9) * 0.48}s`,
    driftX: `${((index * 19) % 56) - 28}px`,
    driftY: `${-24 - (index % 6) * 7}px`,
    twinkle: `${1.15 + (index % 6) * 0.24}s`
  };
});

const EXAMPLES = [
  "Mối quan hệ này đang muốn dạy tôi điều gì?",
  "Điều gì đang cản tôi trong công việc hiện tại?",
  "Tôi đang chưa nhìn thấy điều gì trong tình huống này?"
];

const PRESETS: Array<{ id: SpreadPreset; count: number | null; title: string; description: string }> = [
  { id: "three", count: 3, title: "3 lá", description: "Bản chất · Ảnh hưởng · Hướng phát triển" },
  { id: "six", count: 6, title: "6 lá", description: "Phân tích tình huống sâu hơn" },
  { id: "celtic", count: 10, title: "10 lá · Celtic Cross", description: "10 vị trí · góc nhìn toàn diện" },
  { id: "custom", count: null, title: "Tùy chọn", description: "Từ 1 đến 78 lá" }
];

function clampCount(value: number) {
  if (!Number.isFinite(value)) return 3;
  return Math.max(1, Math.min(78, Math.floor(value)));
}

function positionsFor(preset: SpreadPreset, count: number): string[] {
  if (preset === "three") return ["Bản chất vấn đề", "Điều đang ảnh hưởng", "Hướng phát triển / lời khuyên"];
  if (preset === "six") return ["Hiện trạng", "Gốc rễ", "Điều hỗ trợ", "Trở ngại", "Lời khuyên", "Xu hướng phát triển"];
  if (preset === "celtic") {
    return [
      "Hiện tại / trọng tâm",
      "Thử thách / điều cản trở",
      "Điều bạn ý thức / mục tiêu",
      "Nền tảng / gốc rễ",
      "Quá khứ gần",
      "Xu hướng sắp tới",
      "Bạn trong tình huống",
      "Môi trường / người xung quanh",
      "Hy vọng và nỗi sợ",
      "Kết quả / hướng phát triển"
    ];
  }
  return Array.from({ length: count }, (_, index) => `Vị trí ${index + 1}`);
}

function formatSavedAt(value: string) {
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function Home() {
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState<DrawMode>("random");
  const [preset, setPreset] = useState<SpreadPreset>("three");
  const [count, setCount] = useState(3);
  const [cards, setCards] = useState<Array<DrawnCard | undefined>>(() => Array(3).fill(undefined));
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);
  const [aiReading, setAiReading] = useState("");
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [followup, setFollowup] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [readingCopied, setReadingCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyReady, setHistoryReady] = useState(false);
  const [drawSession, setDrawSession] = useState(0);
  const [keepInteractiveBoard, setKeepInteractiveBoard] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [themeReady, setThemeReady] = useState(false);
  const [flowStep, setFlowStep] = useState<1 | 2>(1);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [sideMenuView, setSideMenuView] = useState<"main" | "history">("main");

  const selectedCards = useMemo(() => cards.filter(Boolean) as DrawnCard[], [cards]);
  const selectedIds = useMemo(() => selectedCards.map((card) => card.id), [selectedCards]);
  const complete = selectedCards.length === count;
  const presetLabel = PRESETS.find((item) => item.id === preset)?.title || `${count} lá`;

  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem(THEME_KEY);
      const initialTheme: ThemeMode = savedTheme === "dark" ? "dark" : "light";
      setTheme(initialTheme);
      document.documentElement.dataset.theme = initialTheme;
    } catch {
      document.documentElement.dataset.theme = "light";
    } finally {
      setThemeReady(true);
    }
  }, []);

  useEffect(() => {
    if (!themeReady) return;
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Theme persistence is optional.
    }
  }, [theme, themeReady]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(HISTORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as HistoryEntry[];
        if (Array.isArray(parsed)) setHistory(parsed.slice(0, HISTORY_LIMIT));
      }
    } catch {
      // History is optional. Ignore malformed localStorage and start clean.
    } finally {
      setHistoryReady(true);
    }
  }, []);

  useEffect(() => {
    if (!historyReady) return;
    try {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, HISTORY_LIMIT)));
    } catch {
      // Storage can be unavailable in private mode; the rest of the app still works.
    }
  }, [history, historyReady]);

  useEffect(() => {
    if (!aiModalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [aiModalOpen]);

  function resetAnalysis() {
    setAiModalOpen(false);
    setAiReading("");
    setChat([]);
    setError("");
    setSaved(false);
  }

  function applyPositions(nextCards: Array<DrawnCard | undefined>, nextPreset: SpreadPreset, nextCount: number) {
    const positions = positionsFor(nextPreset, nextCount);
    return nextCards.map((card, index) => card ? { ...card, position: positions[index] || `Vị trí ${index + 1}` } : card);
  }

  function resizeSpread(nextCount: number, nextPreset: SpreadPreset = "custom") {
    const safe = clampCount(nextCount);
    setKeepInteractiveBoard(false);
    setCount(safe);
    setPreset(nextPreset);
    setCards((current) => {
      const next = Array<DrawnCard | undefined>(safe).fill(undefined);
      current.slice(0, safe).forEach((card, index) => { next[index] = card; });
      return applyPositions(next, nextPreset, safe);
    });
    resetAnalysis();
  }

  function selectPreset(nextPreset: SpreadPreset) {
    if (nextPreset === "custom") {
      setKeepInteractiveBoard(false);
      setDrawSession((value) => value + 1);
      setPreset("custom");
      setCards((current) => applyPositions(current, "custom", count));
      resetAnalysis();
      return;
    }
    const nextCount = PRESETS.find((item) => item.id === nextPreset)?.count || 3;
    resizeSpread(nextCount, nextPreset);
  }

  function completeInteractiveDraw(nextCards: DrawnCard[]) {
    setCards(applyPositions(nextCards, preset, count));
    setKeepInteractiveBoard(true);
    resetAnalysis();
  }

  function clearSpread() {
    setCards(Array(count).fill(undefined));
    setKeepInteractiveBoard(false);
    setDrawSession((value) => value + 1);
    resetAnalysis();
  }

  function openPicker(index: number) {
    if (mode === "random") setMode("manual");
    setPickerIndex(index);
  }

  function chooseCard(card: TarotCard) {
    if (pickerIndex === null) return;
    setCards((current) => {
      const next = [...current];
      const selected = makeSelectedCard(card, pickerIndex, count);
      selected.position = positionsFor(preset, count)[pickerIndex] || `Vị trí ${pickerIndex + 1}`;
      next[pickerIndex] = selected;
      return next;
    });
    setPickerIndex(null);
    resetAnalysis();
  }

  function toggleOrientation(index: number) {
    setCards((current) => current.map((card, i) => {
      if (!card || i !== index) return card;
      return { ...card, orientation: card.orientation === "upright" ? "reversed" : "upright" };
    }));
    resetAnalysis();
  }

  function removeCard(index: number) {
    setCards((current) => current.map((card, i) => i === index ? undefined : card));
    resetAnalysis();
  }

  function copyForChatGPT() {
    if (!complete) return;
    const lines = selectedCards.map((card, index) => `${index + 1}. ${card.position}: ${card.name} — ${card.orientation === "upright" ? "xuôi" : "ngược"}`);
    const spreadText = `Câu hỏi: ${question || "Không có câu hỏi cụ thể"}\n\nKiểu trải: ${presetLabel}\n\nTrải bài:\n${lines.join("\n")}\n\nHãy đọc trải bài như một Tarot Reader thực sự. Trả lời trực tiếp câu hỏi, sau đó kết nối toàn bộ các lá thành một câu chuyện chung dựa trên vị trí, chiều xuôi/ngược, sự hỗ trợ/mâu thuẫn/chuyển tiếp và những tổ hợp nổi bật. Dùng vị trí để phân tích nhưng không cần lặp lại tên vị trí trong câu văn nếu không cần thiết. Không chỉ liệt kê nghĩa từng lá riêng lẻ. Với câu hỏi về người khác, hãy trả lời về người đó trước; lời khuyên cho người hỏi chỉ nên đến sau. Không khẳng định chắc chắn tương lai hoặc suy nghĩ của người khác. Khi nhắc tên lá Tarot trong bài đọc, luôn giữ nguyên tên tiếng Anh chuẩn như trong trải bài; không dịch tên lá sang tiếng Việt.\n\nSau khi kết thúc phân tích, hãy thêm phần “Tóm lại” gồm 5–7 dòng văn ngắn tóm tắt phân tích.`;
    void navigator.clipboard.writeText(spreadText).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    });
  }

  function copyReading() {
    if (!aiReading) return;
    void navigator.clipboard.writeText(aiReading).then(() => {
      setReadingCopied(true);
      window.setTimeout(() => setReadingCopied(false), 1800);
    });
  }

  function saveHistory(readingOverride?: string) {
    if (!complete) return;
    const entry: HistoryEntry = {
      id: createId(),
      savedAt: new Date().toISOString(),
      question: question.trim(),
      mode,
      preset,
      count,
      cards: selectedCards.map((card) => ({ ...card })),
      reading: readingOverride ?? aiReading,
      chat: [...chat]
    };
    setHistory((current) => [entry, ...current].slice(0, HISTORY_LIMIT));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  function restoreHistory(entry: HistoryEntry) {
    setSideMenuOpen(false);
    setSideMenuView("main");
    setQuestion(entry.question);
    setMode(entry.mode);
    setPreset(entry.preset);
    setCount(entry.count);
    setCards(applyPositions(entry.cards.map((card) => ({ ...card })), entry.preset, entry.count));
    setAiReading(entry.reading || "");
    setChat(entry.chat || []);
    setError("");
    setPickerIndex(null);
    setKeepInteractiveBoard(false);
    setDrawSession((value) => value + 1);
    setFlowStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteHistory(id: string) {
    setHistory((current) => current.filter((item) => item.id !== id));
  }

  function clearHistory() {
    setHistory([]);
  }


  function openSideMenu() {
    setSideMenuView("main");
    setSideMenuOpen(true);
  }

  function openAccountFromMenu() {
    setSideMenuOpen(false);
    setSideMenuView("main");
    window.dispatchEvent(new Event("tarot-open-account"));
  }

  function openAIReader() {
    if (!complete) return;
    setAiModalOpen(true);
    if (!aiReading && !loading) void askAI();
  }

  async function askAI() {
    if (!complete || loading) return;
    setAiModalOpen(true);
    setLoading(true);
    setError("");
    setAiReading("");
    try {
      const authHeaders = await getApiAuthHeaders();
      const response = await fetch("/api/read", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ question, cards: selectedCards, preset })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể phân tích trải bài.");
      const reading = data.reading || "";
      setAiReading(reading);
      if (reading) {
        const entry: HistoryEntry = {
          id: createId(),
          savedAt: new Date().toISOString(),
          question: question.trim(),
          mode,
          preset,
          count,
          cards: selectedCards.map((card) => ({ ...card })),
          reading,
          chat: []
        };
        setHistory((current) => [entry, ...current].slice(0, HISTORY_LIMIT));
        setSaved(true);
        window.setTimeout(() => setSaved(false), 1800);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi.");
    } finally {
      setLoading(false);
    }
  }

  async function askFollowup(event: FormEvent) {
    event.preventDefault();
    const text = followup.trim();
    if (!text || !aiReading || chatLoading) return;
    const previous = [...chat];
    setChat([...previous, { role: "user", content: text }]);
    setFollowup("");
    setChatLoading(true);
    try {
      const authHeaders = await getApiAuthHeaders();
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ question, cards: selectedCards, preset, reading: aiReading, history: previous, followup: text })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể trả lời.");
      setChat((current) => [...current, { role: "assistant", content: data.answer }]);
    } catch (err) {
      setChat((current) => [...current, { role: "assistant", content: `Có lỗi: ${err instanceof Error ? err.message : "Không xác định"}` }]);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <AuthGate>
      <main className={`theme-${theme}`} data-theme={theme}>
      <div className="ambient" aria-hidden="true" />
      <div className="star-field" aria-hidden="true">
        {STAR_FIELD.map((star, index) => (
          <span
            key={index}
            className={`star-item star-${star.kind}`}
            style={{
              "--star-left": star.left,
              "--star-top": star.top,
              "--star-size": star.size,
              "--star-delay": star.delay,
              "--star-duration": star.duration,
              "--star-drift-x": star.driftX,
              "--star-drift-y": star.driftY,
              "--star-twinkle": star.twinkle
            } as CSSProperties}
          >{star.kind === "five" ? "★" : star.kind === "sparkle" ? "✦" : ""}</span>
        ))}
      </div>

      <button
        className="side-menu-toggle"
        type="button"
        onClick={openSideMenu}
        aria-label="Mở menu"
        aria-expanded={sideMenuOpen}
        title="Menu"
      >
        <span />
        <span />
        <span />
      </button>

      {sideMenuOpen && (
        <div className="side-menu-layer" role="presentation" onMouseDown={() => setSideMenuOpen(false)}>
          <aside
            className="side-menu-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={sideMenuView === "history" ? "Lịch sử trải bài" : "Menu"}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="side-menu-head">
              <div>
                <span className="panel-kicker">TAROT PRACTICE</span>
                <h2>{sideMenuView === "history" ? "Lịch sử trải bài" : "Menu"}</h2>
              </div>
              <button className="side-menu-close" type="button" onClick={() => setSideMenuOpen(false)} aria-label="Đóng menu">×</button>
            </div>

            {sideMenuView === "main" ? (
              <nav className="side-menu-nav" aria-label="Điều hướng">
                <button type="button" onClick={openAccountFromMenu}>
                  <span className="side-menu-item-icon">◎</span>
                  <span>
                    <strong>Tài khoản</strong>
                    <small>Thông tin đăng nhập và đăng xuất</small>
                  </span>
                  <b>›</b>
                </button>
                <button type="button" onClick={() => setSideMenuView("history")}>
                  <span className="side-menu-item-icon">↺</span>
                  <span>
                    <strong>Lịch sử trải bài</strong>
                    <small>{history.length > 0 ? `${history.length} trải bài đã lưu` : "Chưa có trải bài đã lưu"}</small>
                  </span>
                  <b>›</b>
                </button>
              </nav>
            ) : (
              <div className="side-history-view">
                <div className="side-history-toolbar">
                  <button className="side-history-back" type="button" onClick={() => setSideMenuView("main")}>← Menu</button>
                  {history.length > 0 && <button className="side-history-clear" type="button" onClick={clearHistory}>Xóa toàn bộ</button>}
                </div>

                {history.length === 0 ? (
                  <div className="history-empty side-history-empty">Chưa có trải bài nào được lưu. Hoàn thành một trải bài rồi bấm “Lưu trải bài” hoặc “Đọc bài”.</div>
                ) : (
                  <div className="history-list side-history-list">
                    {history.map((entry) => (
                      <article className="history-card side-history-card" key={entry.id}>
                        <div className="history-card-top">
                          <div>
                            <span>{formatSavedAt(entry.savedAt)} · {PRESETS.find((item) => item.id === entry.preset)?.title || `${entry.count} lá`}</span>
                            <h3>{entry.question || "Không có câu hỏi cụ thể"}</h3>
                          </div>
                        </div>
                        <div className="side-history-actions">
                          <button type="button" onClick={() => restoreHistory(entry)}>Mở lại</button>
                          <button type="button" onClick={() => deleteHistory(entry.id)}>Xóa</button>
                        </div>
                        <div className="history-cards-line">
                          {entry.cards.map((card, index) => (
                            <span key={`${entry.id}-${index}`}>{index + 1}. {card.name} {card.orientation === "upright" ? "↑" : "↓"}</span>
                          ))}
                        </div>
                        {entry.reading && <p className="history-reading-preview">{entry.reading.replace(/[#*_`]/g, "").slice(0, 180)}{entry.reading.length > 180 ? "…" : ""}</p>}
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      )}

      <header className="topbar shell">
        <div className="brand">✦ TAROT PRACTICE</div>
        <div className="topbar-right">
          <div className="top-note">RIDER–WAITE · TAROT READING · TÀI KHOẢN NGƯỜI DÙNG</div>
          <button
            className="theme-toggle"
            type="button"
            onClick={() => setTheme((current) => current === "light" ? "dark" : "light")}
            aria-label={theme === "light" ? "Chuyển sang giao diện tối" : "Chuyển sang giao diện sáng"}
            title={theme === "light" ? "Chuyển sang Dark mode" : "Chuyển sang Light mode"}
          >
            <span className="theme-toggle-icon">{theme === "light" ? "☾" : "☀"}</span>
            <span>{theme === "light" ? "Dark" : "Light"}</span>
          </button>
        </div>
      </header>

      <section className={`intro shell compact-intro flow-intro ${flowStep === 2 ? "flow-intro-hidden" : ""}`}>
        <div className="eyebrow">Không gian trải bài Tarot cá nhân</div>
        <h1>Tự trải, tự bốc.<br/><em>Hiểu sâu hơn.</em></h1>
        <p className="lead">Trải nghiệm tự trải, tự bốc các lá bài cho bản thân để hiểu sâu hơn về vấn đề bạn đang gặp</p>
      </section>

      <section className="workspace shell">
        {flowStep === 1 && (
          <section className="flow-stage flow-stage-setup" aria-label="Phần 1 - Thiết lập trải bài">
            <div className="flow-stage-head">
              <div>
                <div className="panel-kicker">PHẦN 1 · THIẾT LẬP</div>
                <h2>Câu hỏi & cách lấy bài</h2>
              </div>
              <span className="flow-step-indicator">1 / 3</span>
            </div>

            <div className="panel question-card">
              <div className="panel-kicker">01 · CÂU HỎI</div>
              <textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Bạn đang muốn hiểu điều gì? Có thể để trống nếu muốn một trải bài mở." />
              <div className="chips">{EXAMPLES.map((x) => <button key={x} onClick={() => setQuestion(x)}>{x}</button>)}</div>
            </div>

            <div className="control-grid v23-controls">
              <div className="panel">
                <div className="panel-kicker">02 · CÁCH LẤY BÀI</div>
                <div className="mode-switch">
                  <button className={mode === "random" ? "active" : ""} onClick={() => { setMode("random"); setKeepInteractiveBoard(false); setDrawSession((value) => value + 1); }}><span>✦</span><b>Xáo & bốc bài</b><small>Xáo bộ bài, trải 78 lá úp rồi kéo từng lá vào vị trí bạn muốn.</small></button>
                  <button className={mode === "manual" ? "active" : ""} onClick={() => { setMode("manual"); setKeepInteractiveBoard(false); }}><span>🃏</span><b>Tự chọn bài</b><small>Mở thư viện Rider–Waite và chọn từng vị trí.</small></button>
                </div>
              </div>

              <div className="panel preset-panel">
                <div className="panel-kicker">03 · KIỂU TRẢI</div>
                <div className="preset-grid">
                  {PRESETS.map((item) => (
                    <button key={item.id} className={preset === item.id ? "active" : ""} onClick={() => selectPreset(item.id)}>
                      <b>{item.title}</b>
                      <small>{item.description}</small>
                    </button>
                  ))}
                </div>
                {preset === "custom" && (
                  <label className="custom-count custom-v23"><span>Số lá</span><input type="number" min="1" max="78" value={count} onChange={(e) => resizeSpread(Number(e.target.value), "custom")} /></label>
                )}
              </div>
            </div>

            <div className="flow-continue-row">
              <div className="flow-continue-summary">
                <span>{presetLabel}</span>
                <span>·</span>
                <span>{mode === "random" ? "Xáo & bốc bài" : "Tự chọn bài"}</span>
              </div>
              <button
                className="gold-button flow-continue-button"
                type="button"
                onClick={() => {
                  setFlowStep(2);
                  window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
                }}
              >
                Tiếp tục →
              </button>
            </div>
          </section>
        )}

        {flowStep === 2 && (
          <section className="flow-stage flow-stage-spread" aria-label="Phần 2 - Trải bài">
            <div className="flow-stage-head flow-stage-head-spread flow-stage-head-nav-only">
              <div className="flow-stage-nav">
                <span className="flow-step-indicator">2 / 3</span>
                <button className="ghost-button" type="button" onClick={() => setFlowStep(1)}>← Quay lại</button>
              </div>
            </div>

        {mode === "random" && (!complete || keepInteractiveBoard) && (
          <InteractiveDeck
            key={`${preset}-${count}-${drawSession}`}
            count={count}
            positions={positionsFor(preset, count)}
            spreadLabel={presetLabel}
            onComplete={completeInteractiveDraw}
            actions={
              <section className="reading-actions-panel reading-actions-inside" aria-label="Công cụ trải bài">
                <div className="spread-management-actions">
                  <button className="ghost-button" disabled={!complete} onClick={() => saveHistory()}>
                    {saved ? "✓ Đã lưu" : "Lưu trải bài"}
                  </button>
                  <button className="ghost-button danger-action" onClick={clearSpread}>Xóa trải bài</button>
                </div>
                <div className="spread-reading-actions">
                  <button className="ghost-button reading-copy-button" disabled={!complete} onClick={copyForChatGPT}>
                    {copied ? "✓ Đã sao chép" : "Sao chép trải bài"}
                  </button>
                  <button className="gold-button reading-ai-button" disabled={!complete || loading} onClick={openAIReader}>
                    {loading ? "Đang đọc bài..." : aiReading ? "✦ Mở bài đọc" : "✦ Đọc bài"}
                  </button>
                </div>
              </section>
            }
          />
        )}

        {(mode === "manual" || (complete && !keepInteractiveBoard)) && (
          <div className="manual-spread-reading-shell">
            <div className="manual-spread-meta">
              <div className="panel-kicker">04 · TRẢI BÀI · {presetLabel}</div>
              <h2>{selectedCards.length}/{count} lá đã có</h2>
            </div>
            <section className="reading-actions-panel reading-actions-inside manual-reading-actions" aria-label="Công cụ trải bài">
              <div className="spread-management-actions">
                <button className="ghost-button" disabled={!complete} onClick={() => saveHistory()}>
                  {saved ? "✓ Đã lưu" : "Lưu trải bài"}
                </button>
                <button className="ghost-button danger-action" onClick={clearSpread}>Xóa trải bài</button>
                <button className="ghost-button" onClick={() => setPickerIndex(cards.findIndex((card) => !card) >= 0 ? cards.findIndex((card) => !card) : 0)}>🃏 Chọn lá</button>
              </div>
              <div className="spread-reading-actions">
                <button className="ghost-button reading-copy-button" disabled={!complete} onClick={copyForChatGPT}>
                  {copied ? "✓ Đã sao chép" : "Sao chép trải bài"}
                </button>
                <button className="gold-button reading-ai-button" disabled={!complete || loading} onClick={openAIReader}>
                  {loading ? "Đang đọc bài..." : aiReading ? "✦ Mở bài đọc" : "✦ Đọc bài"}
                </button>
              </div>
            </section>
            <div className={`practice-grid manual-slot-layout count-${count > 6 ? "many" : count} ${count > 12 ? "dense" : ""} ${preset === "celtic" ? "celtic-grid" : ""}`}>
              {cards.map((card, index) => (
                <PracticeCard
                  key={`${index}-${card?.id || "empty"}`}
                  card={card}
                  index={index}
                  position={positionsFor(preset, count)[index] || `Vị trí ${index + 1}`}
                  mode={mode}
                  onPick={() => openPicker(index)}
                  onFlip={() => toggleOrientation(index)}
                  onRemove={() => removeCard(index)}
                />
              ))}
            </div>
          </div>
        )}

          </section>
        )}
      </section>

      <footer className="shell"><span>✦ TAROT PRACTICE · TAROT-1.8</span><p>Xáo kiểu riffle · Kéo-thả · Lật tại chỗ · Rider–Waite · Đăng nhập sẵn sàng cho host.</p></footer>

      {aiModalOpen && (
        <div className="ai-reading-modal-backdrop" role="presentation" onMouseDown={() => setAiModalOpen(false)}>
          <section
            className="ai-reading-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-reading-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="ai-reading-modal-header">
              <div>
                <span className="panel-kicker">TAROT READING</span>
                <h2 id="ai-reading-title">Đọc trải bài</h2>
                <p>{presetLabel} · {selectedCards.length}/{count} lá{question.trim() ? ` · ${question.trim()}` : ""}</p>
              </div>
              <button className="ai-modal-close" type="button" onClick={() => setAiModalOpen(false)} aria-label="Đóng cửa sổ đọc bài">×</button>
            </header>

            <div className="ai-reading-modal-body">
              {loading && (
                <div className="ai-modal-loading">
                  <span className="ai-loading-orbit" aria-hidden="true">✦</span>
                  <div>
                    <b>Đang kết nối các lá...</b>
                    <p>Đang đọc vị trí, chiều xuôi/ngược và mạch liên kết của toàn bộ trải bài.</p>
                  </div>
                </div>
              )}

              {error && !loading && (
                <div className="error-box ai-modal-error">
                  <b>Không thể đọc trải bài.</b>
                  <p>{error}</p>
                  <button className="ghost-button" type="button" onClick={() => void askAI()}>Thử lại</button>
                </div>
              )}

              {aiReading && !loading && (
                <>
                  <div className="ai-reading-result">
                    <ReadingText text={aiReading} cardNames={selectedCards.map((card) => card.name)} />
                  </div>

                  <div className="chat-panel ai-modal-chat">
                    <div className="chat-heading"><b>Hỏi tiếp</b><small>Ngữ cảnh của trải bài hiện tại vẫn được giữ.</small></div>
                    {chat.length > 0 && <div className="chat-history">
                      {chat.map((message, index) => <div className={`message ${message.role}`} key={index}><span>{message.role === "user" ? "BẠN" : "READER"}</span><p>{message.content}</p></div>)}
                      {chatLoading && <div className="message assistant"><span>READER</span><p>Đang suy ngẫm…</p></div>}
                    </div>}
                    <form className="chat-form" onSubmit={askFollowup}>
                      <input value={followup} onChange={(e) => setFollowup(e.target.value)} placeholder="Hỏi sâu hơn về một lá hoặc mối liên hệ giữa các lá..." />
                      <button disabled={!followup.trim() || chatLoading}>Gửi →</button>
                    </form>
                  </div>
                </>
              )}
            </div>

            <footer className="ai-reading-modal-footer">
              {aiReading && !loading && (
                <>
                  <button className="ghost-button" type="button" onClick={copyReading}>
                    {readingCopied ? "✓ Đã sao chép" : "Sao chép bài đã đọc"}
                  </button>
                  <button className="ghost-button" type="button" onClick={() => void askAI()}>Đọc lại</button>
                </>
              )}
              <button className="gold-button" type="button" onClick={() => setAiModalOpen(false)}>Đóng</button>
            </footer>
          </section>
        </div>
      )}

      <CardPicker
        open={pickerIndex !== null}
        selectedIds={selectedIds.filter((id) => id !== cards[pickerIndex ?? -1]?.id)}
        slotIndex={pickerIndex ?? 0}
        onSelect={chooseCard}
        onClose={() => setPickerIndex(null)}
      />
      </main>
    </AuthGate>
  );
}
