import { NextRequest, NextResponse } from "next/server";
 
import { corsHeaders } from "@/utilities/cors";

import sql from "@/utilities/db";

const defaultProfileImageUrl =
  "https://ssusocial.s3.amazonaws.com/profilepictures/ProfileIcon.png";

async function fetchImageArrayBuffer(url: string): Promise<{ body: ArrayBuffer; contentType: string } | null> {
  try {
    const upstream = await fetch(url, { cache: "no-store" });
    if (!upstream.ok) return null;
    const contentType = upstream.headers.get("content-type") || "image/png";
    const body = await upstream.arrayBuffer();
    return { body, contentType };
  } catch {
    return null;
  }
}

// GET /api/user/profileImageProxy/:username
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  const { username } = await context.params;

  if (!username) {
    return NextResponse.json(
      { message: "Username is required." },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    const rows = await sql<[{ profile_image: string | null }]>`
      SELECT profile_image
      FROM ssu_users
      WHERE username = ${username}
      LIMIT 1
    `;

    const candidateUrl = rows?.[0]?.profile_image || defaultProfileImageUrl;

    // Try the user's image first, then fall back to default
    const primary = await fetchImageArrayBuffer(candidateUrl);
    const chosen = primary ?? (await fetchImageArrayBuffer(defaultProfileImageUrl));

    if (!chosen) {
      return NextResponse.json(
        { message: "Image fetch failed." },
        { status: 502, headers: corsHeaders }
      );
    }

    return new NextResponse(chosen.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": chosen.contentType,
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}


