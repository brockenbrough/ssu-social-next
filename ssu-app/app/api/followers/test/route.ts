// app/api/test/route.ts
import { NextResponse } from "next/server";
import { corsHeaders } from "@/utilities/cors";

const BASE = "http://localhost:3000"; // change to your actual API port if needed
const JSON_HEADERS = {
  "Content-Type": "application/json",
  ...corsHeaders,
};

type FollowersRow = {
  username: string;
  followers: string[];
};

export async function GET() {
  try {
    // --- Constants based on seed data ---
    const targetUsername = "test_user2"; // user being followed
    const followerUsername = "test_user1"; // user who follows (we’ll unfollow and re-follow)
    const expectedFollowers = ["test_user1", "test_user3"]; // expected initial followers

    // ---------- 1) Verify GET /api/followers returns aggregated usernames ----------
    const aggRes = await fetch(`${BASE}/api/followers`, { headers: corsHeaders });
    if (!aggRes.ok) {
      return NextResponse.json(
        { success: false, message: "GET /api/followers returned non-OK", data: { status: aggRes.status } },
        { status: 500, headers: corsHeaders }
      );
    }
    const aggJson = (await aggRes.json()) as FollowersRow[];
    if (!Array.isArray(aggJson)) {
      return NextResponse.json(
        { success: false, message: "GET /api/followers returned non-array payload", data: aggJson },
        { status: 500, headers: corsHeaders }
      );
    }

    const targetRow = aggJson.find((r) => r.username === targetUsername);
    if (!targetRow || !Array.isArray(targetRow.followers)) {
      return NextResponse.json(
        { success: false, message: `User ${targetUsername} not found in aggregated followers`, data: aggJson },
        { status: 500, headers: corsHeaders }
      );
    }

    // Ensure all expected followers exist initially
    const missingInitial = expectedFollowers.filter((u) => !targetRow.followers.includes(u));
    if (missingInitial.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing expected follower(s) in initial state",
          data: { username: targetUsername, followers: targetRow.followers, missing: missingInitial },
        },
        { status: 500, headers: corsHeaders }
      );
    }

    // ---------- 2) UNFOLLOW (test_user1 -> test_user2) ----------
    const unfollowRes = await fetch(`${BASE}/api/followers/unfollow`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ userId: followerUsername, targetUserId: targetUsername }),
    });
    if (!unfollowRes.ok) {
      const body = await unfollowRes.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: "Unfollow returned non-OK", data: { status: unfollowRes.status, body } },
        { status: 500, headers: corsHeaders }
      );
    }
    const unfollowJson = await unfollowRes.json().catch(() => ({} as any));
    if (!unfollowJson?.success) {
      return NextResponse.json(
        { success: false, message: "Unfollow did not return success:true", data: unfollowJson },
        { status: 500, headers: corsHeaders }
      );
    }

    // ---------- 3) Check that test_user1 was removed from followers of test_user2 ----------
    const afterUnfRes = await fetch(`${BASE}/api/followers`, { headers: corsHeaders });
    const afterUnfJson = (await afterUnfRes.json()) as FollowersRow[];
    const targetAfterUnf = afterUnfJson.find((r) => r.username === targetUsername);
    if (!targetAfterUnf || targetAfterUnf.followers.includes(followerUsername)) {
      return NextResponse.json(
        {
          success: false,
          message: "After unfollow, follower still present",
          data: { username: targetUsername, followers: targetAfterUnf?.followers ?? [] },
        },
        { status: 500, headers: corsHeaders }
      );
    }

    // ---------- 4) FOLLOW again (restore the relation) ----------
    const followRes = await fetch(`${BASE}/api/followers/follow`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ userId: followerUsername, targetUserId: targetUsername }),
    });
    if (!followRes.ok) {
      const body = await followRes.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: "Follow returned non-OK", data: { status: followRes.status, body } },
        { status: 500, headers: corsHeaders }
      );
    }
    const followJson = await followRes.json().catch(() => ({} as any));
    if (!followJson?.success) {
      return NextResponse.json(
        { success: false, message: "Follow did not return success:true", data: followJson },
        { status: 500, headers: corsHeaders }
      );
    }

    // ---------- 5) Verify test_user1 is back among followers of test_user2 ----------
    const finalRes = await fetch(`${BASE}/api/followers`, { headers: corsHeaders });
    const finalJson = (await finalRes.json()) as FollowersRow[];
    const targetFinal = finalJson.find((r) => r.username === targetUsername);

    if (!targetFinal || !targetFinal.followers.includes(followerUsername)) {
      return NextResponse.json(
        {
          success: false,
          message: "After re-follow, follower not found again",
          data: { username: targetUsername, followers: targetFinal?.followers ?? [] },
        },
        { status: 500, headers: corsHeaders }
      );
    }

    // ---------- 6) All checks passed ----------
    return NextResponse.json(
      {
        success: true,
        message: "Follow/Unfollow flow verified successfully.",
        data: { username: targetUsername, followers: targetFinal.followers },
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    // Handle runtime or network errors
    return NextResponse.json(
      { success: false, message: err?.message ?? String(err) },
      { status: 500, headers: corsHeaders }
    );
  }
}
