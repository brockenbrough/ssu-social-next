import { NextResponse } from "next/server";
import postgres from "postgres";
import { corsHeaders } from "@/utilities/cors"; // ✅ shared CORS headers

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

// ✅ Allow preflight CORS requests
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await ctx.params;

    if (!username) {
      return NextResponse.json(
        { success: false, message: "username is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const { searchParams } = new URL(req.url);
    const INITIAL_PAGE = 1;
    const DEFAULT_POSTS_PER_PAGE = 10;

    const page = parseInt(searchParams.get("page") || `${INITIAL_PAGE}`);
    const postsPerPage = parseInt(
      searchParams.get("postPerPage") || `${DEFAULT_POSTS_PER_PAGE}`
    );
    const offset = (page - 1) * postsPerPage;

    // ✅ SQL query matches Express route logic
    const posts = await sql`
      SELECT p.post_id, p.user_id, p.content, p.created_at, u.username
      FROM posts p
      JOIN ssu_users u ON p.user_id = u.user_id
      WHERE u.username = ${username}
      ORDER BY p.created_at DESC
      OFFSET ${offset} LIMIT ${postsPerPage};
    `;

    return NextResponse.json(
      { success: true, username, page, postsPerPage, data: posts },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("❌ Error fetching posts by username:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error fetching posts by username",
        error: error.message,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
