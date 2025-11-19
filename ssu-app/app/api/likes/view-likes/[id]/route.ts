import { NextResponse } from "next/server";
import sql from "@/utilities/db";
import { corsHeaders } from "@/utilities/cors";


type LikeRow = {
  _id: string;
  user_id: string;
  post_id: string;
  username: string | null;
  profile_image: string | null;
  created_at: string | Date;
};

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> } // NOTE: params is a Promise now
) {
  try {
    const { id } = await ctx.params;

    if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
      return NextResponse.json({ error: "Invalid post id" }, { status: 400, headers: corsHeaders });
    }

    const rows = await sql<LikeRow[]>`
      SELECT
        (l.user_id::text || '-' || l.post_id::text) AS "_id",
        l.user_id::text                             AS "user_id",
        l.post_id::text                             AS "post_id",
        u.username                                  AS "username",
        u.profile_image                             AS "profile_image",
        l.created_at                                AS "created_at"
      FROM likes l
      LEFT JOIN ssu_users u
        ON u.user_id = l.user_id
      WHERE l.post_id = ${id}::uuid
      ORDER BY l.created_at DESC
    `;

    const likes = rows.map((row) => ({
      _id: row._id,
      user_id: row.user_id,
      post_id: row.post_id,
      username: row.username ?? null,
      profileImage: row.profile_image ?? null,
      created_at: row.created_at,
    }));

    return NextResponse.json(likes, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Error fetching likes list:", error);
    return NextResponse.json(
      { error: "Failed to fetch likes list" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}
