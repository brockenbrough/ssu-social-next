import { NextResponse } from "next/server";

const TEST_POST_ID = "33333333-3333-3333-3333-333333333333";

export async function GET() {
  try {
    const res = await fetch(`http://localhost:3000/api/Views/GetViews/${TEST_POST_ID}`);
    const text = await res.text(); // read raw text first

    let data;
    try {
      data = JSON.parse(text); // try to parse JSON
    } catch {
      return NextResponse.json(
        { success: false, message: "API did not return JSON", raw: text },
        { status: res.status }
      );
    }

    if (res.status === 200 && typeof data.viewCount === "number") {
      return NextResponse.json({
        success: true,
        message: "GET /api/Views/GetViews/:postId returned a valid count.",
        data,
      });
    } else {
      return NextResponse.json(
        { success: false, message: `Unexpected status ${res.status}`, data },
        { status: res.status }
      );
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
