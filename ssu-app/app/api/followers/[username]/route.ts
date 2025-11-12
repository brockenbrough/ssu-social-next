import { NextResponse } from "next/server";
import sql from "@/utilities/db";
import { corsHeaders } from "@/utilities/cors";

type Row = { username: string; followers: string[] };
const UUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// Accepts either username or UUID in the [username] segment for compatibility
export async function GET(_req: Request, ctx: { params: { username: string } }) {
  const key = (ctx?.params?.username ?? "").trim();
  if (!key) {
    return NextResponse.json([{ username: "", followers: [] }], {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const rows = await sql<Row[]>`
      WITH target AS (
        SELECT u.user_id, u.username
        FROM ssu_users u
        WHERE ${UUID_RE.test(key) ? sql`u.user_id::text = ${key}` : sql`u.username = ${key}`}
        LIMIT 1
      )
      SELECT
        t.username AS "username",
        COALESCE(
          ARRAY_AGG(fu.username ORDER BY fu.username)
            FILTER (WHERE fu.username IS NOT NULL),
          '{}'::text[]
        ) AS "followers"
      FROM target t
      LEFT JOIN followers f ON f.user_id = t.user_id
      LEFT JOIN ssu_users fu ON fu.user_id = f.follower_id
      GROUP BY t.username
    `;

    // Stable shape: if user missing, still return array with empty followers
    if (rows.length === 0) {
      return NextResponse.json([{ username: key, followers: [] }], {
        status: 200,
        headers: corsHeaders,
      });
    }

    return NextResponse.json(rows, { status: 200, headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json([{ username: key, followers: [] }], {
      status: 200,
      headers: corsHeaders,
    });
  }
}
