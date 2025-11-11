import { NextResponse } from "next/server";
 
import { corsHeaders } from "@/utilities/cors";

import sql from "@/utilities/db";

// Handle preflight requests (CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// Expects JSON body { user_id: string }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id } = body as { user_id?: string };

    if (!user_id) {
      return NextResponse.json(
        { message: "user_id is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const userRows = await sql<{ user_id: string; profile_image: string | null }[]>`
      SELECT user_id::text, profile_image
      FROM ssu_users
      WHERE user_id = ${user_id}::uuid
      LIMIT 1
    `;

    if (userRows.length === 0) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const DEFAULT_PROFILE_IMAGE =
      "https://ssusocial.s3.amazonaws.com/profilepictures/ProfileIcon.png";

    await sql`
      UPDATE ssu_users
      SET profile_image = ${DEFAULT_PROFILE_IMAGE}
      WHERE user_id = ${user_id}::uuid
    `;

    return NextResponse.json(
      {
        message: "Profile image removed successfully",
        profileImage: DEFAULT_PROFILE_IMAGE,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("Error removing profile image:", error);
    return NextResponse.json(
      {
        message: "Failed to remove profile image",
        error: String(error?.message ?? error),
      },
      { status: 500, headers: corsHeaders }
    );
  }
}