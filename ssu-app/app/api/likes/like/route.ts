import { NextResponse } from "next/server";
import postgres from "postgres";
import { corsHeaders } from "@/utilities/cors";


const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, postId } = body;

    if (!userId || !postId) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: userId or postId" },
        { status: 400 }
      );
    }

    const inserted = await sql<[]>`
      INSERT INTO likes (
        user_id,
        post_id,
        created_at
      )
      VALUES (
        ${userId}::uuid,
        ${postId}::uuid,
        NOW()
      )
      RETURNING  user_id, post_id, created_at
    `;

    return NextResponse.json({
      success: true,
      message: "Post Liked.",
      data: inserted[0],
    }, 
    { status: 200, headers: corsHeaders
    });
  } catch (err: any) {
    console.error("Couldn't like post, error:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
