import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("http://localhost:3000/api/notifications/get", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "merry567" }), // sample test username
    });

    const data = await res.json();

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      body: data,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) });
  }
}
