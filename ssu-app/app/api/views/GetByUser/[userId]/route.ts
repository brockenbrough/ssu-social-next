import { NextResponse } from "next/server";
 
import { corsHeaders } from "@/utilities/cors"; 

import sql from "@/utilities/db";

// Allow preflight CORS requests
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function GET(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;

    // ✅ Basic sanity check for UUID format
    if (!/^[0-9a-fA-F-]{36}$/.test(userId)) {
      return NextResponse.json(
        { error: "Invalid userId format" },
        { status: 400, headers: corsHeaders }
      );
    }

    // ✅ Fetch all posts viewed by this user
    const results = await sql`
      SELECT 
        v.post_id::text,
        p.content AS post_content,
        p.user_id::text AS author_id,
        u.username AS author_username,
        v.created_at
      FROM views v
      JOIN posts p ON v.post_id = p.post_id
      JOIN ssu_users u ON p.user_id = u.user_id
      WHERE v.user_id = ${userId}
      ORDER BY v.created_at DESC;
    `;

    if (results.length === 0) {
      return NextResponse.json(
        { message: "No views found for this user.", views: [] },
        { status: 200, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { message: "Views retrieved successfully.", views: results },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("Error fetching user views:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch views",
        details: error.message,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
