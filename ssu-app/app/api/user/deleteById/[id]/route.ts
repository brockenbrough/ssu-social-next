import { NextResponse } from "next/server";
 
import jwt from "jsonwebtoken";
import { corsHeaders } from "@/utilities/cors";

import sql from "@/utilities/db";

type ApiUser = {
  _id: string;
  username: string;
  email: string;
  password: string | null;
  role: string;
  imageId: string | null;
  profileImage: string | null;
  biography: string;
};

// Helper function to verify JWT and return payload
function verifyToken(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!);
    return payload as { id: string; email: string; username: string; role: string };
  } catch (error) {
    return null;
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

// DELETE /api/user/deleteById/[id]
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    // Verify token
    const userFromToken = verifyToken(_req);
    if (!userFromToken) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Only allow user to delete their own account
    if (userFromToken.id !== id) {
      return NextResponse.json(
        { message: "Not authorized to delete this user" },
        { status: 403, headers: corsHeaders }
      );
    }

    // Delete user from Postgres and return deleted data
    const rows = await sql<ApiUser[]>`
      DELETE FROM ssu_users
      WHERE user_id = ${id}::uuid
      RETURNING
        user_id::text AS "_id",
        username,
        email,
        password,
        role::text AS "role",
        NULL::text AS "imageId",
        profile_image AS "profileImage",
        COALESCE(biography, '') AS "biography"
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Redact password
    const deletedUser = { ...rows[0], password: null };

    return NextResponse.json(
      { message: "User deleted successfully", deletedUser },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}