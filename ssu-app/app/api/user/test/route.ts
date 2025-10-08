// app/api/tests/users/getAll/route.ts  (App Router version)
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Call the route being tested
    const res = await fetch("http://localhost:3000/api/user/getAll");
    const data = await res.json();

    // Check status code and expected structure
    if (res.status === 200 && Array.isArray(data)) {
      // Optionally verify sample fields
      const hasTestUser = data.some(
        (u: any) =>
          u.username === "test_user" &&
          u.email === "test_user@example.com" &&
          u.biography?.includes("test user for automated integration tests")
      );

      if (hasTestUser) {
        return NextResponse.json({
          success: true,
          message: "Route returned expected 200 OK with test users.",
          data,
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            message: "Route responded but did not contain expected test users.",
            data,
          },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          message: `Unexpected status: ${res.status}`,
          data,
        },
        { status: res.status }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
