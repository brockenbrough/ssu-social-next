import { NextResponse } from "next/server";

export async function GET() {
  try {
    const targetUrl = "http://localhost:3000/api/hashmaps/getAll";
    const res = await fetch(targetUrl);

    const raw = await res.text(); // Read raw text (could be HTML or JSON)
    let data: any;

    try {
      data = JSON.parse(raw);
    } catch {
      // Response isn't JSON — likely an HTML error page
      return NextResponse.json(
        {
          success: false,
          message: "❌ Response was not valid JSON.",
          status: res.status,
          received: raw.slice(0, 200), // first part of HTML for debugging
          hint: "Make sure /api/hashmaps exists and returns JSON.",
        },
        { status: 500 }
      );
    }

    // ✅ Now data is JSON
    if (res.status === 200 && Array.isArray(data)) {
      const hasTestTag = data.some((h: any) => h.hashtag === "#TestTag");

      if (hasTestTag) {
        return NextResponse.json({
          success: true,
          message: "✅ Found expected test hashtag (#TestTag).",
          count: data.length,
        });
      }

      return NextResponse.json(
        {
          success: false,
          message: "⚠️ No test hashtag (#TestTag) found in response.",
          data,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: `⚠️ Unexpected status code: ${res.status}`,
        data,
      },
      { status: res.status }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: `❌ Test failed: ${err.message}` },
      { status: 500 }
    );
  }
}
