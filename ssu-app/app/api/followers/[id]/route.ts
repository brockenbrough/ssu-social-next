import { NextResponse } from "next/server";
import postgres from "postgres";
import { corsHeaders } from "@/utilities/cors";


const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function OPTIONS() {
  return NextResponse.json(null, { status: 200, headers: corsHeaders });
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;

    // This API takes a user name.  This is just a temporary stub to return nothing.
    const followers: string[] = []; // just an empty array

    return NextResponse.json(
      {
        success: true,
        message: "Followers list retrieved successfully",
        data: followers, // return directly
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error("Error fetching followers for user:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch followers list" },
      { status: 500, headers: corsHeaders }
    );
  }

}
