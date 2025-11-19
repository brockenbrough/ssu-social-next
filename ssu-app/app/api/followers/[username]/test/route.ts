// app/api/followers/[username]/test/route.ts

import { NextResponse } from "next/server";
import { corsHeaders } from "@/utilities/cors";

// Expected row type returned from /api/followers/[username]
type Row = { username: string; followers: string[] };

/**
 * CORS preflight handler
 */
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

/**
 * GET /api/followers/[username]/test
 *
 * This endpoint tests your existing:
 *   GET /api/followers/[username]
 *
 * It verifies:
 *  1) Response shape (array with { username, followers })
 *  2) For seeded users, that certain followers are present:
 *       - test_user1 -> test_user2, test_user3
 *       - test_user2 -> test_user1, test_user3
 *       - test_user3 -> test_user1, test_user2
 *     (Extra followers like "ksalaiev" are allowed; we only require these.)
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ username: string }> } // Next.js 15: params is a Promise
) {
  try {
    // Await params as required in Next.js 15+
    const { username } = await ctx.params;
    const key = (username ?? "").trim();

    if (!key) {
      return NextResponse.json(
        {
          success: false,
          message: "Username parameter is empty.",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const baseUrl = "http://localhost:3000";

    // Expected followers for seeded test users
    const expectations: Record<string, string[]> = {
      test_user1: ["test_user2", "test_user3"],
      test_user2: ["test_user1", "test_user3"],
      test_user3: ["test_user1", "test_user2"],
    };

    // Call the REAL endpoint we are testing
    const res = await fetch(
      `${baseUrl}/api/followers/${encodeURIComponent(key)}`
    );

    const json = (await res.json()) as Row[] | any;

    // Your real route returns something like:
    // [
    //   { username: "test_user1", followers: ["ksalaiev", "test_user2", "test_user3"] }
    // ]
    if (!res.ok || !Array.isArray(json) || !json[0]?.followers) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unexpected response structure or status from /api/followers/[username].",
          data: {
            status: res.status,
            body: json,
          },
        },
        { status: 500, headers: corsHeaders }
      );
    }

    const row = json[0] as Row;
    const followers = Array.isArray(row.followers) ? row.followers : [];

    // If there is no specific expectation for this username,
    // just return success + data (shape-only validation passed).
    if (!expectations[key]) {
      return NextResponse.json(
        {
          success: true,
          message:
            "Followers fetched successfully (no specific expectations for this username).",
          data: {
            username: row.username,
            followers,
          },
        },
        { status: 200, headers: corsHeaders }
      );
    }

    // Validate that all expected followers are present
    const expectedFollowers = expectations[key];
    const missing = expectedFollowers.filter(
      (name) => !followers.includes(name)
    );

    if (missing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing one or more expected followers.",
          data: {
            username: row.username,
            followers,
            expected: expectedFollowers,
            missing,
          },
        },
        { status: 500, headers: corsHeaders }
      );
    }

    // All checks passed
    return NextResponse.json(
      {
        success: true,
        message: "Followers endpoint passed for this username.",
        data: {
          username: row.username,
          followers,
          expected: expectedFollowers,
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
