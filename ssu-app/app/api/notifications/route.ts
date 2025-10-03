import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, user_id, action_username, text, post_id } = body;

    if (!type || !user_id || !action_username) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [notification] = await sql`
      INSERT INTO notifications (type, user_id, action_username, text, post_id)
      VALUES (${type}, ${user_id}, ${action_username}, ${text}, ${post_id})
      RETURNING *
    `;

    return NextResponse.json(notification, { status: 201 });
  } catch (err: any) {
    console.error("Error creating notification:", err);
    return NextResponse.json(
      { error: "Server error", details: err.message },
      { status: 500 }
    );
  }
}
