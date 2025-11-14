import { NextResponse } from "next/server";
import sql from "@/utilities/db";
import { corsHeaders } from "@/utilities/cors";

// Expected response row type
type Row = { username: string; followers: string[] };

// UUID format for validation (both uppercase and lowercase)
const UUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

// Handle preflight (CORS)
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// GET /api/followers/[username]
// Supports both username and UUID for compatibility
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> } // In Next.js 15+, params must be awaited
) {
  // Await the params Promise
  const { username: raw } = await params;
  const key = (raw ?? "").trim();

  // If no key provided, return stable empty shape
  if (!key) {
    return NextResponse.json([{ username: "", followers: [] }], {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Select user info (by UUID or username)
    const rows = await sql<Row[]>`
      WITH target AS (
        SELECT u.user_id, u.username
        FROM ssu_users u
        WHERE ${
          UUID_RE.test(key)
            ? sql`u.user_id::text = ${key}`
            : sql`u.username = ${key}`
        }
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

    // Always return a consistent array shape, even if user not found
    if (rows.length === 0) {
      return NextResponse.json([{ username: key, followers: [] }], {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Return followers list
    return NextResponse.json(rows, { status: 200, headers: corsHeaders });
  } catch (err: any) {
    console.error("Error fetching followers:", err);
    // On error, still return stable structure (to prevent frontend crash)
    return NextResponse.json([{ username: key, followers: [] }], {
      status: 200,
      headers: corsHeaders,
    });
  }
}
