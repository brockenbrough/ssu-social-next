import { NextResponse } from "next/server";

export async function GET() {
  try {
    const seededPostId = "33333333-3333-3333-3333-333333333333";
    const expectedCount = 3;

    const res = await fetch(
      `http://localhost:3000/api/count/likes-for-post/${seededPostId}`,
      { headers: { Accept: "application/json" }, cache: "no-store" }
    );

    // If the target route returned an error, surface it
    if (!res.ok) {
      let body: any = null;
      try { body = await res.json(); } catch {}
      return NextResponse.json(
        {
          success: false,
          message: `count route returned ${res.status}`,
          data: body ?? null,
        },
        { status: 500 }
      );
    }

    const json = await res.json();

    // The count route returns a raw JSON number (not { count: n })
    if (typeof json !== "number") {
      return NextResponse.json(
        {
          success: false,
          message: "Unexpected response structure from count route (expected a number).",
          data: json,
        },
        { status: 500 }
      );
    }

    if (json !== expectedCount) {
      return NextResponse.json(
        {
          success: false,
          message: `Likes count mismatch for seeded post.`,
          data: { postId: seededPostId, expected: expectedCount, actual: json },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Likes count verified for seeded post.",
      data: { postId: seededPostId, expected: expectedCount, actual: json },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
