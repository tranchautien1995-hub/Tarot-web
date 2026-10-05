export type TtsReadingStyle = "default" | "direct" | "gentle" | "companion";

export type TtsVoicePreset = {
  voice: string;
  style: string;
  label: string;
};

export const TTS_VOICE_PRESETS: Record<TtsReadingStyle, TtsVoicePreset> = {
  default: {
    label: "Mặc định",
    voice: "Fola",
    style: `
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
`.trim(),
  },

  direct: {
    label: "Thẳng thắn",
    voice: "Fola",
    style: `
Natural Vietnamese female voice with a Northern Vietnamese accent,
preferably Hanoi-style pronunciation.

Mature, slightly low-pitched, calm, firm, and emotionally restrained.

Speak at a normal conversational pace.
Do not speak slowly.

The delivery should feel direct, composed, and slightly cool.
Sound confident without sounding harsh.

Use a natural Northern Vietnamese rhythm.
Pronounce words clearly, but do not over-enunciate.

Avoid a cheerful, sweet, soft, theatrical, mystical,
commercial, radio-host, or newsreader tone.

Keep pauses short.
Keep sentences connected and fluid.
End declarative sentences with a natural downward intonation.

For conclusions, sound firmer and more decisive.
For emotional passages, stay controlled rather than sentimental.

Overall impression:
a mature Hanoi woman speaking directly, calmly,
and privately to one person.
`.trim(),
  },

  gentle: {
    label: "Nhẹ nhàng",
    voice: "Gacrux",
    style: `
Natural Vietnamese female voice with a soft Northern Vietnamese accent,
preferably Hanoi-style pronunciation.

Warm, mature, intimate, calm, and slightly low-pitched.

Speak at a normal conversational speed.
Use a gentle, natural Northern Vietnamese rhythm.

The voice should feel close and personal,
like speaking privately to one person in a quiet room.

Keep emotion subtle and sincere.
Slightly soften the voice during sensitive or emotional sentences.

Do not sound overly sweet, breathy, dreamy, theatrical,
commercial, or like a newsreader.
Do not speak too slowly.
Do not exaggerate pauses.

Keep sentences flowing naturally.
Use short pauses only when the meaning changes.

Overall impression:
a warm, thoughtful Vietnamese woman from Hanoi
speaking calmly and sincerely to one person.
`.trim(),
  },

  companion: {
    label: "Tâm sự",
    voice: "Gacrux",
    style: `
Natural Vietnamese female voice with a soft Northern Vietnamese accent,
preferably Hanoi-style pronunciation.

Warm, mature, intimate, calm, and slightly low-pitched.

Speak at a normal conversational speed.
Use a gentle, natural Northern Vietnamese rhythm.

The voice should feel close and personal,
like speaking privately to one person in a quiet room.

Keep emotion subtle and sincere.
Slightly soften the voice during sensitive or emotional sentences.

Do not sound overly sweet, breathy, dreamy, theatrical,
commercial, or like a newsreader.
Do not speak too slowly.
Do not exaggerate pauses.

Keep sentences flowing naturally.
Use short pauses only when the meaning changes.

Overall impression:
a warm, thoughtful Vietnamese woman from Hanoi
speaking calmly and sincerely to one person.
`.trim(),
  },
};

export function resolveTtsVoicePreset(value: unknown): TtsVoicePreset {
  if (value === "direct" || value === "gentle" || value === "companion") {
    return TTS_VOICE_PRESETS[value];
  }
  return TTS_VOICE_PRESETS.default;
}

export function normalizeTtsReadingStyle(value: unknown): TtsReadingStyle {
  return value === "direct" || value === "gentle" || value === "companion" ? value : "default";
}
