import { NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const rows = await sql`
      SELECT
        ${id}::text AS "userId",
        COALESCE(
          ARRAY_AGG(follower_id::text ORDER BY follower_id)
          FILTER (WHERE follower_id IS NOT NULL),
          '{}'
        ) AS "followers"
      FROM followers  
      WHERE user_id = ${id}::uuid   
    `;

    const doc = {
      userId: String(id),
      followers: rows.length ? rows[0].followers : [],
    };

    return NextResponse.json([doc], { status: 200 });
  } catch (err) {
    console.error("GET followers by id error:", err);
    return NextResponse.json({ error: "Failed to fetch user followers" }, { status: 500 });
  }
}
