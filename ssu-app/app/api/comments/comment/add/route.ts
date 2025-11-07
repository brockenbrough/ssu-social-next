// create a comment

import { NextRequest, NextResponse } from "next/server";
 
import { corsHeaders } from "@/utilities/cors";  //Just add this line 

import { censorText } from "@/utilities/moderation";

import sql from "@/utilities/db";

type CreateCommentRequest = {
  commentContent: string;
  postId: string;
  userId: string;
};

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}



// POST /api/comments
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateCommentRequest;
    const { commentContent, postId, userId } = body;

    if (!commentContent || !postId || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400, headers: corsHeaders });
    }

    const { text: censoredContent, changed } = await censorText(commentContent);
    const hasOffensiveText = changed;

    // Insert comment
    const [newComment] = await sql`
      INSERT INTO comments (user_id, post_id, comment_content)
      VALUES (${userId}, ${postId}, ${censoredContent})
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
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500, headers: corsHeaders });
  }
}
