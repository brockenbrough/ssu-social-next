import { NextResponse } from "next/server";

export async function GET() {
  try {
    const testUserId = "11111111-1111-1111-1111-111111111111";
    const expectedFollowees = [
      "22222222-2222-2222-2222-222222222222",
      "33333333-3333-3333-3333-333333333333",
    ];

    // Fetch the /[id] following route
    const res = await fetch(`http://localhost:3000/api/following/${testUserId}`);
    const json = await res.json();

    // Validate response structure
    if (!json.success || !Array.isArray(json.data?.following)) {
      return NextResponse.json(
        {
          success: false,
          message: "Unexpected response structure from /[id] route",
          data: json,
        },
        { status: 500 }
      );
    }

    const following = json.data.following;

    // Check if all expected followees are present
    const missing = expectedFollowees.filter(id => !following.includes(id));

    if (missing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Test user exists but does not follow expected user(s).",
          data: { userId: testUserId, following },
        },
        { status: 500 }
      );
    }

    // All expected followees are present
    return NextResponse.json({
      success: true,
      message: "Following list retrieved successfully",
      data: { following },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}