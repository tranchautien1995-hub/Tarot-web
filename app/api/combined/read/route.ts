import { NextResponse } from "next/server";
import { verifyApiUser } from "@/lib/supabase/server-auth";
import { getPlanAccess } from "@/lib/plans";
import { TAROT_DECK } from "@/lib/deck";
import { LENORMAND_DECK } from "@/lib/lenormand/deck";
import { normalizeReadingStyle } from "@/lib/prompts";
import { readerChatStream } from "@/lib/xah";
import { COMBINED_SPREADS, isCombinedSpread, type CombinedSpread } from "@/lib/combined/spreads";
import { combinedSystemPrompt, combinedReadingPrompt } from "@/lib/combined/prompts";
import type { DrawnCard } from "@/lib/types";
import type { DrawnLenormandCard } from "@/lib/lenormand/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const auth = await verifyApiUser(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { access } = getPlanAccess(auth.user?.app_metadata, auth.localMode);
    // Existing Lenormand entitlement only. No invented combined quota or plan.
    if (!access.canUseLenormand) return NextResponse.json({ error: "Gói hiện tại chưa hỗ trợ Lenormand." }, { status: 403 });
    const body = await request.json();
    if (!body || typeof body !== "object" || !isCombinedSpread(body.spread)) return NextResponse.json({ error: "Kiểu trải kết hợp không hợp lệ." }, { status: 400 });
    const spread = body.spread as CombinedSpread;
    const definition = COMBINED_SPREADS[spread];
    const question = typeof body.question === "string" ? body.question.trim() : "";
    if (!question || question.length > 5000) return NextResponse.json({ error: "Hãy nhập câu hỏi không quá 5000 ký tự." }, { status: 400 });
    if (!Array.isArray(body.tarot) || body.tarot.length !== definition.tarotPositions.length || !Array.isArray(body.lenormand) || body.lenormand.length !== definition.lenormandPositions.length) return NextResponse.json({ error: "Số lá của hai hệ không khớp kiểu trải." }, { status: 400 });
    if (body.readingStyle != null && !["default", "direct", "gentle", "companion"].includes(body.readingStyle)) return NextResponse.json({ error: "Phong cách đọc không hợp lệ." }, { status: 400 });
    const tarot: DrawnCard[] = [], lenormand: DrawnLenormandCard[] = [];
    const tarotIds = new Set<string>(), lenormandIds = new Set<string>();
    for (const [index, card] of body.tarot.entries()) {
      const original = TAROT_DECK.find(item => item.id === card?.id);
      if (!original || tarotIds.has(original.id) || card.name !== original.name || !["upright", "reversed"].includes(card.orientation) || card.position !== definition.tarotPositions[index]) return NextResponse.json({ error: "Tarot: lá, thứ tự, vị trí hoặc orientation không hợp lệ." }, { status: 400 });
      tarotIds.add(original.id);
      tarot.push({ ...original, orientation: card.orientation, position: definition.tarotPositions[index] });
    }
    for (const [index, card] of body.lenormand.entries()) {
      const original = LENORMAND_DECK.find(item => item.id === card?.id);
      if (!original || lenormandIds.has(original.id) || card.name !== original.name || (card.number !== undefined && card.number !== original.number) || card.orientation !== undefined || card.position !== definition.lenormandPositions[index]) return NextResponse.json({ error: "Lenormand: lá, thứ tự hoặc vị trí không hợp lệ; không dùng lá ngược." }, { status: 400 });
      lenormandIds.add(original.id);
      lenormand.push({ ...original, position: definition.lenormandPositions[index] });
    }
    const readingStyle = normalizeReadingStyle(body.readingStyle);
    const stream = await readerChatStream([
      { role: "system", content: combinedSystemPrompt(spread, readingStyle) },
      { role: "user", content: combinedReadingPrompt({ question, spread, readingStyle, tarot, lenormand }) }
    ]);
    return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no" } });
  } catch {
    return NextResponse.json({ error: "Hệ thống đang quá tải, vui lòng thử lại." }, { status: 500 });
  }
}
