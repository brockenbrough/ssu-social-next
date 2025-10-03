import { NextResponse, type NextRequest } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/followers/[id]">) {
  const { id } = await ctx.params; // 👈 params is a Promise in Next 15

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
    userId: id,
    followers: rows[0]?.followers ?? [],
  };

  return NextResponse.json([doc], { status: 200 });
}

