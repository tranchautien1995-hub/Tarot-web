"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePlanAccess } from "@/components/AccessContext";
import { PROMPT_LAB_SPREADS } from "@/lib/prompt-lab";
import type { ReadingStyle } from "@/lib/prompts";
import { getApiAuthHeaders } from "@/lib/supabase/auth-fetch";

type RunMode = "current" | "draft";
type ResultState = { text: string; error: string; running: boolean };

const EMPTY_RESULT: ResultState = { text: "", error: "", running: false };
const SAMPLE_CARDS = [
  "The High Priestess", "Two of Cups", "Eight of Swords", "The Star", "Five of Pentacles",
  "Queen of Wands", "The Hermit", "Page of Cups", "Justice", "Ten of Pentacles",
  "The Moon", "Ace of Swords"
];
const STYLES: Array<{ id: ReadingStyle; label: string }> = [
  { id: "default", label: "Mặc định" },
  { id: "direct", label: "Thẳng thắn" },
  { id: "gentle", label: "Nhẹ nhàng" },
  { id: "companion", label: "Tâm sự" }
];

function draftKey(preset: string, style: string) {
  return `ttarot-prompt-lab-draft:${preset}:${style}`;
}

function parseCardLines(value: string) {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const parts = line.split("|");
    const marker = (parts.pop() || "").trim().toLowerCase();
    const hasMarker = ["xuôi", "upright", "u", "ngược", "reversed", "r"].includes(marker);
    return {
      name: (hasMarker ? parts.join("|") : line).trim(),
      orientation: ["ngược", "reversed", "r"].includes(marker) ? "reversed" : "upright"
    };
  });
}

