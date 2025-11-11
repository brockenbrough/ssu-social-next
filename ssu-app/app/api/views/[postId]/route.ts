import { NextResponse } from "next/server";
import sql from "@/utilities/db";
import { corsHeaders } from "@/utilities/cors";

// CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function GET(_req: Request, ctx: { params: Promise<{ postId: string }> }) {
  try {
    const { postId } = await ctx.params;

    // Validate UUID format
    if (!/^[0-9a-fA-F-]{36}$/.test(postId)) {
      return NextResponse.json(
        { error: "Invalid post id" },
        { status: 400, headers: corsHeaders }
      );
    }

    // ✅ Return rows just like Mongo (array for .length)
    const views = await sql`
      SELECT 
        user_id AS userId,
        post_id AS postId,
        created_at AS createdAt  -- match Mongo timestamps
      FROM views
      WHERE post_id = ${postId};
    `;

    return NextResponse.json(views, {
      status: 200,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error("❌ Error fetching views:", error);
    return NextResponse.json(
      { error: "Failed to fetch views" },
      { status: 500, headers: corsHeaders }
    );
  }
}
