import { NextResponse } from "next/server";
import type { DrawnCard } from "@/lib/types";
import { getXahModel, xahChatStream } from "@/lib/xah";
import { freeTarotSystemPrompt, normalizeReadingStyle, readingPrompt, tarotSystemPrompt } from "@/lib/prompts";
import { verifyApiUser } from "@/lib/supabase/server-auth";
import { getPlanAccess, validatePlanReading, type SpreadAccess } from "@/lib/plans";
import { consumeDailyReadingQuota, quotaErrorMessage } from "@/lib/reading-quota";

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
    const spreadPreset = preset || undefined;
    const readingStyle = normalizeReadingStyle(body.readingStyle);

    if (!Array.isArray(cards) || cards.length < 1 || cards.length > 78) {
      return NextResponse.json(
        { error: "Trải bài phải có từ 1 đến 78 lá." },
        { status: 400 }
      );
    }

    const { access, isAdmin, plan } = getPlanAccess(auth.user?.app_metadata, auth.localMode);
    const accessError = validatePlanReading(access, preset, cards.length, body.readingStyle);
    if (accessError) {
      return NextResponse.json({ error: accessError }, { status: 403 });
    }

    const quota = await consumeDailyReadingQuota({
      access,
      plan,
      preset: preset as SpreadAccess,
      userId: auth.user?.id ?? null,
      bypass: auth.localMode || isAdmin
    });
    if (quota && !quota.allowed) {
      return NextResponse.json({
        error: quotaErrorMessage(preset as SpreadAccess, quota),
        code: "DAILY_READING_LIMIT_REACHED",
        limit: quota.limit,
        remaining: 0,
        resetsAt: quota.resetsAt
      }, { status: 429 });
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

    const responseHeaders: Record<string, string> = {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
    };
    if (quota) {
      responseHeaders["X-TTarot-Daily-Limit"] = String(quota.limit);
      responseHeaders["X-TTarot-Daily-Remaining"] = String(quota.remaining);
      if (quota.resetsAt) responseHeaders["X-TTarot-Daily-Resets-At"] = quota.resetsAt;
    }

    return new Response(stream, {
      headers: responseHeaders,
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
