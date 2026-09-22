"use client";

import { FormEvent, useEffect, useMemo, useState, type CSSProperties } from "react";
import CardPicker from "@/components/CardPicker";
import InteractiveDeck from "@/components/InteractiveDeck";
import PracticeCard from "@/components/PracticeCard";
import AuthGate from "@/components/AuthGate";
import ReadingText from "@/components/ReadingText";
import { makeSelectedCard } from "@/lib/deck";
import { portableReadingPrompt } from "@/lib/prompts";
import type { ChatMessage, DrawnCard, TarotCard } from "@/lib/types";
import { getApiAuthHeaders } from "@/lib/supabase/auth-fetch";

type DrawMode = "random" | "manual";
type SpreadPreset = "three" | "six" | "celtic" | "custom";
type ThemeMode = "light" | "dark";
type ReadingStyle = "direct" | "gentle" | "companion";

type HistoryEntry = {
  id: string;
  savedAt: string;
  question: string;
  readingStyle?: ReadingStyle;
  mode: DrawMode;
  preset: SpreadPreset;
  count: number;
  cards: DrawnCard[];
  reading: string;
  chat: ChatMessage[];
};

const HISTORY_KEY = "tarot-practice-v2.3-history";
const HISTORY_LIMIT = 50;
const THEME_KEY = "tarot-practice-theme-v2";

type StarKind = "dot" | "sparkle" | "five";

