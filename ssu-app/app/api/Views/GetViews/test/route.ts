import { NextResponse } from "next/server";

const TEST_POST_ID = "33333333-3333-3333-3333-333333333333";

export async function GET() {
  try {
    // Call the route being tested
    const res = await fetch(`http://localhost:3000/api/Views/GetViews/${TEST_POST_ID}`);
    const data = await res.json();

    // Check for successful response and valid structure
    if (res.status === 200 && typeof data.viewCount === "number") {
      // Verify seeded data (optional: expects post has at least 1 view)
      const hasSeedView = data.viewCount > 0;

      if (hasSeedView) {
        return NextResponse.json({
          success: true,
          message:
            "Route returned expected 200 OK with valid view count for seeded post.",
          data,
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            message:
              "Route responded 200 OK but returned viewCount = 0 — no seeded views detected.",
            data,
          },
          { status: 500 }
        );
      }
    } else {
      // Unexpected structure or status
      return NextResponse.json(
        {
          success: false,
          message: `Unexpected response (status ${res.status}) or invalid data structure.`,
          data,
        },
        { status: res.status }
      );
    }
  } catch (err: any) {
    // Top-level error handler
    return NextResponse.json(
      { success: false, message: err.message ?? "Unknown error during test" },
      { status: 500 }
    );
  }
}
