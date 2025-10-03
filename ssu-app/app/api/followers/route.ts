import { NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function GET() {
  try {
    const rows = await sql`
      SELECT
        user_id::text AS "userId",
        COALESCE(
          ARRAY_AGG(follower_id::text ORDER BY follower_id)
          FILTER (WHERE follower_id IS NOT NULL),
          '{}'
        ) AS "followers"
      FROM followers  
      GROUP BY user_id
      ORDER BY user_id
    `;
    return NextResponse.json(rows, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: String((err as any)?.message ?? err) }, { status: 500 });
  }
}
