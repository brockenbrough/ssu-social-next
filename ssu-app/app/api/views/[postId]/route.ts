import { NextResponse } from "next/server";
import postgres from "postgres";
import { corsHeaders } from "@/utilities/cors";

import sql from "@/utilities/db";

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await ctx.params;

    // ✅ Validate UUID
    if (!/^[0-9a-fA-F-]{36}$/.test(postId)) {
      return NextResponse.json(
        { error: "Invalid post id" },
        { status: 400, headers: corsHeaders }
      );
    }

    // ✅ Return full array like Mongo API did
    const views = await sql`
      SELECT user_id, post_id, viewed_at
      FROM views
      WHERE post_id = ${postId};
    `;

    return NextResponse.json(views, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error: any) {
    console.error("❌ Error fetching views:", error);
    return NextResponse.json(
      { error: "Failed to fetch views", details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
