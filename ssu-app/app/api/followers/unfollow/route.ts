import { NextResponse } from "next/server";
import postgres from "postgres";
import { corsHeaders } from "@/utilities/cors";


const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });
const isUuid = (s: string) => /^[0-9a-fA-F-]{8}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{12}$/.test(s);

export async function POST(req: Request) {
  try {
    const { userId, targetUserId } = await req.json();

    if (!isUuid(userId) || !isUuid(targetUserId)) {
      return NextResponse.json({ success: false, message: "Invalid UUID(s)" }, { status: 400 });
    }
    if (userId === targetUserId) {
      return NextResponse.json({ success: false, message: "Cannot unfollow yourself" }, { status: 400 });
    }

    const result = await sql`
      DELETE FROM followers
      WHERE user_id = ${targetUserId}::uuid AND follower_id = ${userId}::uuid
    `;

    return NextResponse.json({ success: true, data: { userId, targetUserId }, deleted: (result as any).count ?? null }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message ?? String(err) }, { status: 500 });
  }
}
