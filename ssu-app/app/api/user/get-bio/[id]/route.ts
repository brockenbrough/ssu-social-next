import { NextResponse } from "next/server";
import postgres from "postgres";
import { corsHeaders } from "@/utilities/cors";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

// NOTE: Auth is intentionally commented out so route works unauthenticated for now.
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

// GET /api/user/get-bio/[id]
export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    // UUID shape check
    if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    // Intended auth (disabled for now):
    // const userFromToken = verifyToken(req);
    // if (!userFromToken || userFromToken.id !== id) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const rows = await sql<{ biography: string | null }[]>`
      SELECT COALESCE(biography, '') AS biography
      FROM ssu_users
      WHERE user_id = ${id}::uuid
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ biography: rows[0].biography || "" }, { status: 200 });
  } catch (error) {
    console.error("Error fetching biography:", error);
    return NextResponse.json({ message: "Error fetching biography" }, { status: 500 });
  }
}


