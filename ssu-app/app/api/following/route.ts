import { NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function GET() {
  try {
    const rows = await sql`
      SELECT
        follower_id::text AS "userId",
        COALESCE(
          ARRAY_AGG(user_id::text ORDER BY user_id)
          FILTER (WHERE user_id IS NOT NULL),
          '{}'
        ) AS "following"
      FROM followers
      GROUP BY follower_id
      ORDER BY follower_id
    `;
    return NextResponse.json(rows, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: String((err as any)?.message ?? err) }, { status: 500 });
  }
}
