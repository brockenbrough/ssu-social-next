import { NextResponse } from "next/server";
 
import { corsHeaders } from "@/utilities/cors";


import sql from "@/utilities/db";

export async function GET() {
  try {
    // 1️⃣ Define test hashtag
    const testHashtag = "#UnitTestTag";

    // 2️⃣ Call the actual API route
    const res = await fetch("http://localhost:3000/api/hashmaps/createHashtag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hashtag: testHashtag }),
    });

    const data = await res.json();

    // 3️⃣ Validate response
    if (res.status === 201 && data.success && data.hashtag) {
      // Double-check DB to confirm it was actually inserted
      const rows = await sql`
        SELECT * FROM hashtags WHERE hashtag = ${testHashtag};
      `;

      if (rows.length > 0) {
        return NextResponse.json({
          success: true,
          message: "✅ createHashtag route passed all checks.",
          data: {
            status: res.status,
            createdHashtag: rows[0],
          },
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            message: "❌ Hashtag not found in DB after creation.",
            data,
          },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          message: `❌ Unexpected response: ${res.status}`,
          data,
        },
        { status: res.status }
      );
    }
  } catch (err: any) {
    console.error("Error testing hashtag creation:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
