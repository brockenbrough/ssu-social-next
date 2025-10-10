// app/api/Views/GetViews/[postId]/route.ts
import { NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ postId: string }> }   // ✅ make params a Promise
) {
  try {
    const { postId } = await ctx.params;         // ✅ same pattern as GetUser

    // Optional: sanity-check postId format
    if (!/^[0-9a-fA-F-]{36}$/.test(postId)) {
      return NextResponse.json({ error: "Invalid post id" }, { status: 400 });
    }

    const [row] = await sql<{ viewcount: number }[]>`
      SELECT COUNT(DISTINCT user_id)::int AS viewCount
      FROM views
      WHERE post_id = ${postId};
    `;

    return NextResponse.json({ viewCount: row?.viewcount ?? 0 }, { status: 200 });
  } catch (error) {
    console.error("Error fetching view count:", error);
    return NextResponse.json(
      { error: "Failed to fetch view count", details: (error as any).message },
      { status: 500 }
    );
  }
}
