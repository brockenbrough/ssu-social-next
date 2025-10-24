import { NextResponse } from "next/server";
import postgres from "postgres";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

// 🔹 Shared CORS helper
function corsResponse(body: any, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

// 🔹 Handle preflight requests
export async function OPTIONS(req: Request) {
  return corsResponse(null, 200);
}

// 🔹 PUT /api/user/edit
export async function PUT(req: Request) {
  try {
    // ✅ Extract token from Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return corsResponse({ success: false, message: "Unauthorized: Missing token" }, 401);
    }

    const token = authHeader.split(" ")[1];
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
    } catch (err) {
      console.error("❌ Token verification failed:", err);
      return corsResponse({ success: false, message: "Invalid or expired token" }, 401);
    }

    const userId = decoded.id;
    if (!userId) {
      return corsResponse({ success: false, message: "Invalid token payload" }, 400);
    }

    // ✅ Parse request body safely
    const body = await req.json();
    const username = body.username?.trim() || null;
    const email = body.email?.trim() || null;
    const password = body.password?.trim() || null;
    const biography = body.biography?.trim() || null;

    // ✅ Fetch current user
    const [existingUser] = await sql`
      SELECT * FROM ssu_users WHERE user_id = ${userId}
    `;
    if (!existingUser) {
      return corsResponse({ success: false, message: "User not found" }, 404);
    }

    // ✅ Check for username conflict (case-insensitive)
    if (username) {
      const [conflict] = await sql`
        SELECT user_id, username FROM ssu_users
        WHERE LOWER(username) = LOWER(${username}) AND user_id <> ${userId}
      `;
      if (conflict) {
        return corsResponse({ success: false, message: "Username is already taken" }, 409);
      }
    }

    // ✅ Hash password if provided
    let hashedPassword = existingUser.password;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    // ✅ Update user in DB
    const [updatedUser] = await sql`
      UPDATE ssu_users
      SET
        username = COALESCE(${username}, username),
        email = COALESCE(${email}, email),
        password = ${hashedPassword},
        biography = COALESCE(${biography}, biography)
      WHERE user_id = ${userId}
      RETURNING
        user_id::text AS "_id",
        username,
        email,
        biography
    `;

    console.log("✅ User updated successfully:", updatedUser.username);

    return corsResponse(
      {
        success: true,
        message: "User information updated successfully",
        user: updatedUser,
      },
      200
    );
  } catch (error) {
    console.error("🔥 Error updating user:", error);
    return corsResponse(
      { success: false, message: "Server error while updating user information" },
      500
    );
  }
}
