// app/api/Posts/GetPostPage/route.ts
import { NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const INITIAL_PAGE = 1;
    const DEFAULT_POSTS_PER_PAGE = 10;

    const page = parseInt(searchParams.get("page") || `${INITIAL_PAGE}`);
    const postsPerPage = parseInt(searchParams.get("postPerPage") || `${DEFAULT_POSTS_PER_PAGE}`);

    const offset = (page - 1) * postsPerPage;

    // Retrieve paginated posts
    const posts = await sql`
      SELECT post_id, user_id, content, created_at
      FROM posts
      ORDER BY created_at DESC
      OFFSET ${offset} LIMIT ${postsPerPage}
    `;

    return NextResponse.json({ success: true, page, postsPerPage, data: posts }, { status: 200 });
  } catch (err: any) {
    console.error("Error fetching posts:", err);
    return NextResponse.json(
      { success: false, message: "Error fetching posts", error: err.message },
      { status: 500 }
    );
  }
}
