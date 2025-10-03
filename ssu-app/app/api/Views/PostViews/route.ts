import { NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function POST(req: Request) {
  try {
    const { userId, postId } = await req.json();

    if (!userId || !postId) {
      return NextResponse.json({ message: "userId and postId are required." }, { status: 400 });
    }

    const existing = await sql`
      SELECT 1 FROM views WHERE user_id = ${userId} AND post_id = ${postId}
    `;

    if (existing.length > 0) {
      return NextResponse.json({ message: "Unique View Already Exists" }, { status: 200 });
    }

    await sql`
      INSERT INTO views (user_id, post_id)
      VALUES (${userId}, ${postId})
    `;

    return NextResponse.json({ message: "View added successfully." }, { status: 201 });
  } catch (error) {
    console.error("Error adding view:", error);
    return NextResponse.json(
      { message: "Server error. Could not increase views.", error },
      { status: 500 }
    );
  }
}
