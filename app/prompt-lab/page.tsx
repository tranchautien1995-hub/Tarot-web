"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePlanAccess } from "@/components/AccessContext";
import { PROMPT_LAB_SPREADS } from "@/lib/prompt-lab";
import type { ReadingStyle } from "@/lib/prompts";
import { getApiAuthHeaders } from "@/lib/supabase/auth-fetch";

type RunTarget = "compare_astra" | "primary_astra" | "sol_current" | "compare_draft";
type ResultState = { text: string; error: string; running: boolean };
type PromptLabModels = { compareAstra: string; primaryAstra: string; sol: string };

const EMPTY_RESULT: ResultState = { text: "", error: "", running: false };
const EMPTY_RESULTS: Record<RunTarget, ResultState> = {
  compare_astra: EMPTY_RESULT,
  primary_astra: EMPTY_RESULT,
  sol_current: EMPTY_RESULT,
  compare_draft: EMPTY_RESULT
};
const DEFAULT_MODELS: PromptLabModels = {
  compareAstra: "santiagosgrantp/gpt-6-astra",
  primaryAstra: "gpt-6-astra",
  sol: "gpt-5.6-sol"
};
const RUN_ORDER: RunTarget[] = ["compare_astra", "primary_astra", "sol_current", "compare_draft"];
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
  const [labModels, setLabModels] = useState<PromptLabModels>(DEFAULT_MODELS);
  const [promptError, setPromptError] = useState("");
  const [saved, setSaved] = useState(false);
  const [results, setResults] = useState<Record<RunTarget, ResultState>>(EMPTY_RESULTS);
  const [batchRunning, setBatchRunning] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const abortRefs = useRef<Partial<Record<RunTarget, AbortController>>>({});
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
    setResults(EMPTY_RESULTS);
    setCopiedAll(false);
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
      const data = await response.json() as { prompt?: string; models?: PromptLabModels; error?: string };
      if (!response.ok || !data.prompt) throw new Error(data.error || "Không tải được prompt hiện tại.");
      setCurrentPrompt(data.prompt);
      if (data.models) setLabModels(data.models);
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

  function resetResults() {
    setResults(EMPTY_RESULTS);
    setCopiedAll(false);
  }

  function setTargetResult(target: RunTarget, next: ResultState) {
    setResults((current) => ({ ...current, [target]: next }));
  }

  async function run(target: RunTarget) {
    const cards = parseCardLines(cardLines);
    if (cards.length !== spread.count) {
      setTargetResult(target, { text: "", running: false, error: `Cần nhập đúng ${spread.count} dòng lá bài.` });
      return;
    }
    if (spread.questionMode === "required" && !question.trim()) {
      setTargetResult(target, { text: "", running: false, error: "Hãy nhập câu hỏi thử nghiệm." });
      return;
    }

    abortRefs.current[target]?.abort();
    const controller = new AbortController();
    abortRefs.current[target] = controller;
    setTargetResult(target, { text: "", error: "", running: true });
    try {
      const authHeaders = await getApiAuthHeaders();
      const response = await fetch("/api/prompt-lab", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ action: "run", target, preset, readingStyle, question, cards, draftPrompt })
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
        setTargetResult(target, { text, error: "", running: true });
      }
      text += decoder.decode();
      setTargetResult(target, { text, error: "", running: false });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setTargetResult(target, { text: "", running: false, error: error instanceof Error ? error.message : "Không thể chạy thử." });
    } finally {
      if (abortRefs.current[target] === controller) delete abortRefs.current[target];
    }
  }

  async function compareAll() {
    setBatchRunning(true);
    setCopiedAll(false);
    try {
      await Promise.all(RUN_ORDER.map((target) => run(target)));
    } finally {
      setBatchRunning(false);
    }
  }

  async function copyAllResults() {
    const styleLabel = STYLES.find((item) => item.id === readingStyle)?.label || readingStyle;
    const resultBlock = (target: RunTarget, title: string, model: string) => {
      const result = results[target];
      const content = result.error
        ? `[LỖI — có thể bỏ qua khi so sánh]\n${result.error}`
        : result.text || "[CHƯA CÓ KẾT QUẢ]";
      return `\n\n=== ${title} ===\nModel: ${model}\n${content}`;
    };
    const copiedText = `Tôi cần bạn so sánh 4 kết quả đọc Tarot dưới đây. Hãy đánh giá độ chính xác, độ tự nhiên, mức dễ hiểu, khả năng liên kết các lá, mức suy diễn và độ lặp ý. Sau đó đề xuất cụ thể nên giữ điểm nào, bỏ điểm nào và chỉnh prompt bản nháp ra sao. Nếu GPT Astra 6 bị lỗi thì bỏ qua ô đó và phân tích các ô còn lại.

=== DỮ LIỆU CHUNG ===
Dạng trải: ${spread.label}
Phong cách: ${styleLabel}
Câu hỏi: ${spread.questionMode === "none" ? "Trải bài này không cần câu hỏi cụ thể" : question.trim()}
Các lá bài:
${cardLines.trim()}
${resultBlock("compare_astra", "1. PROMPT HIỆN TẠI — SANTIAGOS ASTRA", labModels.compareAstra)}
${resultBlock("primary_astra", "2. PROMPT HIỆN TẠI — GPT ASTRA 6", labModels.primaryAstra)}
${resultBlock("sol_current", "3. PROMPT HIỆN TẠI — GPT SOL 5.6", labModels.sol)}
${resultBlock("compare_draft", "4. PROMPT BẢN NHÁP — SANTIAGOS ASTRA", labModels.compareAstra)}

=== YÊU CẦU PHÂN TÍCH ===
1. So sánh từng phần: mở đầu, thân bài, cách nối lá, lời khuyên và Tóm lại.
2. Chỉ ra câu nào hay, câu nào dài dòng, học thuật, khó hiểu hoặc suy diễn quá mức.
3. Chọn phương án tốt nhất dựa trên cả nội dung lẫn văn phong, không chỉ dựa vào độ dài.
4. Đưa ra những quy tắc prompt cụ thể cần thêm, sửa hoặc bỏ.
5. Chưa sửa code cho đến khi tôi duyệt phương án.`;
    await navigator.clipboard.writeText(copiedText);
    setCopiedAll(true);
    window.setTimeout(() => setCopiedAll(false), 2200);
  }

  const anyRunning = batchRunning || RUN_ORDER.some((target) => results[target].running);
  const comparisonComplete = !anyRunning && RUN_ORDER.every((target) => Boolean(results[target].text || results[target].error));

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
          <h1>So sánh 4 bản đọc trên 3 model</h1>
          <p>Cùng một câu hỏi và bộ lá được đọc bằng Santiagos Astra, GPT Astra 6 và GPT Sol 5.6; bản nháp được kiểm tra lại trên Santiagos Astra.</p>
        </div>
        <div className="prompt-lab-header-actions">
          <button type="button" onClick={toggleTheme}>{theme === "dark" ? "Giao diện sáng" : "Giao diện tối"}</button>
          <button type="button" onClick={() => window.location.assign("/")}>← Trang chính</button>
        </div>
      </header>

      <section className="prompt-lab-workbench">
        <div className="prompt-lab-section-head">
          <div><span>01 · DỮ LIỆU THỬ</span><h2>Chọn trải bài và bộ lá cố định</h2></div>
          <em>3 model · 4 kết quả · Không trừ lượt trải bài</em>
        </div>
        <div className="prompt-lab-controls">
          <label>Dạng trải
            <select value={preset} onChange={(event) => { setPreset(event.target.value); resetResults(); }}>
              {PROMPT_LAB_SPREADS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <label>Phong cách
            <select value={readingStyle} onChange={(event) => { setReadingStyle(event.target.value as ReadingStyle); resetResults(); }}>
              {STYLES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <label className="prompt-lab-question">Câu hỏi
            <textarea value={spread.questionMode === "none" ? "Trải bài này không cần câu hỏi cụ thể" : question} disabled={spread.questionMode === "none"} onChange={(event) => { setQuestion(event.target.value); resetResults(); }} />
          </label>
          <label className="prompt-lab-cards">Các lá bài — mỗi dòng: Tên lá | xuôi/ngược
            <textarea value={cardLines} onChange={(event) => { setCardLines(event.target.value); resetResults(); }} spellCheck={false} />
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
        <textarea className="prompt-lab-prompt" value={draftPrompt} onChange={(event) => { setDraftPrompt(event.target.value); setSaved(false); setResults((current) => ({ ...current, compare_draft: EMPTY_RESULT })); setCopiedAll(false); }} spellCheck={false} />
        <div className="prompt-lab-editor-actions">
          <button type="button" onClick={saveDraft}>Lưu bản nháp trên trình duyệt</button>
          <button type="button" onClick={() => void loadCurrentPrompt(true)}>Khôi phục prompt hiện tại</button>
          {saved && <span>Đã lưu bản nháp</span>}
        </div>
      </section>

      <section className="prompt-lab-results-section">
        <div className="prompt-lab-section-head">
          <div><span>03 · SO SÁNH</span><h2>Chạy cùng dữ liệu, xem bốn kết quả</h2></div>
          <div className="prompt-lab-run-actions">
            <button type="button" disabled={anyRunning} onClick={() => void run("compare_astra")}>Santiagos Astra</button>
            <button type="button" disabled={anyRunning} onClick={() => void run("primary_astra")}>GPT Astra 6</button>
            <button type="button" disabled={anyRunning} onClick={() => void run("sol_current")}>Sol · hiện tại</button>
            <button type="button" disabled={anyRunning} onClick={() => void run("compare_draft")}>Santiagos · bản nháp</button>
            <button className="prompt-lab-primary" type="button" disabled={anyRunning} onClick={() => void compareAll()}>{batchRunning ? "Đang đọc đồng thời…" : "Đọc đồng thời 4 ô"}</button>
            <button type="button" disabled={!comparisonComplete} onClick={() => void copyAllResults()}>{copiedAll ? "✓ Đã sao chép" : "Sao chép để gửi ChatGPT"}</button>
          </div>
        </div>
        <p className="prompt-lab-note">Một lần bấm sẽ gửi bốn request đồng thời. Nếu GPT Astra 6 lỗi, ô số 2 ghi lỗi nhưng ba ô còn lại vẫn tiếp tục đọc.</p>
        <div className="prompt-lab-results">
          <ResultPanel title="1. Prompt hiện tại · Santiagos Astra" model={labModels.compareAstra} state={results.compare_astra} onCopy={() => void navigator.clipboard.writeText(results.compare_astra.text)} />
          <ResultPanel title="2. Prompt hiện tại · GPT Astra 6" model={labModels.primaryAstra} state={results.primary_astra} onCopy={() => void navigator.clipboard.writeText(results.primary_astra.text)} />
          <ResultPanel title="3. Prompt hiện tại · GPT Sol 5.6" model={labModels.sol} state={results.sol_current} onCopy={() => void navigator.clipboard.writeText(results.sol_current.text)} />
          <ResultPanel title="4. Prompt bản nháp · Santiagos Astra" model={labModels.compareAstra} state={results.compare_draft} onCopy={() => void navigator.clipboard.writeText(results.compare_draft.text)} />
        </div>
      </section>
    </main>
  );
}

function ResultPanel({ title, model, state, onCopy }: { title: string; model: string; state: ResultState; onCopy: () => void }) {
  return (
    <article className="prompt-lab-result">
      <header><div><h3>{title}</h3><small>{model}</small></div><button type="button" disabled={!state.text} onClick={onCopy}>Sao chép ô này</button></header>
      {state.running && <span className="prompt-lab-running">Đang đọc bài…</span>}
      {state.error && <p className="prompt-lab-error">{state.error}</p>}
      {!state.text && !state.error && !state.running && <p className="prompt-lab-empty">Kết quả sẽ xuất hiện ở đây.</p>}
      {state.text && <div className="prompt-lab-output">{state.text}</div>}
    </article>
  );
}
