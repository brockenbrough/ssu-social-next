import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("http://localhost:3000/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "comment",
        user_id: "11111111-1111-1111-1111-111111111111", // sample UUID
        action_username: "jdoe",
        text: "John Doe commented on your post",
        post_id: "22222222-2222-2222-2222-222222222222"
      }),
    });

    const data = await res.json();

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      body: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Test route failed", details: err.message },
      { status: 500 }
    );
  }
}
