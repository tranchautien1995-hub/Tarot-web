import { NextResponse } from "next/server";
import { verifyApiUser } from "@/lib/supabase/server-auth";
import { getPlanAccess } from "@/lib/plans";
import { LENORMAND_DECK } from "@/lib/lenormand/deck";
import { readerChatStream } from "@/lib/xah";
import { lenormandReadingPrompt, lenormandSystemPrompt } from "@/lib/lenormand/prompts";
import type { DrawnLenormandCard, LenormandSpread, ReadingStyle } from "@/lib/lenormand/types";

export const runtime = "nodejs";

const VALID_SPREADS = new Set<LenormandSpread>(["line3", "line5", "box9", "grand_tableau"]);
const EXPECTED_COUNTS: Record<LenormandSpread, number> = { line3: 3, line5: 5, box9: 9, grand_tableau: 36 };

export async function POST(request: Request) {
  try {
    const auth = await verifyApiUser(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { access } = getPlanAccess(auth.user?.app_metadata, auth.localMode);
    if (!access.canUseLenormand) return NextResponse.json({ error: "Gói hiện tại chưa hỗ trợ Lenormand." }, { status: 403 });
    const body = await request.json();
    const spread = String(body.spread || "") as LenormandSpread;
    const cards = body.cards as DrawnLenormandCard[];
    if (!VALID_SPREADS.has(spread)) return NextResponse.json({ error: "Kiểu trải Lenormand không hợp lệ." }, { status: 400 });
    if (!Array.isArray(cards) || cards.length !== EXPECTED_COUNTS[spread]) {
      return NextResponse.json({ error: `Trải này cần đúng ${EXPECTED_COUNTS[spread]} lá.` }, { status: 400 });
    }

    const ids = new Set<string>();
    for (const card of cards) {
      const original = LENORMAND_DECK.find(item => item.id === card?.id && item.number === card?.number);
      if (!original || ids.has(card.id)) return NextResponse.json({ error: "Lá bài Lenormand không hợp lệ hoặc bị trùng." }, { status: 400 });
      ids.add(card.id);
    }
    if (spread !== "grand_tableau" && !String(body.question || "").trim()) return NextResponse.json({ error: "Hãy nhập câu hỏi cho trải bài." }, { status: 400 });
    if (!String(body.timeframe || "").trim()) return NextResponse.json({ error: "Hãy nhập khung thời gian." }, { status: 400 });
    const stream = await readerChatStream([
      { role: "system", content: lenormandSystemPrompt(spread, (["direct", "gentle", "companion"].includes(body.readingStyle) ? body.readingStyle : "direct") as ReadingStyle) },
      { role: "user", content: lenormandReadingPrompt({
        question: String(body.question || "").trim(),
        timeframe: String(body.timeframe || "").trim(),
        spread,
        cards,
        significator: body.significator === "man" || body.significator === "woman" ? body.significator : undefined
      }) }
    ]);

    return new Response(stream, { headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no"
    }});
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể đọc trải bài Lenormand.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
