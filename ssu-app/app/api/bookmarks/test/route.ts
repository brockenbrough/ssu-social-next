import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Call the route being tested
    const res = await fetch("http://localhost:3000/api/bookmarks");
    const data = await res.json();

    // Check status code and expected structure
    if (res.status === 200 && Array.isArray(data)) {
      // Verify the presence of the seeded bookmark from schema_load.sql
      const hasSeedBookmark = data.some(
        (b: any) =>
          b.bookmark_id === "44444444-4444-4444-4444-444444444444" &&
          b.user_id === "22222222-2222-2222-2222-222222222222" &&
          b.post_id === "33333333-3333-3333-3333-333333333333" &&
          b.is_public === true
      );

      if (hasSeedBookmark) {
        return NextResponse.json({
          success: true,
          message: "Route returned expected 200 OK with seeded bookmark.",
          data,
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            message:
              "Route responded but did not contain expected seeded bookmark.",
            data,
          },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          message: `Unexpected status: ${res.status}`,
          data,
        },
        { status: res.status }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}


