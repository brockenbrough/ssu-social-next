import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 1) Empty/whitespace input should return { message: "" } with 200
    const emptyRes = await fetch("http://localhost:3000/message/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatHistoryStr: "   " }),
    });
    const emptyData = await emptyRes.json().catch(() => ({} as any));

    if (
      emptyRes.status !== 200 ||
      typeof emptyData?.message !== "string" ||
      emptyData.message !== ""
    ) {
      return NextResponse.json(
        {
          success: false,
          step: "empty",
          message: `Expected 200 + empty message. Got status=${emptyRes.status}`,
          response: emptyData,
        },
        { status: 500 }
      );
    }

    // 2) Valid chat history should return a short, non-empty response w/o "Me:" prefix
    const payload = {
      chatHistoryStr:
        "Bob: hey\nMe: hey! how are you?\nBob: I'm good — any plans for tonight?",
    };

    const genRes = await fetch("http://localhost:3000/message/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const genData = await genRes.json().catch(() => ({} as any));

    if (genRes.status !== 200 || typeof genData?.message !== "string") {
      return NextResponse.json(
        {
          success: false,
          step: "generate",
          message: `Expected 200 + { message: string }. Got status=${genRes.status}`,
          response: genData,
        },
        { status: 500 }
      );
    }

    const text: string = genData.message.trim();
    const tooLong = text.length > 300; // "very short" heuristic
    const hasMePrefix = /^me:\s*/i.test(text);
    const containsAI = /as an ai/i.test(text);

    if (!text || hasMePrefix || tooLong || containsAI) {
      return NextResponse.json(
        {
          success: false,
          step: "validate",
          message: "Generated message failed validation.",
          checks: {
            nonEmpty: !!text,
            noMePrefix: !hasMePrefix,
            lengthLTE300: !tooLong,
            noAIDisclaimer: !containsAI,
          },
          generated: text,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Generate integration passed: empty input handled, and valid chat returned a short, clean reply.",
      emptyCaseResponse: emptyData,
      generated: text,
      length: text.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}