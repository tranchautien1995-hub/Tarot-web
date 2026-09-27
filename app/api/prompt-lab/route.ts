import { NextResponse } from "next/server";
import { getPlanAccess } from "@/lib/plans";
import { getPromptLabSpread } from "@/lib/prompt-lab";
import { normalizeReadingStyle, readingPrompt, tarotSystemPrompt } from "@/lib/prompts";
import { verifyApiUser } from "@/lib/supabase/server-auth";
import type { DrawnCard, Orientation } from "@/lib/types";
import { getPromptLabModel, getXahModel, xahChatStream, type XahProviderId } from "@/lib/xah";

export const runtime = "nodejs";

type RawCard = { name?: unknown; orientation?: unknown };
type RunTarget = "compare_astra" | "primary_astra" | "sol_current" | "compare_draft";

const RUN_TARGETS: RunTarget[] = ["compare_astra", "primary_astra", "sol_current", "compare_draft"];

function makeCards(rawCards: unknown, positions: string[]): DrawnCard[] | null {
  if (!Array.isArray(rawCards) || rawCards.length !== positions.length) return null;

  const cards: DrawnCard[] = [];
  for (let index = 0; index < rawCards.length; index += 1) {
    const raw = rawCards[index] as RawCard;
    const name = typeof raw?.name === "string" ? raw.name.trim().slice(0, 100) : "";
    if (!name) return null;
    const orientation: Orientation = raw.orientation === "reversed" ? "reversed" : "upright";
    cards.push({
      id: `prompt-lab-${index + 1}`,
      name,
      vi: "",
      arcana: "major",
      symbol: "",
      upright: [],
      reversed: [],
      orientation,
      position: positions[index]
    });
  }
  return cards;
}

export async function POST(request: Request) {
  try {
    const auth = await verifyApiUser(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { isAdmin } = getPlanAccess(auth.user?.app_metadata, auth.localMode);
    if (!isAdmin) {
      return NextResponse.json({ error: "Prompt Lab chỉ dành cho tài khoản Admin." }, { status: 403 });
    }

    const body = await request.json();
    const spread = getPromptLabSpread(body.preset);
    if (!spread) return NextResponse.json({ error: "Dạng trải bài không hợp lệ." }, { status: 400 });

    const readingStyle = normalizeReadingStyle(body.readingStyle);
    const currentPrompt = tarotSystemPrompt(spread.id, readingStyle);
    const models = {
      compareAstra: getPromptLabModel(),
      primaryAstra: getXahModel("premium"),
      sol: getXahModel("free")
    };

    if (body.action === "get_prompt") {
      return NextResponse.json({ prompt: currentPrompt, models });
    }

    if (body.action !== "run") {
      return NextResponse.json({ error: "Thao tác không hợp lệ." }, { status: 400 });
    }

    const cards = makeCards(body.cards, spread.positions);
    if (!cards) {
      return NextResponse.json({ error: `Cần nhập đúng ${spread.count} lá cho trải ${spread.label}.` }, { status: 400 });
    }

    const question = spread.questionMode === "none" ? "" : String(body.question || "").trim().slice(0, 1200);
    if (spread.questionMode === "required" && !question) {
      return NextResponse.json({ error: "Hãy nhập câu hỏi thử nghiệm." }, { status: 400 });
    }

    const target = RUN_TARGETS.includes(body.target as RunTarget)
      ? body.target as RunTarget
      : null;
    if (!target) {
      return NextResponse.json({ error: "Mục so sánh không hợp lệ." }, { status: 400 });
    }
    const draftPrompt = typeof body.draftPrompt === "string" ? body.draftPrompt.trim() : "";
    if (target === "compare_draft" && (!draftPrompt || draftPrompt.length > 80_000)) {
      return NextResponse.json({ error: "Prompt bản nháp phải có nội dung và không vượt quá 80.000 ký tự." }, { status: 400 });
    }

    const targetConfig: Record<RunTarget, {
      prompt: string;
      model: string;
      provider: XahProviderId;
    }> = {
      compare_astra: { prompt: currentPrompt, model: models.compareAstra, provider: "fallback_1" },
      primary_astra: { prompt: currentPrompt, model: models.primaryAstra, provider: "primary" },
      sol_current: { prompt: currentPrompt, model: models.sol, provider: "primary" },
      compare_draft: { prompt: draftPrompt, model: models.compareAstra, provider: "fallback_1" }
    };
    const selected = targetConfig[target];

    const stream = await xahChatStream([
      { role: "system", content: selected.prompt },
      { role: "user", content: readingPrompt(question, cards, spread.id, readingStyle) }
    ], selected.model, selected.provider);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
        "X-Prompt-Lab-Model": selected.model,
        "X-Prompt-Lab-Target": target
      }
    });
  } catch (error) {
    console.error("Prompt Lab error", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Không thể chạy Prompt Lab."
    }, { status: 500 });
  }
}
