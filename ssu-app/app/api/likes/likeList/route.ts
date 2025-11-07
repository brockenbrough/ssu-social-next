import { NextResponse } from "next/server";
 

type LikeRow = {
  user_Id: string;
  post_Id: string;
  created_At: string;
}
import sql from "@/utilities/db";

export async function GET() {
  try {
    const rows = await sql<LikeRow[]>`
      SELECT 
        *
      FROM likes l
    `;

    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error("Error fetching likes:", error);
    return NextResponse.json({ error: "Failed to fetch likes" }, { status: 500 });
  }
}
