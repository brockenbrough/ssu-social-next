import { NextResponse } from "next/server";
import postgres from "postgres";
import { corsHeaders } from "@/utilities/cors";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

type ApiLike = {
  user_id: string;
  post_id: string;
  created_at: string | Date;
};

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> } // NOTE: params is a Promise now
) {
  try {
    const { id } = await ctx.params;

    if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
      return NextResponse.json({ error: "Invalid post id" }, { status: 400 });
    }

    const rows = await sql<ApiLike[]>`
      SELECT
        user_id::text            AS "user_id",
        post_id::text            AS "post_id",
        created_at               AS "created_at"
      FROM likes
      WHERE post_id = ${id}::uuid
    `;

    // Always return an array so the client can forEach safely
    return NextResponse.json(rows, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}
