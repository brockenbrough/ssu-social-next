// app/api/posts/getpostpagebyusername/route.ts
import { NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function GET(
  _req: Request,
  ctx: { params?: any; searchParams?: URLSearchParams }
) {
  try {
    const { searchParams } = new URL(_req.url);
    const INITIAL_PAGE = 1;
    const DEFAULT_POSTS_PER_PAGE = 10;

    const page = parseInt(searchParams.get("page") || `${INITIAL_PAGE}`);
    const postsPerPage = parseInt(
      searchParams.get("postPerPage") || `${DEFAULT_POSTS_PER_PAGE}`
    );

    // Get the username from dynamic param
    const username = searchParams.get("username") || null;
    if (!username) {
      return NextResponse.json(
        { success: false, message: "username is required" },
        { status: 400 }
      );
    }

    const offset = (page - 1) * postsPerPage;

    // Join users and posts tables to get user posts
    const posts = await sql`
      SELECT p.post_id, p.user_id, p.content, p.created_at
      FROM posts p
      INNER JOIN ssu_users u ON p.user_id = u.user_id
      WHERE u.username = ${username}
      ORDER BY p.created_at DESC
      OFFSET ${offset} LIMIT ${postsPerPage}
    `;

    return NextResponse.json(
      { success: true, username, page, postsPerPage, data: posts },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching posts by username:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error fetching posts by username",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
