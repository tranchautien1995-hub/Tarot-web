import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const STYLE = `
Natural Vietnamese female voice.

Normal conversational speaking speed.
Mature, calm, warm, and slightly low-pitched.

Speak naturally, as if talking privately to one person.
Smooth pacing with subtle emotional variation.

Do not speak slowly.
Do not sound theatrical.
Do not sound like an advertisement or newsreader.
Do not exaggerate pauses or emotions.

Keep sentences connected and fluid.
Use only very short natural pauses between paragraphs.
`;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const text =
      typeof body?.text === "string"
        ? body.text.trim()
        : "";

    if (!text) {
      return Response.json(
        { error: "Thiếu nội dung cần đọc." },
        { status: 400 }
      );
    }

    const interaction = await ai.interactions.create({
      model: "gemini-3.8-flash-lite-tts",

      input: [
        {
          type: "user_input",
          content: [
            {
              type: "text",
              text,
              annotations: [
                {
                  type: "speech_metadata",
                  style: STYLE,
                },
              ],
            },
          ],
        },
      ],

      response_format: {
        type: "audio",
        mime_type: "audio/wav",
      },

      generation_config: {
        speech_config: [
          {
            voice: "Fola",
          },
        ],
      },
    });

    const audioData = interaction.output_audio?.data;

    if (!audioData) {
      throw new Error("Gemini không trả về audio.");
    }

    const audioBuffer = Buffer.from(audioData, "base64");

    return new Response(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[Gemini TTS]", error);

    return Response.json(
      { error: "Không thể tạo giọng đọc." },
      { status: 500 }
    );
  }
}