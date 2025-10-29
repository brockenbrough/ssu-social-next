import { NextResponse } from "next/server";
import { corsHeaders } from "@/utilities/cors";

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function GET() {
  try {
    const testUserId = "33333333-3333-3333-3333-333333333333";
    const expectedFollowers = [
      "11111111-1111-1111-1111-111111111111",
      "22222222-2222-2222-2222-222222222222",
    ];

    const res = await fetch(`http://localhost:3000/api/followers/${testUserId}`);
    const json = await res.json();

    if (!json?.success || !Array.isArray(json?.data?.followers)) {
      return NextResponse.json(
        {
          success: false,
          message: "Unexpected response shape from /followers/[id]",
          data: json,
        },
        { status: 500, headers: corsHeaders }
      );
    }

    const followers: string[] = json.data.followers;
    const missing = expectedFollowers.filter((id) => !followers.includes(id));

    if (missing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing expected follower(s).",
          data: { userId: testUserId, followers, missing },
        },
        { status: 500, headers: corsHeaders }
      );
    }

    const bad = await fetch(`http://localhost:3000/api/followers/not-a-uuid`);
    if (bad.status !== 400) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid-UUID request did not return 400.",
          data: { status: bad.status },
        },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Followers [id] endpoint verified",
        data: { userId: testUserId, followers },
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message ?? String(err) },
      { status: 500, headers: corsHeaders }
    );
  }
}
