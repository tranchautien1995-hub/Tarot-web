import { NextResponse } from "next/server";
import type { DrawnCard } from "@/lib/types";
import { xahChat } from "@/lib/xah";
import { readingPrompt, tarotSystemPrompt } from "@/lib/prompts";
import { verifyApiUser } from "@/lib/supabase/server-auth";

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
    const spreadPreset = body.preset === "celtic" ? "celtic" : undefined;

    if (!Array.isArray(cards) || cards.length < 1 || cards.length > 78) {
      return NextResponse.json(
        { error: "Trải bài phải có từ 1 đến 78 lá." },
        { status: 400 }
      );
    }

    const reading = await xahChat([
      {
        role: "system",
        content: tarotSystemPrompt(spreadPreset),
      },
      {
        role: "user",
        content: readingPrompt(question, cards, spreadPreset),
      },
    ]);

    return NextResponse.json({ reading });
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error
        ? error.message
        : "Không thể kết nối GPT-5.6 Sol.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
