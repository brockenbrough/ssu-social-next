import { NextResponse } from "next/server";
import { corsHeaders } from "@/utilities/cors";  //Just add this line 

import sql from "@/utilities/db";

type ApiComment = {
  _id: string;
  userId: string;
  username: string;
  commentContent: string;
  replies: string[];
  date: string | Date;
  postId: string;
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

// Get all comments
export async function GET() {
  try {
    const rows = await sql<ApiComment[]>`
      SELECT
        c.comment_id::text        AS "_id",
        c.user_id::text           AS "userId",
        u.username              AS "username",
        c.comment_content         AS "commentContent",
        c.created_at              AS "date",
        c.post_id::text           AS "postId"
      FROM comments c
      JOIN ssu_users u ON c.user_id = u.user_id
      ORDER BY c.created_at DESC
    `;

    const data = rows.map(c => ({
      ...c,
      replies: [],
    }));

    return NextResponse.json(data, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500, headers: corsHeaders });
  }
}
