import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";
import { corsHeaders } from "@/utilities/cors";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

// GET /api/user/getProfileImage/:username
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ username: string }> } // 👈 params is now a Promise
) {
  const { username } = await context.params; // 👈 await before destructuring

  try {
    if (!username) {
      return NextResponse.json(
        { success: false, message: "Username is required." },
        { status: 400, headers: corsHeaders }
      );
    }

    const result = await sql`
      SELECT profile_image
      FROM ssu_users
      WHERE username = ${username}
      LIMIT 1
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404, headers: corsHeaders }
      );
    }

    const imageUri = result[0].profile_image;

    if (!imageUri) {
      return NextResponse.json(
        { success: false, message: "Profile image not found." },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { success: true, imageUri },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
  console.error("❌ Error fetching profile image:", error);
  return NextResponse.json(
    { success: false, message: error.message || "Server error." },
    { status: 500, headers: corsHeaders }
  );
}
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}
