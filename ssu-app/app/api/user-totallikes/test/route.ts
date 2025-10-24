import { NextResponse } from "next/server";
import { corsHeaders } from "@/utilities/cors";

export async function GET() {
  try {
    const seededUserId = "11111111-1111-1111-1111-111111111111";
    const expectedCount = 3;

    const res = await fetch(
      `http://localhost:3000/api/user-totallikes/${seededUserId}`,
      { headers: { Accept: "application/json" }, cache: "no-store" }
    );

    // If the target route returned an error, surface it
    if (!res.ok) {
      let body: any = null;
      try { body = await res.json(); } catch {}
      return NextResponse.json(
        {
          success: false,
          message: `user-totallikes route returned ${res.status}`,
          data: body ?? null,
        },
        { status: 500 }
      );
    }

    const json = await res.json();

    // The user-totallikes route returns a raw JSON number (not { count: n })
    if (typeof json !== "number") {
      return NextResponse.json(
        {
          success: false,
          message: "Unexpected response structure from user-totallikes route (expected a number).",
          data: json,
        },
        { status: 500 }
      );
    }

    if (json !== expectedCount) {
      return NextResponse.json(
        {
          success: false,
          message: "Total likes mismatch for seeded user.",
          data: { userId: seededUserId, expected: expectedCount, actual: json },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Total likes verified for seeded user.",
      data: { userId: seededUserId, expected: expectedCount, actual: json },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}