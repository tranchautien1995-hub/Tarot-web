import { NextResponse } from "next/server";
import type { ChatMessage, DrawnCard } from "@/lib/types";
import { getXahModel, xahChat, type XahMessage } from "@/lib/xah";
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
    const reading = String(body.reading || "").trim();
    const followup = String(body.followup || "").trim();
    const cards = body.cards as DrawnCard[];
    const preset = String(body.preset || "");
    const spreadPreset = preset || undefined;
    const readingStyle = normalizeReadingStyle(body.readingStyle);
    const history = (body.history || []) as ChatMessage[];

    if (
      !reading ||
      !followup ||
      !Array.isArray(cards) ||
      cards.length < 1 ||
      cards.length > 78
    ) {
      return NextResponse.json(
        { error: "Thiếu dữ liệu hội thoại." },
        { status: 400 }
      );
    }

    const { access } = getPlanAccess(auth.user?.app_metadata, auth.localMode);
    const accessError = validatePlanReading(access, preset, cards.length, body.readingStyle);
    if (accessError) {
      return NextResponse.json({ error: accessError }, { status: 403 });
    }

    const recentHistory: XahMessage[] = history
      .slice(-12)
      .filter(
        (message) =>
          message &&
          (message.role === "user" || message.role === "assistant") &&
          typeof message.content === "string" &&
          message.content.trim()
      )
      .map((message) => ({
        role: message.role,
        content: message.content.trim(),
      }));

    const messages: XahMessage[] = [
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
      {
        role: "assistant",
        content: reading,
      },
      ...recentHistory,
      {
        role: "user",
        content: followup,
      },
    ];

    const answer = await xahChat(messages, getXahModel(access.modelTier));

    return NextResponse.json({ answer });
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error
        ? error.message
        : "Không thể kết nối GPT-6 Astra.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
