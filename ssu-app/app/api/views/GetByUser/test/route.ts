import { NextResponse } from "next/server";

const TEST_USER_ID = "33333333-3333-3333-3333-333333333333"; // Seeded user who has viewed posts

export async function GET() {
  try {
    // Call the route being tested
    const res = await fetch(`http://localhost:3000/api/views/GetByUser/${TEST_USER_ID}`);
    const data = await res.json();

    // Check for successful responses and expected structure
    if (res.status === 200 && Array.isArray(data.views)) {
      const hasViews = data.views.length > 0;

      if (hasViews) {
        return NextResponse.json({
          success: true,
          message: "✅ Route /api/Views/GetByUser/:userId returned valid data with existing views.",
          data,
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            message:
              "⚠️ Route responded 200 OK but returned an empty views array — no seeded data found.",
            data,
          },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          message: `❌ Unexpected response (status ${res.status}) or invalid structure.`,
          data,
        },
        { status: res.status }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err.message ?? "❌ Unknown error during test execution.",
      },
      { status: 500 }
    );
  }
}
