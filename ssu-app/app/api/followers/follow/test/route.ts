// app/api/followers/follow/test/route.ts

import { NextResponse } from "next/server";
import sql from "@/utilities/db";
import { corsHeaders } from "@/utilities/cors";

// Shape returned from /api/followers/[username]
type FollowersRow = { username: string; followers: string[] };

/**
 * CORS preflight handler
 */
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

/**
 * GET /api/followers/follow/test
 *
 * Integration test for:
 *   POST /api/followers/follow
 *
 * Steps:
 *   1) Ensure test_user1 is NOT following test_user2 (clean up DB).
 *   2) Confirm via GET /api/followers/test_user2 that test_user1 is not in followers.
 *   3) Call POST /api/followers/follow with { userId: "test_user1", targetUserId: "test_user2" }.
 *   4) Expect 201 + "Followed successfully".
 *   5) Confirm test_user1 is now in followers of test_user2.
 *   6) Call POST again → expect 200 + "Already following".
 */
export async function GET() {
  try {
    const baseUrl = "http://localhost:3000";

    // Must match your seed script
    const TEST_USER1_ID = "11111111-1111-1111-1111-111111111111"; // test_user1
    const TEST_USER2_ID = "22222222-2222-2222-2222-222222222222"; // test_user2
    const followerUsername = "test_user1";
    const targetUsername = "test_user2";

    // =====================================================
    // 1) Clean up: ensure test_user1 is NOT currently following test_user2
    // =====================================================
    await sql`
      DELETE FROM followers
      WHERE user_id = ${TEST_USER2_ID}::uuid
        AND follower_id = ${TEST_USER1_ID}::uuid
    `;

    // =====================================================
    // 2) Confirm precondition via GET /api/followers/test_user2
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
    if (beforeFollowers.includes(followerUsername)) {
      return NextResponse.json(
        {
          success: false,
          step: "precondition validation",
          message:
            "Precondition failed: test_user1 is still a follower of test_user2 before follow.",
          data: { followers: beforeFollowers },
        },
        { status: 500, headers: corsHeaders }
      );
    }

    // =====================================================
    // 3) First call: POST /api/followers/follow
    // =====================================================
    const followRes1 = await fetch(`${baseUrl}/api/followers/follow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // Your follow/route.ts expects these as usernames
        userId: followerUsername,
        targetUserId: targetUsername,
      }),
    });

    const followJson1 = await followRes1.json().catch(() => null);

    if (!followRes1.ok) {
      return NextResponse.json(
        {
          success: false,
          step: "POST /followers/follow (first)",
          message: "First follow call returned non-OK status.",
          data: { status: followRes1.status, body: followJson1 },
        },
        { status: 500, headers: corsHeaders }
      );
    }

    if (followRes1.status !== 201 || followJson1?.message !== "Followed successfully") {
      return NextResponse.json(
        {
          success: false,
          step: "POST /followers/follow (first) validation",
          message:
            'Expected status 201 and message "Followed successfully" on first call.',
          data: { status: followRes1.status, body: followJson1 },
        },
        { status: 500, headers: corsHeaders }
      );
    }

    // =====================================================
    // 4) Confirm that test_user1 is now a follower of test_user2
    // =====================================================
    const afterRes = await fetch(
      `${baseUrl}/api/followers/${encodeURIComponent(targetUsername)}`
    );
    const afterJson = (await afterRes.json()) as FollowersRow[] | any;

    if (!afterRes.ok || !Array.isArray(afterJson) || !afterJson[0]?.followers) {
      return NextResponse.json(
        {
          success: false,
          step: "post-follow GET /followers/[username]",
          message:
            "Unexpected response shape or status when checking followers after follow.",
          data: { status: afterRes.status, body: afterJson },
        },
        { status: 500, headers: corsHeaders }
      );
    }

    const afterFollowers: string[] = afterJson[0].followers ?? [];
    if (!afterFollowers.includes(followerUsername)) {
      return NextResponse.json(
        {
          success: false,
          step: "post-follow validation",
          message:
            "test_user1 is not listed as follower of test_user2 after follow.",
          data: { followers: afterFollowers },
        },
        { status: 500, headers: corsHeaders }
      );
    }

    // =====================================================
    // 5) Second call: should return "Already following" (idempotent behavior)
    // =====================================================
    const followRes2 = await fetch(`${baseUrl}/api/followers/follow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: followerUsername,
        targetUserId: targetUsername,
      }),
    });

    const followJson2 = await followRes2.json().catch(() => null);

    if (!followRes2.ok) {
      return NextResponse.json(
        {
          success: false,
          step: "POST /followers/follow (second)",
          message: "Second follow call returned non-OK status.",
          data: { status: followRes2.status, body: followJson2 },
        },
        { status: 500, headers: corsHeaders }
      );
    }

    if (
      followRes2.status !== 200 ||
      followJson2?.message !== "Already following"
    ) {
      return NextResponse.json(
        {
          success: false,
          step: "POST /followers/follow (second) validation",
          message:
            'Expected status 200 and message "Already following" on second call.',
          data: { status: followRes2.status, body: followJson2 },
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
        message: "Follow endpoint passed all tests.",
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