export default function PromptLabPage() {
  const { isAdmin, localMode } = usePlanAccess();
  const allowed = isAdmin || localMode;
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [preset, setPreset] = useState("six");
  const [readingStyle, setReadingStyle] = useState<ReadingStyle>("default");
  const [question, setQuestion] = useState("Mối quan hệ này đang ở đâu và tôi nên làm gì tiếp theo?");
  const [cardLines, setCardLines] = useState("");
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [draftPrompt, setDraftPrompt] = useState("");
  const [promptError, setPromptError] = useState("");
  const [saved, setSaved] = useState(false);
  const [currentResult, setCurrentResult] = useState<ResultState>(EMPTY_RESULT);
  const [draftResult, setDraftResult] = useState<ResultState>(EMPTY_RESULT);
  const abortRef = useRef<AbortController | null>(null);
  const spread = useMemo(() => PROMPT_LAB_SPREADS.find((item) => item.id === preset) ?? PROMPT_LAB_SPREADS[0], [preset]);

  const fillSampleCards = useCallback(() => {
    setCardLines(SAMPLE_CARDS.slice(0, spread.count).map((name, index) => `${name} | ${index % 4 === 2 ? "ngược" : "xuôi"}`).join("\n"));
  }, [spread.count]);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("tarot-practice-theme-v2");
    const next = savedTheme === "light" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
  }, []);

  useEffect(() => {
    fillSampleCards();
    setCurrentResult(EMPTY_RESULT);
    setDraftResult(EMPTY_RESULT);
  }, [fillSampleCards]);

  const loadCurrentPrompt = useCallback(async (overwriteDraft = false) => {
    if (!allowed) return;
    setPromptError("");
    setSaved(false);
    try {
      const authHeaders = await getApiAuthHeaders();
      const response = await fetch("/api/prompt-lab", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ action: "get_prompt", preset, readingStyle })
      });
      const data = await response.json() as { prompt?: string; error?: string };
      if (!response.ok || !data.prompt) throw new Error(data.error || "Không tải được prompt hiện tại.");
      setCurrentPrompt(data.prompt);
      const localDraft = window.localStorage.getItem(draftKey(preset, readingStyle));
      if (overwriteDraft || !localDraft) setDraftPrompt(data.prompt);
      else setDraftPrompt(localDraft);
    } catch (error) {
      setPromptError(error instanceof Error ? error.message : "Không tải được prompt hiện tại.");
    }
  }, [allowed, preset, readingStyle]);

  useEffect(() => {
    void loadCurrentPrompt(false);
  }, [loadCurrentPrompt]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem("tarot-practice-theme-v2", next);
    document.documentElement.dataset.theme = next;
  }

  function saveDraft() {
    window.localStorage.setItem(draftKey(preset, readingStyle), draftPrompt);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  async function run(mode: RunMode) {
    const setResult = mode === "current" ? setCurrentResult : setDraftResult;
    const cards = parseCardLines(cardLines);
    if (cards.length !== spread.count) {
      setResult({ text: "", running: false, error: `Cần nhập đúng ${spread.count} dòng lá bài.` });
      return;
    }
    if (spread.questionMode === "required" && !question.trim()) {
      setResult({ text: "", running: false, error: "Hãy nhập câu hỏi thử nghiệm." });
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setResult({ text: "", error: "", running: true });
    try {
      const authHeaders = await getApiAuthHeaders();
      const response = await fetch("/api/prompt-lab", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ action: "run", mode, preset, readingStyle, question, cards, draftPrompt })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      if (!response.body) throw new Error("Không nhận được luồng kết quả.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setResult({ text, error: "", running: true });
      }
      text += decoder.decode();
      setResult({ text, error: "", running: false });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setResult({ text: "", running: false, error: error instanceof Error ? error.message : "Không thể chạy thử." });
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }

  async function compare() {
    await run("current");
    await run("draft");
  }

  if (!allowed) {
    return (
      <main className={`prompt-lab-page theme-${theme}`}>
        <section className="prompt-lab-denied">
          <span>PROMPT LAB</span>
          <h1>Không có quyền truy cập</h1>
          <p>Khu vực này chỉ dành cho tài khoản Admin.</p>
          <button type="button" onClick={() => window.location.assign("/")}>Về trang chính</button>
        </section>
      </main>
    );
  }

  return (
    <main className={`prompt-lab-page theme-${theme}`}>
      <header className="prompt-lab-header">
        <div>
          <span className="prompt-lab-kicker">ADMIN · PROMPT LAB</span>
          <h1>Thử prompt không cần khởi động lại localhost</h1>
          <p>Chỉnh bản nháp, chạy cùng một bộ bài và so sánh với prompt đang dùng trên web.</p>
        </div>
        <div className="prompt-lab-header-actions">
          <button type="button" onClick={toggleTheme}>{theme === "dark" ? "Giao diện sáng" : "Giao diện tối"}</button>
          <button type="button" onClick={() => window.location.assign("/")}>← Trang chính</button>
        </div>
      </header>

      <section className="prompt-lab-workbench">
        <div className="prompt-lab-section-head">
          <div><span>01 · DỮ LIỆU THỬ</span><h2>Chọn trải bài và bộ lá cố định</h2></div>
          <em>Không trừ lượt trải bài</em>
        </div>
        <div className="prompt-lab-controls">
          <label>Dạng trải
            <select value={preset} onChange={(event) => setPreset(event.target.value)}>
              {PROMPT_LAB_SPREADS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <label>Phong cách
            <select value={readingStyle} onChange={(event) => setReadingStyle(event.target.value as ReadingStyle)}>
              {STYLES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <label className="prompt-lab-question">Câu hỏi
            <textarea value={spread.questionMode === "none" ? "Trải bài này không cần câu hỏi cụ thể" : question} disabled={spread.questionMode === "none"} onChange={(event) => setQuestion(event.target.value)} />
          </label>
          <label className="prompt-lab-cards">Các lá bài — mỗi dòng: Tên lá | xuôi/ngược
            <textarea value={cardLines} onChange={(event) => setCardLines(event.target.value)} spellCheck={false} />
          </label>
        </div>
        <div className="prompt-lab-position-list">
          {spread.positions.map((position, index) => <span key={position}><b>{String(index + 1).padStart(2, "0")}</b>{position}</span>)}
        </div>
        <button className="prompt-lab-subtle" type="button" onClick={fillSampleCards}>Tạo lại dữ liệu mẫu</button>
      </section>

      <section className="prompt-lab-editor">
        <div className="prompt-lab-section-head">
          <div><span>02 · PROMPT NHÁP</span><h2>Chỉnh prompt đang thử nghiệm</h2></div>
          <em>{draftPrompt.length.toLocaleString("vi-VN")} ký tự</em>
        </div>
        {promptError && <p className="prompt-lab-error">{promptError}</p>}
        <textarea className="prompt-lab-prompt" value={draftPrompt} onChange={(event) => { setDraftPrompt(event.target.value); setSaved(false); }} spellCheck={false} />
        <div className="prompt-lab-editor-actions">
          <button type="button" onClick={saveDraft}>Lưu bản nháp trên trình duyệt</button>
          <button type="button" onClick={() => void loadCurrentPrompt(true)}>Khôi phục prompt hiện tại</button>
          {saved && <span>Đã lưu bản nháp</span>}
        </div>
      </section>

      <section className="prompt-lab-results-section">
        <div className="prompt-lab-section-head">
          <div><span>03 · SO SÁNH</span><h2>Chạy cùng dữ liệu, xem hai kết quả</h2></div>
          <div className="prompt-lab-run-actions">
            <button type="button" disabled={currentResult.running || draftResult.running} onClick={() => void run("current")}>Chạy prompt hiện tại</button>
            <button type="button" disabled={currentResult.running || draftResult.running} onClick={() => void run("draft")}>Chạy bản nháp</button>
            <button className="prompt-lab-primary" type="button" disabled={currentResult.running || draftResult.running} onClick={() => void compare()}>So sánh cả hai</button>
          </div>
        </div>
        <p className="prompt-lab-note">“So sánh cả hai” chạy lần lượt để giảm nguy cơ API trả lỗi giới hạn 429.</p>
        <div className="prompt-lab-results">
          <ResultPanel title="Prompt hiện tại" state={currentResult} onCopy={() => void navigator.clipboard.writeText(currentResult.text)} />
          <ResultPanel title="Bản nháp" state={draftResult} onCopy={() => void navigator.clipboard.writeText(draftResult.text)} />
        </div>
      </section>
    </main>
  );
}

function ResultPanel({ title, state, onCopy }: { title: string; state: ResultState; onCopy: () => void }) {
  return (
    <article className="prompt-lab-result">
      <header><h3>{title}</h3><button type="button" disabled={!state.text} onClick={onCopy}>Sao chép</button></header>
      {state.running && <span className="prompt-lab-running">Đang đọc bài…</span>}
      {state.error && <p className="prompt-lab-error">{state.error}</p>}
      {!state.text && !state.error && !state.running && <p className="prompt-lab-empty">Kết quả sẽ xuất hiện ở đây.</p>}
      {state.text && <div className="prompt-lab-output">{state.text}</div>}
    </article>
  );
}
