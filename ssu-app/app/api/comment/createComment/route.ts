// create a comment

import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";
import { corsHeaders } from "@/utilities/cors";  //Just add this line 

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

type CreateCommentRequest = {
  commentContent: string;
  postId: string;
  userId: string;
};


// POST /api/comments
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateCommentRequest;
    const { commentContent, postId, userId } = body;

    if (!commentContent || !postId || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Insert comment
    const [newComment] = await sql`
      INSERT INTO comments (user_id, post_id, comment_content)
      VALUES (${userId}, ${postId}, ${commentContent})
      RETURNING
        comment_id::text      AS "_id",
        user_id::text         AS "userId",
        comment_content       AS "commentContent",
        created_at            AS "date",
        post_id::text         AS "postId";
    `;

    // Fetch username for the response
    const [user] = await sql`
      SELECT username FROM ssu_users WHERE user_id = ${userId}
    `;

    return NextResponse.json(
      {
        msg: "Comment created successfully",
        newComment: {
          ...newComment,
          username: user?.username || "Unknown",
          replies: [],
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
