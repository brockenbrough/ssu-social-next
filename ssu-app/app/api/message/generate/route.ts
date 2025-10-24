import { NextResponse } from "next/server";
import { generateMessage } from "@/app/lib/openaiService";
import { corsHeaders } from "@/utilities/cors";

export async function OPTIONS(_req: Request) {
  return NextResponse.json(null, { status: 200, headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { chatHistoryStr?: string };
    const chatHistoryStr = (body.chatHistoryStr ?? "").trim();

    // Keep exact old behavior: empty/whitespace -> { message: "" }
    if (!chatHistoryStr) {
      return NextResponse.json({ message: "" }, { headers: corsHeaders });
    }

    const aiResponse = await generateMessage(chatHistoryStr);
    return NextResponse.json({ message: aiResponse }, { headers: corsHeaders });
  } catch (err) {
    console.error("Error generating message:", err);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500, headers: corsHeaders }
    );
  }
}