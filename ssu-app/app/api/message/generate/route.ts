// app/message/generate/route.ts
import { NextResponse } from "next/server";
import { generateMessage } from "@/app/lib/openaiService";


export async function POST(req: Request) {
  try {

    const body = (await req.json()) as { chatHistoryStr?: string };
    const chatHistoryStr = (body.chatHistoryStr ?? "").trim();

    // Keep exact old behavior: empty/whitespace -> { message: "" }
    if (!chatHistoryStr) {
      return NextResponse.json({ message: "" });
    }

    const aiResponse = await generateMessage(chatHistoryStr);
    return NextResponse.json({ message: aiResponse });
  } catch (err) {
    console.error("Error generating message:", err);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
