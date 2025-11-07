import { NextResponse } from "next/server";
 
import { corsHeaders } from "@/utilities/cors";

import sql from "@/utilities/db";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await ctx.params;

    if (!username || typeof username !== "string" || !username.trim()) {
      return NextResponse.json({ message: "username is required." }, { status: 400 });
    }

    const ident = username.trim();
    const isUuid = /^[0-9a-fA-F-]{36}$/.test(ident);

    let rows: { count: number }[];

    if (isUuid) {
      // Count likes made by the user (identified by UUID)
      rows = await sql<{ count: number }[]>`
        SELECT COUNT(*)::int AS count
        FROM likes l
        WHERE l.user_id = ${ident}::uuid
      `;
      
    } else {
      // Count likes made by the user (identified by username)
      rows = await sql<{ count: number }[]>`
        SELECT COUNT(*)::int AS count
        FROM likes l
        JOIN ssu_users u ON u.user_id = l.user_id
        WHERE u.username = ${ident}
      `;
      // If duplicates are possible, use COUNT(DISTINCT l.post_id) instead.
    }

    const likedCount = rows?.[0]?.count ?? 0;
    return NextResponse.json(likedCount, { status: 200 });
  } catch (err) {
    console.error("Error counting likes made by user:", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}