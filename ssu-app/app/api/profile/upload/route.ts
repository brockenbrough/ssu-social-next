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

// Expects JSON body: { user_id: string, image_url: string }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, image_url } = body as { user_id?: string; image_url?: string };

    if (!user_id) {
      return NextResponse.json(
        { message: "user_id is required" },
        { status: 400, headers: corsHeaders }
      );
    }
    if (!image_url || typeof image_url !== "string" || !image_url.trim()) {
      return NextResponse.json(
        { message: "image_url is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Basic URL guard (keep it lightweight; real validation can be stricter)
    const isHttpUrl = /^(https?:)\/\//i.test(image_url);
    if (!isHttpUrl) {
      return NextResponse.json(
        { message: "image_url must be an http(s) URL" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Ensure the user exists
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

    // Update profile image
    const updated = await sql<{ profile_image: string | null }[]>`
      UPDATE ssu_users
      SET profile_image = ${image_url}
      WHERE user_id = ${user_id}::uuid
      RETURNING profile_image
    `;

    return NextResponse.json(
      {
        message: "Profile image updated successfully",
        profileImage: updated?.[0]?.profile_image ?? image_url,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("Error uploading profile image:", error);
    return NextResponse.json(
      { message: "Failed to upload profile image", error: String(error?.message ?? error) },
      { status: 500, headers: corsHeaders }
    );
  }
}