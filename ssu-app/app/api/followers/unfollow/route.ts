import { NextResponse } from "next/server";
import postgres from "postgres";
import { corsHeaders } from "@/utilities/cors";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });
const UUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

async function resolveUser(input: string) {
  const v = input.trim();
  const column = UUID_RE.test(v) ? "user_id" : "username";
  const rows = await sql<{ user_id: string; username: string }[]>`
    SELECT user_id::text, username FROM ssu_users WHERE ${sql(column)} = ${v} LIMIT 1
  `;
  if (!rows.length) throw new Error(`User not found: ${v}`);
  return rows[0];
}

export async function POST(req: Request) {
  try {
    const { userId, targetUserId } = await req.json();

    if (!userId || !targetUserId)
      return NextResponse.json({ success: false, error: "Missing parameters" },
                               { status: 400, headers: corsHeaders });

    const follower = await resolveUser(userId);
    const user = await resolveUser(targetUserId);

    const res = await sql`
      DELETE FROM followers
      WHERE user_id = ${user.user_id}::uuid
        AND follower_id = ${follower.user_id}::uuid
    `;
    const removed = (res as any)?.count ?? 0;

    const msg =
      removed === 0
        ? `${follower.username} was not following ${user.username}`
        : `${follower.username} unfollowed ${user.username}`;

    return NextResponse.json({ success: true, message: msg },
                             { status: 200, headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message },
                             { status: 500, headers: corsHeaders });
  }
}
