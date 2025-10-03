import { NextResponse } from "next/server";

// Hard-coded values from your seed
const TEST_USER_ID = "22222222-2222-2222-2222-222222222222";
const TEST_POST_ID = "33333333-3333-3333-3333-333333333333";

export async function GET() {
  try {
    const res = await fetch("http://localhost:3000/api/Views/PostViews", {
      method: "POST",
      body: JSON.stringify({ userId: TEST_USER_ID, postId: TEST_POST_ID }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();

    if (res.status === 201 || (res.status === 200 && data.message === "Unique View Already Exists")) {
      return NextResponse.json({
        success: true,
        message: "POST /api/Views/PostViews works as expected.",
        data,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: `Unexpected response. Status: ${res.status}`,
          data,
        },
        { status: res.status }
      );
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
