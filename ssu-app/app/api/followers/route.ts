import { NextResponse } from "next/server";
import { corsHeaders } from "@/utilities/cors";

import sql from "@/utilities/db";

// Handle preflight (CORS) for /api/followers
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// GET /api/followers
// This endpoint exists to satisfy legacy/frontend calls that may hit
// /followers/ without a username. We return a stable, empty structure
// compatible with the consumer expecting [{ username, followers }].
export async function GET() {
  return NextResponse.json(
    [{ username: "", followers: [] as string[] }],
    { status: 200, headers: corsHeaders }
  );
}


