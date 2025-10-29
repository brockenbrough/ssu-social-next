// app/api/Views/test/CreateViewTest/route.ts
import { NextResponse } from "next/server";

// Fixed test UUIDs (from schema_load.sql)
const TEST_USER_ID = "22222222-2222-2222-2222-222222222222";
const TEST_POST_ID = "33333333-3333-3333-3333-333333333333";

export async function GET() {
  try {
    // 1️⃣ Make a POST request to the CreateView route
    const res = await fetch("http://localhost:3000/api/Views/CreateView", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: TEST_USER_ID, postId: TEST_POST_ID }),
    });

    // 2️⃣ Attempt to parse JSON safely
    let data: any;
    try {
      data = await res.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Response was not valid JSON.",
          status: res.status,
        },
        { status: res.status }
      );
    }

    // 3️⃣ Evaluate expected results
    const okStatuses = [200, 201];
    const expectedMessages = [
      "View added successfully.",
      "View already exists — no duplicate created.",
      "Unique View Already Exists", // legacy wording (backward compatibility)
    ];

    const valid = okStatuses.includes(res.status) &&
      expectedMessages.some((msg) => data.message?.includes(msg));

    if (valid) {
      return NextResponse.json({
        success: true,
        message: "✅ POST /api/Views/CreateView works as expected.",
        status: res.status,
        data,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: `❌ Unexpected response from CreateView.`,
          status: res.status,
          data,
        },
        { status: res.status }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message ?? "Unhandled error in test" },
      { status: 500 }
    );
  }
}
