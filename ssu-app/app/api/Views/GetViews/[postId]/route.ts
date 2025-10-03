// app/api/Views/GetViews/[postId]/route.ts
import { NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function GET(
  req: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params;

    const [row] = await sql<{ viewcount: number }[]>`
      SELECT COUNT(*)::int AS viewCount
      FROM views
      WHERE post_id = ${postId}
    `;

    return NextResponse.json({ viewCount: row?.viewcount ?? 0 }, { status: 200 });
  } catch (error) {
    console.error("Error fetching view count:", error);
    return NextResponse.json(
      { error: "Failed to fetch view count", details: (error as any).message },
      { status: 500 }
    );
  }
}
