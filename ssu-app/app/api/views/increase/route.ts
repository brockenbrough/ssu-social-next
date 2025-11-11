import { NextResponse } from "next/server";
 
import { corsHeaders } from "@/utilities/cors";

import sql from "@/utilities/db";

// CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const { userId, postId } = await req.json();

    if (!userId || !postId) {
      return new Response(null, { status: 400, headers: corsHeaders });
    }

    const uuidRegex = /^[0-9a-fA-F-]{36}$/;
    if (!uuidRegex.test(userId) || !uuidRegex.test(postId)) {
      return new Response(null, { status: 400, headers: corsHeaders });
    }

    // check existing
    const existing = await sql`
      SELECT 1 FROM views WHERE user_id = ${userId} AND post_id = ${postId}
    `;

    if (existing.length === 0) {
      await sql`
        INSERT INTO views (user_id, post_id)
        VALUES (${userId}, ${postId})
      `;
    }

    // ✅ mimic MongoDB (return 200 with NO body)
    return new Response(null, { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error("Error adding view:", error);
    return new Response(null, { status: 500, headers: corsHeaders });
  }
}
