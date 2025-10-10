import { NextResponse } from "next/server";

export async function GET() {
  try {
    // ---- Configure these to match your seed data ----
    const testUserId = "33333333-3333-3333-3333-333333333333"; // user being followed by others
    const expectedFollowers = [
      "11111111-1111-1111-1111-111111111111",
      "22222222-2222-2222-2222-222222222222",
    ];
    // -------------------------------------------------

    // Hit your /followers/[id] route
    const res = await fetch(`http://localhost:3000/api/followers/${testUserId}`);
    const json = await res.json();

    // Validate response structure (expects: { success, data: { followers: [...] } })
    if (!json?.success || !Array.isArray(json?.data?.followers)) {
      return NextResponse.json(
        {
          success: false,
          message: "Unexpected response structure from /followers/[id] route",
          data: json,
        },
        { status: 500 }
      );
    }

    const followers: string[] = json.data.followers;

    // Ensure all expected followers are present
    const missing = expectedFollowers.filter((id) => !followers.includes(id));
    if (missing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Target user exists but does not have all expected follower(s).",
          data: { userId: testUserId, followers, missing },
        },
        { status: 500 }
      );
    }

    // All good
    return NextResponse.json({
      success: true,
      message: "Followers list retrieved successfully",
      data: { userId: testUserId, followers },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
