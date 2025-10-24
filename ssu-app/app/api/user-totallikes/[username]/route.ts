import { NextResponse } from "next/server";
import postgres from "postgres";
import { corsHeaders } from "@/utilities/cors";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

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
      rows = await sql<{ count: number }[]>`
        SELECT COUNT(*)::int AS count
        FROM likes l
        JOIN posts p ON p.post_id = l.post_id
        WHERE p.user_id = ${ident}::uuid
      `;
    } else {
      rows = await sql<{ count: number }[]>`
        SELECT COUNT(*)::int AS count
        FROM likes l
        JOIN posts p ON p.post_id = l.post_id
        JOIN ssu_users u ON u.user_id = p.user_id
        WHERE u.username = ${ident}
      `;
    }

    const totalLikes = rows?.[0]?.count ?? 0;
    return NextResponse.json(totalLikes, { status: 200 });
  } catch (err) {
    console.error("Error counting total likes for user:", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}