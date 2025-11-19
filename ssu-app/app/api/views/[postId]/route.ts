import { NextResponse } from "next/server";
import sql from "@/utilities/db";
import { corsHeaders } from "@/utilities/cors"; 

// Preflight
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function GET(_req: Request, ctx: { params: Promise<{ postId: string }> }) {
  try {
    const { postId } = await ctx.params;

    // ✅ Validate UUID
    if (!/^[0-9a-fA-F-]{36}$/.test(postId)) {
      return NextResponse.json(
        { message: "Invalid post id" },
        { status: 400, headers: corsHeaders }
      );
    }

    // ✅ Match Mongo behavior (only count views)
    const [row] = await sql<{ viewcount: number }[]>`
      SELECT COUNT(*)::int AS viewCount
      FROM views
      WHERE post_id = ${postId};
    `;

    return NextResponse.json(
      { viewCount: row?.viewcount ?? 0 },
      { status: 200, headers: corsHeaders }
    );

  } catch (error: any) {
    console.error("Error fetching view count:", error);
    return NextResponse.json(
      { message: "Server error. Could not retrieve view count.", error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
