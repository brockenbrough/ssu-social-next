import { NextResponse } from "next/server";
 

import sql from "@/utilities/db";

type ApiLike = {
  user_id: string;
  post_id: string;
  created_at: string | Date;
};

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }   // NOTE: params is a Promise now
) {
  try {
    const { id } = await ctx.params;

    if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    const rows = await sql<ApiLike[]>`
      SELECT
        user_id::text            AS "user_id",
        post_id::text            AS "post_id",
        created_at               AS "created_at"
      FROM likes
      WHERE user_id = ${id}::uuid
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = { ...rows[0], password: null }; // redact password
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}