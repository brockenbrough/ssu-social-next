// app/api/user/deleteAll/route.ts
import { NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function POST() {
  try {
    const result = await sql`
      DELETE FROM ssu_users
      WHERE user_id != '00000000-0000-0000-0000-000000000000'
      RETURNING *
    `;

    const deletedUsers = result.map(u => ({
      _id: u.user_id.toString(),
      username: u.username,
      email: u.email,
      password: null,
      date: u.created_at,
      role: u.role?.toString() || "user",
      imageId: null,
      profileImage: u.profile_image || null,
      biography: u.biography || "",
    }));

    return NextResponse.json(deletedUsers, { status: 200 });
  } catch (error) {
    console.error("Error deleting all users:", error);
    return NextResponse.json({ error: "Failed to delete all users" }, { status: 500 });
  }
}
