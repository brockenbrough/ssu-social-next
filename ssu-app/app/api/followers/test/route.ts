import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Call the route being tested
    const res = await fetch("http://localhost:3000/api/followers");
    const data = await res.json();

    // Check status code and expected structure
    if (res.status === 200 && Array.isArray(data)) {
      // Verify presence of seeded relation (user2 → user1)
      const hasSeedFollower = data.some(
        (r: any) =>
          r.userId === "11111111-1111-1111-1111-111111111111" &&
          Array.isArray(r.followers) &&
          r.followers.includes("22222222-2222-2222-2222-222222222222")
      );

      if (hasSeedFollower) {
        return NextResponse.json({
          success: true,
          message:
            "Route returned expected 200 OK with seeded follower relation (user2 → user1).",
          data,
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            message:
              "Route responded but did not contain expected seeded follower relation (user2 → user1).",
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
      { success: false, message: err.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
