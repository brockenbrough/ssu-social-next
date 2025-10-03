import { NextResponse } from "next/server";

export async function GET() {
  try {
    const testContributor = {
      name: "Integration Test User",
      position: "Software Engineer",
      level_name: "Junior", // your table seed & check constraint expect this value
    };

    const res = await fetch("http://localhost:3000/api/contributors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testContributor),
    });

    const data = await res.json().catch(() => null);

    if (res.status === 201 && data?.data) {
      const c = data.data;
      const ok =
        c._id &&
        c.name === testContributor.name &&
        c.position === testContributor.position &&
        c.level === testContributor.level_name;

      if (ok) {
        return NextResponse.json({
          success: true,
          message: "Route returned expected 201 Created with contributor in legacy shape.",
          data,
        });
      }
      return NextResponse.json(
        { success: false, message: "Legacy data structure is incorrect.", data },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, message: `Unexpected status: ${res.status}`, data },
      { status: res.status || 500 }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || "Unknown error" }, { status: 500 });
  }
}
