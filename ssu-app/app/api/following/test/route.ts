// app/api/following/test/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Test data using fixed IDs from your schema_load.sql
    const testUserId = "11111111-1111-1111-1111-111111111111"; // fixed_user_id1
    const expectedFollowing = ["22222222-2222-2222-2222-222222222222"]; // IDs that user1 is following

    // --- Test /api/following (all users) ---
    const allRes = await fetch("http://localhost:3000/api/following");
    const allData = await allRes.json();

    if (allRes.status !== 200 || !Array.isArray(allData)) {
      return NextResponse.json(
        { success: false, message: "Failed to fetch all following" },
        { status: 500 }
      );
    }

    // Check that testUserId exists in allData
    const userRow = allData.find((u: any) => u.userId === testUserId);
    if (!userRow) {
      return NextResponse.json(
        { success: false, message: `User ${testUserId} not found in all following` },
        { status: 500 }
      );
    }

    // Check that following array matches expected
    const followingMatches =
      Array.isArray(userRow.following) &&
      expectedFollowing.every((id) => userRow.following.includes(id));

    if (!followingMatches) {
      return NextResponse.json(
        { success: false, message: `Following list does not match expected`, userRow },
        { status: 500 }
      );
    }

    // --- Test /api/following/[id] ---
    const idRes = await fetch(`http://localhost:3000/api/following/${testUserId}`);
    const idData = await idRes.json();

    if (
      idRes.status !== 200 ||
      idData.userId !== testUserId ||
      !Array.isArray(idData.following)
    ) {
      return NextResponse.json(
        { success: false, message: `/[id] route returned unexpected structure`, idData },
        { status: 500 }
      );
    }

    const followingMatchesIdRoute =
      expectedFollowing.every((id) => idData.following.includes(id));

    if (!followingMatchesIdRoute) {
      return NextResponse.json(
        { success: false, message: `Following list in /[id] does not match expected`, idData },
        { status: 500 }
      );
    }

    // If all tests pass
    return NextResponse.json({
      success: true,
      message: "All /following routes returned expected data",
      allData,
      idData,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}