const STAR_FIELD = Array.from({ length: 75 }, (_, index) => {
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

const QUESTION_SUGGESTIONS = [
  "Người yêu cũ hiện tại đang như thế nào?",
  "Tôi và người yêu cũ có cơ hội quay lại với nhau không?",
  "Người yêu cũ còn tình cảm với tôi không?",
  "Người yêu cũ đang nghĩ gì về tôi và mối quan hệ đã qua?",
  "Người yêu cũ có đang nhớ đến tôi không?",
  "Điều gì khiến người yêu cũ chưa chủ động liên lạc với tôi?",
  "Nếu tôi chủ động nhắn tin, mối quan hệ sẽ tiến triển ra sao?",
  "Người yêu cũ có mong muốn nối lại mối quan hệ không?",
  "Giữa tôi và người yêu cũ còn điều gì chưa được giải quyết?",
  "Điều gì đã thực sự khiến mối quan hệ cũ kết thúc?",
  "Người yêu cũ nhìn nhận tôi như thế nào sau chia tay?",
  "Mối quan hệ giữa tôi và người yêu cũ sẽ thay đổi thế nào trong thời gian tới?",
  "Nếu quay lại, chúng tôi có thể xây dựng một mối quan hệ tốt hơn không?",
  "Điều gì cần thay đổi để tôi và người yêu cũ có thể quay lại?",
  "Tôi có nên chờ người yêu cũ hay bước tiếp?",
  "Người yêu cũ đã thật sự buông bỏ mối quan hệ này chưa?",
  "Có điều gì người yêu cũ muốn nói với tôi nhưng chưa thể nói ra?",
  "Tôi cần hiểu điều gì về cảm xúc của người yêu cũ lúc này?",
  "Bài học lớn nhất từ mối quan hệ với người yêu cũ là gì?",
  "Tôi cần làm gì để chữa lành sau mối quan hệ cũ?",
  "Mối liên kết giữa tôi và người yêu cũ còn ý nghĩa gì ở hiện tại?",
  "Tôi nên giữ liên lạc hay tạo khoảng cách với người yêu cũ?",
  "Crush hiện tại đang nhìn nhận tôi như thế nào?",
  "Crush và tôi có tiến triển gì trong tương lai không?",
  "Crush có cảm xúc đặc biệt dành cho tôi không?",
  "Điều gì đang ngăn crush và tôi tiến gần nhau hơn?",
  "Tôi nên làm gì để mối quan hệ với crush phát triển tự nhiên hơn?",
  "Nếu tôi chủ động bày tỏ, crush sẽ phản ứng như thế nào?",
  "Giữa tôi và crush có tiềm năng trở thành người yêu không?",
  "Crush đang mong đợi điều gì ở mối quan hệ giữa chúng tôi?",
  "Tôi có đang hiểu đúng tín hiệu mà crush dành cho mình không?",
  "Mối quan hệ giữa tôi và crush sẽ thay đổi thế nào trong thời gian tới?",
  "Tình yêu sắp tới của tôi có năng lượng như thế nào?",
  "Tôi cần thay đổi điều gì để đón nhận một mối quan hệ lành mạnh?",
  "Người phù hợp với tôi lúc này sẽ mang đến điều gì?",
  "Tôi cần hiểu điều gì về chuyện tình cảm hiện tại của mình?"
];

const READING_STYLES: Array<{ id: ReadingStyle; label: string; fullLabel: string }> = [
  { id: "direct", label: "Thẳng thắn", fullLabel: "Thẳng thắn, lạnh lùng, sâu sắc" },
  { id: "gentle", label: "Nhẹ nhàng", fullLabel: "Nhẹ nhàng, thấu hiểu" },
  { id: "companion", label: "Tâm sự", fullLabel: "Tâm sự, lắng nghe" }
];

function readingStyleFullLabel(style?: ReadingStyle | null) {
  return READING_STYLES.find((item) => item.id === style)?.fullLabel || "Cách đọc mặc định";
}

const QUESTION_HINT_KEY = "tarot-practice-question-hint";

function pickQuestionSuggestion(exclude?: string) {
  const pool = QUESTION_SUGGESTIONS.filter((item) => item !== exclude);
  return pool[Math.floor(Math.random() * pool.length)] || QUESTION_SUGGESTIONS[0];
}

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
  const [questionHint, setQuestionHint] = useState(QUESTION_SUGGESTIONS[0]);
  const [readingStyle, setReadingStyle] = useState<ReadingStyle | null>(null);
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
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [themeReady, setThemeReady] = useState(false);
  const [themeHintVisible, setThemeHintVisible] = useState(true);
  const [flowStep, setFlowStep] = useState<1 | 2>(1);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [sideMenuView, setSideMenuView] = useState<"main" | "history">("main");

  const selectedCards = useMemo(() => cards.filter(Boolean) as DrawnCard[], [cards]);
  const selectedIds = useMemo(() => selectedCards.map((card) => card.id), [selectedCards]);
  const complete = selectedCards.length === count;
  const presetLabel = PRESETS.find((item) => item.id === preset)?.title || `${count} lá`;

  useEffect(() => {
    try {
      const previous = window.sessionStorage.getItem(QUESTION_HINT_KEY) || undefined;
      const next = pickQuestionSuggestion(previous);
      setQuestionHint(next);
      window.sessionStorage.setItem(QUESTION_HINT_KEY, next);
    } catch {
      setQuestionHint(pickQuestionSuggestion());
    }
  }, []);

  function refreshQuestionHint() {
    const next = pickQuestionSuggestion(questionHint);
    setQuestionHint(next);
    try {
      window.sessionStorage.setItem(QUESTION_HINT_KEY, next);
    } catch {
      // The hint still changes even when sessionStorage is unavailable.
    }
  }

  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem(THEME_KEY);
      const initialTheme: ThemeMode = savedTheme === "light" ? "light" : "dark";
      setTheme(initialTheme);
      document.documentElement.dataset.theme = initialTheme;
    } catch {
      document.documentElement.dataset.theme = "dark";
    } finally {
      setThemeReady(true);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setThemeHintVisible(false), 5200);
    return () => window.clearTimeout(timer);
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

  function selectReadingStyle(style: ReadingStyle) {
    setReadingStyle((current) => current === style ? null : style);
    resetAnalysis();
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
    const spreadText = portableReadingPrompt(
      question,
      selectedCards,
      preset === "celtic" ? "celtic" : undefined,
      readingStyle || "default"
    );
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
      readingStyle: readingStyle || undefined,
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
    setReadingStyle(entry.readingStyle || null);
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
    if (aiReading) {
      setAiModalOpen(true);
      return;
    }
    setAiModalOpen(true);
    if (!loading) void askAI();
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
        body: JSON.stringify({ question, cards: selectedCards, preset, readingStyle })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Không thể phân tích trải bài.");
      }
      if (!response.body) throw new Error("Không nhận được luồng đọc bài từ máy chủ.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let reading = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        reading += decoder.decode(value, { stream: true });
        setAiReading(reading);
      }
      reading += decoder.decode();
      reading = reading.trim();
      setAiReading(reading);
      if (!reading) throw new Error("GPT đã phản hồi nhưng không có nội dung để hiển thị.");

      if (reading) {
        const entry: HistoryEntry = {
          id: createId(),
          savedAt: new Date().toISOString(),
          question: question.trim(),
          readingStyle: readingStyle || undefined,
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
        body: JSON.stringify({ question, cards: selectedCards, preset, readingStyle, reading: aiReading, history: previous, followup: text })
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

  useEffect(() => {
    if (typeof document === "undefined") return;

    const syncPageActivity = () => {
      const isActive = document.visibilityState === "visible" && document.hasFocus();
      document.documentElement.dataset.tarotPageActive = isActive ? "true" : "false";
    };

    syncPageActivity();
    document.addEventListener("visibilitychange", syncPageActivity);
    window.addEventListener("focus", syncPageActivity);
    window.addEventListener("blur", syncPageActivity);

    return () => {
      document.removeEventListener("visibilitychange", syncPageActivity);
      window.removeEventListener("focus", syncPageActivity);
      window.removeEventListener("blur", syncPageActivity);
      delete document.documentElement.dataset.tarotPageActive;
    };
  }, []);

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
              <div className="side-menu-brand">
                <span aria-hidden="true">✦</span>
                <strong>TTarot</strong>
              </div>
              <button className="side-menu-close" type="button" onClick={() => setSideMenuOpen(false)} aria-label="Thu gọn menu" title="Thu gọn menu">
                <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <rect x="3.5" y="4" width="17" height="16" rx="3" />
                  <path d="M9 4v16" />
                </svg>
              </button>
            </div>

            {sideMenuView === "main" ? (
              <nav className="side-menu-nav" aria-label="Điều hướng">
                <span className="side-menu-section-label">Menu</span>
                <button type="button" onClick={openAccountFromMenu}>
                  <span className="side-menu-item-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="8" r="3.5"/><path d="M5.5 20c.7-4 3-6 6.5-6s5.8 2 6.5 6"/></svg>
                  </span>
                  <span>
                    <strong>Tài khoản</strong>
                    <small>Thông tin đăng nhập và đăng xuất</small>
                  </span>
                  <b>›</b>
                </button>
                <button type="button" onClick={() => setSideMenuView("history")}>
                  <span className="side-menu-item-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 12a8 8 0 1 0 2.35-5.65L4 8.7"/><path d="M4 4v4.7h4.7"/><path d="M12 8v4.5l3 1.8"/></svg>
                  </span>
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
                            <span>{formatSavedAt(entry.savedAt)} · {PRESETS.find((item) => item.id === entry.preset)?.title || `${entry.count} lá`}{entry.readingStyle ? ` · ${readingStyleFullLabel(entry.readingStyle)}` : ""}</span>
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
        <div className="topbar-left">
          <div className="brand">✦ TAROT PRACTICE</div>
          <button
            className="side-menu-toggle"
            type="button"
            onClick={openSideMenu}
            aria-label="Mở menu"
            aria-expanded={sideMenuOpen}
            title="Mở menu"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.7">
              <rect x="3.5" y="4" width="17" height="16" rx="3" />
              <path d="M9 4v16" />
            </svg>
          </button>
        </div>
        <div className="topbar-right">
          <div className="top-note">RIDER–WAITE · TAROT READING · TÀI KHOẢN NGƯỜI DÙNG</div>
          <div className="theme-toggle-wrap">
            <button
              className="theme-toggle"
              type="button"
              onClick={() => {
                setThemeHintVisible(false);
                setTheme((current) => current === "light" ? "dark" : "light");
              }}
              aria-label={theme === "light" ? "Chuyển sang giao diện tối" : "Chuyển sang giao diện sáng"}
              title={theme === "light" ? "Chuyển sang Dark mode" : "Chuyển sang Light mode"}
            >
              <span className="theme-toggle-icon">{theme === "light" ? "☾" : "☀"}</span>
              <span>{theme === "light" ? "Dark" : "Light"}</span>
            </button>
            {themeHintVisible && theme === "dark" && (
              <span className="theme-toggle-hint" role="status">Đổi sang giao diện Light</span>
            )}
          </div>
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
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={questionHint}
                aria-label="Câu hỏi cho trải bài Tarot"
              />
              <div className="reading-style-picker" aria-label="Phong cách đọc bài">
                {READING_STYLES.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    className={readingStyle === style.id ? "active" : ""}
                    aria-pressed={readingStyle === style.id}
                    aria-label={style.fullLabel}
                    title={style.fullLabel}
                    onClick={() => selectReadingStyle(style.id)}
                  >
                    <span className="reading-style-short">{style.label}</span>
                    <span className="reading-style-tooltip" role="tooltip">{style.fullLabel}</span>
                  </button>
                ))}
              </div>
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
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => {
                    refreshQuestionHint();
                    setFlowStep(1);
                    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
                  }}
                >← Quay lại</button>
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
                <p>{presetLabel}{readingStyle ? ` · ${readingStyleFullLabel(readingStyle)}` : ""} · {selectedCards.length}/{count} lá{question.trim() ? ` · ${question.trim()}` : ""}</p>
              </div>
              <button className="ai-modal-close" type="button" onClick={() => setAiModalOpen(false)} aria-label="Đóng cửa sổ đọc bài">×</button>
            </header>

            <div className="ai-reading-modal-body">
              {loading && !aiReading && (
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

              {aiReading && (
                <>
                  <div className="ai-reading-result">
                    <ReadingText text={aiReading} cardNames={selectedCards.map((card) => card.name)} streaming={loading} />
                  </div>

                  {!loading && <div className="chat-panel ai-modal-chat">
                    <div className="chat-heading"><b>Hỏi tiếp</b><small>Ngữ cảnh của trải bài hiện tại vẫn được giữ.</small></div>
                    {chat.length > 0 && <div className="chat-history">
                      {chat.map((message, index) => <div className={`message ${message.role}`} key={index}><span>{message.role === "user" ? "BẠN" : "READER"}</span><p>{message.content}</p></div>)}
                      {chatLoading && <div className="message assistant"><span>READER</span><p>Đang suy ngẫm…</p></div>}
                    </div>}
                    <form className="chat-form" onSubmit={askFollowup}>
                      <input value={followup} onChange={(e) => setFollowup(e.target.value)} placeholder="Hỏi sâu hơn về một lá hoặc mối liên hệ giữa các lá..." />
                      <button disabled={!followup.trim() || chatLoading}>Gửi →</button>
                    </form>
                  </div>}
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
