import { NextResponse } from "next/server";
import postgres from "postgres";
import { corsHeaders } from "@/utilities/cors";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

// Handle preflight (CORS)
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// GET /api/count/comment-for-posts/[postId]
export async function GET(
  req: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params;

    if (!postId || !/^[0-9a-fA-F-]{8}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{12}$/.test(postId)) {
      return NextResponse.json(
        { success: false, message: "Invalid or missing post ID" },
        { status: 400, headers: corsHeaders }
      );
    }

    // ✅ Count how many comments are tied to this post
    const [result] = await sql`
      SELECT COUNT(*)::int AS comment_count
      FROM comments
      WHERE post_id = ${postId}::uuid
    `;

    return NextResponse.json(
      {
        success: true,
        data: {
          postId,
          commentCount: result?.comment_count ?? 0,
        },
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
