import { NextResponse } from "next/server";
 
import { corsHeaders } from "@/utilities/cors";

import { censorText } from "@/utilities/moderation";

import sql from "@/utilities/db";

// NOTE: Auth/moderation intentionally commented so route works unauthenticated for now.
// import jwt from "jsonwebtoken";
// function verifyToken(req: Request) {
//   const authHeader = req.headers.get("Authorization");
//   if (!authHeader?.startsWith("Bearer ")) return null;
//   const token = authHeader.split(" ")[1];
//   try {
//     const payload = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!);
//     return payload as { id: string };
//   } catch {
//     return null;
//   }
// }
// async function moderationMiddleware(_biography: string) {
//   // Placeholder for content moderation checks
//   return true;
// }

// Handle preflight requests (CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// PUT /api/user/update-bio/[id]
export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
      return NextResponse.json(
        { error: "Invalid user id" },
        { status: 400, headers: corsHeaders }
      );
    }

    const body = await req.json();
    const { biography } = body ?? {};

    if (typeof biography !== "string") {
      return NextResponse.json(
        { message: "Invalid biography" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Intended auth+moderation (disabled for now):
    // const userFromToken = verifyToken(req);
    // if (!userFromToken || userFromToken.id !== id) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    // }
    // const ok = await moderationMiddleware(biography);
    // if (!ok) {
    //   return NextResponse.json({ message: "Biography failed moderation" }, { status: 400, headers: corsHeaders });
    // }

    const { text: censoredBiography, changed } = await censorText(biography);
    const hasOffensiveText = changed;

    const rows = await sql<{ biography: string }[]>`
      UPDATE ssu_users
      SET biography = ${censoredBiography}
      WHERE user_id = ${id}::uuid
      RETURNING COALESCE(biography, '') AS biography
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { biography: rows[0].biography },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error updating biography:", error);
    return NextResponse.json(
      { message: "Error updating biography" },
      { status: 500, headers: corsHeaders }
    );
  }
}