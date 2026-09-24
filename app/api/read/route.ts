import { NextResponse } from "next/server";
import type { DrawnCard } from "@/lib/types";
import { getXahModel, xahChatStream } from "@/lib/xah";
import { freeTarotSystemPrompt, normalizeReadingStyle, readingPrompt, tarotSystemPrompt } from "@/lib/prompts";
import { verifyApiUser } from "@/lib/supabase/server-auth";
import { getPlanAccess, validatePlanReading } from "@/lib/plans";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const auth = await verifyApiUser(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const question = String(body.question || "").trim();
    const cards = body.cards as DrawnCard[];
    const preset = String(body.preset || "");
    const spreadPreset = body.preset === "celtic" ? "celtic" : undefined;
    const readingStyle = normalizeReadingStyle(body.readingStyle);

    if (!Array.isArray(cards) || cards.length < 1 || cards.length > 78) {
      return NextResponse.json(
        { error: "Trải bài phải có từ 1 đến 78 lá." },
        { status: 400 }
      );
    }

    const { access } = getPlanAccess(auth.user?.app_metadata, auth.localMode);
    const accessError = validatePlanReading(access, preset, cards.length, body.readingStyle);
    if (accessError) {
      return NextResponse.json({ error: accessError }, { status: 403 });
    }

    const stream = await xahChatStream([
      {
        role: "system",
        content: access.modelTier === "free"
          ? freeTarotSystemPrompt()
          : tarotSystemPrompt(spreadPreset, readingStyle),
      },
      {
        role: "user",
        content: readingPrompt(question, cards, spreadPreset, readingStyle),
      },
    ], getXahModel(access.modelTier));

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error
        ? error.message
        : "Không thể kết nối GPT-6 Astra.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
