// app/api/followers/unfollow/test/route.ts

import { NextResponse } from "next/server";
import sql from "@/utilities/db";
import { corsHeaders } from "@/utilities/cors";

// Row shape returned from /api/followers/[username]
type FollowersRow = { username: string; followers: string[] };

/**
 * CORS preflight handler
 */
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

/**
 * GET /api/followers/unfollow/test
 *
 * Integration test for:
 *   DELETE /api/followers/unfollow
 *
 * Steps:
 *   1) Prepare DB: ensure test_user1 follows test_user2
 *   2) Confirm via GET /api/followers/test_user2 that test_user1 is in followers
 *   3) Call DELETE /api/followers/unfollow with body { userId: "test_user1", targetUserId: "test_user2" }
 *   4) Confirm test_user1 is no longer in followers of test_user2
 *   5) Call DELETE again and verify idempotence (removed = 0)
 */
export async function GET() {
  try {
    const baseUrl = "http://localhost:3000";

    // These values must match your seed script:
    const TEST_USER1_ID = "11111111-1111-1111-1111-111111111111"; // test_user1
    const TEST_USER2_ID = "22222222-2222-2222-2222-222222222222"; // test_user2
    const followerUsername = "test_user1";
    const targetUsername = "test_user2";

    // =====================================================
    // 1) Prepare DB: ensure test_user1 follows test_user2
    //    followers table: follower_id = test_user1, user_id = test_user2
    // =====================================================

    // Remove existing relation to avoid duplicates
    await sql`
      DELETE FROM followers
      WHERE user_id = ${TEST_USER2_ID}::uuid
        AND follower_id = ${TEST_USER1_ID}::uuid
    `;

    // Insert one clean relation
    await sql`
      INSERT INTO followers (user_id, follower_id, created_at)
      VALUES (${TEST_USER2_ID}::uuid, ${TEST_USER1_ID}::uuid, NOW())
    `;

    // =====================================================
    // 2) Check precondition via GET /api/followers/test_user2
    // =====================================================
    const beforeRes = await fetch(
      `${baseUrl}/api/followers/${encodeURIComponent(targetUsername)}`
    );
    const beforeJson = (await beforeRes.json()) as FollowersRow[] | any;

    if (!beforeRes.ok || !Array.isArray(beforeJson) || !beforeJson[0]?.followers) {
      return NextResponse.json(
        {
          success: false,
          step: "precondition GET /followers/[username]",
          message:
            "Unexpected response shape or status when checking initial followers.",
          data: { status: beforeRes.status, body: beforeJson },
        },
        { status: 500, headers: corsHeaders }
      );
    }

    const beforeFollowers: string[] = beforeJson[0].followers ?? [];
    if (!beforeFollowers.includes(followerUsername)) {
      return NextResponse.json(
        {
          success: false,
          step: "precondition validation",
          message:
            "Precondition failed: test_user1 is not a follower of test_user2 before unfollow.",
          data: { followers: beforeFollowers },
        },
        { status: 500, headers: corsHeaders }
      );
    }

    // =====================================================
    // 3) Call DELETE /api/followers/unfollow
    // =====================================================
    const unfollowRes = await fetch(`${baseUrl}/api/followers/unfollow`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: followerUsername,      // matches route.ts: can be username or UUID
        targetUserId: targetUsername,  // same
      }),
    });

    const unfollowJson = await unfollowRes.json().catch(() => null);

    if (!unfollowRes.ok || !unfollowJson?.ok) {
      return NextResponse.json(
        {
          success: false,
          step: "DELETE /followers/unfollow",
          message: "Unfollow operation returned error.",
          data: { status: unfollowRes.status, body: unfollowJson },
        },
        { status: 500, headers: corsHeaders }
      );
    }

    const removedFirst = typeof unfollowJson.removed === "number"
      ? unfollowJson.removed
      : parseInt(String(unfollowJson.removed ?? "0"), 10);

    if (removedFirst !== 1) {
      return NextResponse.json(
        {
          success: false,
          step: "DELETE /followers/unfollow first call",
          message: "Expected exactly 1 row removed on first unfollow call.",
          data: { removed: removedFirst },
        },
        { status: 500, headers: corsHeaders }
      );
    }

    // =====================================================
    // 4) Confirm that test_user1 is no longer a follower of test_user2
    // =====================================================
    const afterRes = await fetch(
      `${baseUrl}/api/followers/${encodeURIComponent(targetUsername)}`
    );
    const afterJson = (await afterRes.json()) as FollowersRow[] | any;

    if (!afterRes.ok || !Array.isArray(afterJson) || !afterJson[0]?.followers) {
      return NextResponse.json(
        {
          success: false,
          step: "post-unfollow GET /followers/[username]",
          message:
            "Unexpected response shape or status when checking followers after unfollow.",
          data: { status: afterRes.status, body: afterJson },
        },
        { status: 500, headers: corsHeaders }
      );
    }

    const afterFollowers: string[] = afterJson[0].followers ?? [];
    if (afterFollowers.includes(followerUsername)) {
      return NextResponse.json(
        {
          success: false,
          step: "post-unfollow validation",
          message:
            "test_user1 is still listed as follower of test_user2 after unfollow.",
          data: { followers: afterFollowers },
        },
        { status: 500, headers: corsHeaders }
      );
    }

    // =====================================================
    // 5) Call DELETE again – should be idempotent (removed = 0)
    // =====================================================
    const secondRes = await fetch(`${baseUrl}/api/followers/unfollow`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: followerUsername,
        targetUserId: targetUsername,
      }),
    });

    const secondJson = await secondRes.json().catch(() => null);

    if (!secondRes.ok || !secondJson?.ok) {
      return NextResponse.json(
        {
          success: false,
          step: "DELETE /followers/unfollow second call",
          message:
            "Second unfollow call should be ok (idempotent), but returned error.",
          data: { status: secondRes.status, body: secondJson },
        },
        { status: 500, headers: corsHeaders }
      );
    }

    const removedSecond = typeof secondJson.removed === "number"
      ? secondJson.removed
      : parseInt(String(secondJson.removed ?? "0"), 10);

    if (removedSecond !== 0) {
      return NextResponse.json(
        {
          success: false,
          step: "idempotence check",
          message: "Expected 0 rows removed on second unfollow call.",
          data: { removed: removedSecond },
        },
        { status: 500, headers: corsHeaders }
      );
    }

    // =====================================================
    // All checks passed
    // =====================================================
    return NextResponse.json(
      {
        success: true,
        message: "Unfollow endpoint passed all tests.",
        data: {
          follower: followerUsername,
          target: targetUsername,
          removedFirst,
          removedSecond,
        },
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err?.message ?? String(err),
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
