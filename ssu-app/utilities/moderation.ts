import { censorContent, preprocessText } from "@/app/lib/openaiService";

export function getCustomFlaggedWords(): string[] {
  const s = process.env.CUSTOM_FLAGGED_WORDS || "";
  return s.split(",").map(w => w.trim()).filter(Boolean);
}

export async function censorText(input: string): Promise<{ text: string; changed: boolean }> {
  const pre = preprocessText(input);
  const out = await censorContent(pre, getCustomFlaggedWords());
  return { text: out || pre, changed: (out || pre) !== pre };
}