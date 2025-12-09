// app/api/followers/unfollow/test/route.ts

import { NextResponse } from "next/server";
import sql from "@/utilities/db";
import { corsHeaders } from "@/utilities/cors";

// Response shape of GET /followers/[username]
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
 * Full integration test for:
 *   DELETE /api/followers/unfollow
 *
 * Steps:
 *   1) Clean: ensure test_user1 *IS* following test_user2.
 *   2) Validate precondition via GET /followers/[username].
 *   3) Call DELETE /followers/unfollow.
 *   4) Expect status 200 + success.
 *   5) Validate test_user1 is removed from followers.
 *   6) Call DELETE again → expect 404 (already unfollowed).
 */
export async function GET() {
  try {
    const baseUrl = "http://localhost:3000";

    // Must match seed or test DB setup
    const TEST_USER1_ID = "11111111-1111-1111-1111-111111111111"; // test_user1
    const TEST_USER2_ID = "22222222-2222-2222-2222-222222222222"; // test_user2

    const followerUsername = "test_user1";
    const targetUsername = "test_user2";

    // =====================================================
    // 1) Insert follower relationship → ensure precondition for unfollow
    // =====================================================
    await sql`
      DELETE FROM followers
      WHERE user_id = ${TEST_USER2_ID}::uuid
        AND follower_id = ${TEST_USER1_ID}::uuid
    `;

    await sql`
      INSERT INTO followers (user_id, follower_id, created_at)
      VALUES (${TEST_USER2_ID}::uuid, ${TEST_USER1_ID}::uuid, NOW())
    `;

    // =====================================================
    // 2) Confirm precondition via GET /followers/[username]
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
            "Precondition failed: test_user1 is NOT a follower of test_user2 before unfollow.",
          data: { followers: beforeFollowers },
        },
        { status: 500, headers: corsHeaders }
      );
    }

    // =====================================================
    // 3) First call: DELETE /api/followers/unfollow
    // =====================================================
    const unfollowRes1 = await fetch(`${baseUrl}/api/followers/unfollow`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // Unfollow route accepts both formats:
        // userId/targetUserId OR username/targetUsername
        userId: followerUsername,
        targetUserId: targetUsername,
      }),
    });

    const unfollowJson1 = await unfollowRes1.json().catch(() => null);

    if (!unfollowRes1.ok) {
      return NextResponse.json(
        {
          success: false,
          step: "DELETE /followers/unfollow (first call)",
          message: "First unfollow call returned non-OK status.",
          data: { status: unfollowRes1.status, body: unfollowJson1 },
        },
        { status: 500, headers: corsHeaders }
      );
    }

    if (
      unfollowRes1.status !== 200 ||
      unfollowJson1?.success !== true
    ) {
      return NextResponse.json(
        {
          success: false,
          step: "DELETE /followers/unfollow (first call) validation",
          message: "Expected status 200 + success: true on first unfollow.",
          data: { status: unfollowRes1.status, body: unfollowJson1 },
        },
        { status: 500, headers: corsHeaders }
      );
    }

    // =====================================================
    // 4) Confirm follower was removed
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
            "Follower still exists after unfollow — unfollow did not work.",
          data: { followers: afterFollowers },
        },
        { status: 500, headers: corsHeaders }
      );
    }

    // =====================================================
    // 5) Second call: should return "was not following" (idempotent behavior)
    // =====================================================
    const unfollowRes2 = await fetch(`${baseUrl}/api/followers/unfollow`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: followerUsername,
        targetUserId: targetUsername,
      }),
    });

    const unfollowJson2 = await unfollowRes2.json().catch(() => null);

    if (
      unfollowRes2.status !== 404 ||
      unfollowJson2?.message?.includes("was not following") !== true
    ) {
      return NextResponse.json(
        {
          success: false,
          step: "DELETE /followers/unfollow (second call)",
          message:
            'Expected 404 + "<user> was not following <user>" on second call.',
          data: { status: unfollowRes2.status, body: unfollowJson2 },
        },
        { status: 500, headers: corsHeaders }
      );
    }

    // =====================================================
    // ALL TESTS PASSED 🎉
    // =====================================================
    return NextResponse.json(
      {
        success: true,
        message: "Unfollow endpoint passed all tests.",
        data: {
          follower: followerUsername,
          target: targetUsername,
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
