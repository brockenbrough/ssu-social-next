// app/api/Views/CreateView/route.ts
import { NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function POST(req: Request) {
  try {
    const { userId, postId } = await req.json();

    // Basic input validation
    if (!userId || !postId) {
      return NextResponse.json(
        { success: false, message: "userId and postId are required." },
        { status: 400 }
      );
    }

    // Optional UUID format validation
    const uuidRegex = /^[0-9a-fA-F-]{36}$/;
    if (!uuidRegex.test(userId) || !uuidRegex.test(postId)) {
      return NextResponse.json(
        { success: false, message: "Invalid UUID format for userId or postId." },
        { status: 400 }
      );
    }

    // Check for existing view
    const existing = await sql`
      SELECT 1 FROM views WHERE user_id = ${userId} AND post_id = ${postId}
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { success: true, message: "View already exists — no duplicate created." },
        { status: 200 }
      );
    }

    // Insert new view
    await sql`
      INSERT INTO views (user_id, post_id)
      VALUES (${userId}, ${postId})
    `;

    return NextResponse.json(
      { success: true, message: "View added successfully." },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("❌ Error adding view:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Server error: could not insert view.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
