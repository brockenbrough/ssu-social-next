import { NextResponse } from "next/server";
import { corsHeaders } from "@/utilities/cors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return NextResponse.json(null, { status: 200, headers: corsHeaders });
}

export async function GET(req: Request) {
  // Abort fetch after 10s
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);

  try {
    const origin = new URL(req.url).origin;

    const testContributor = {
      name: "Integration Test User",
      position: "Software Engineer",
      level_name: "Junior",
    };

    const res = await fetch(`${origin}/api/contributors`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(testContributor),
      cache: "no-store",
      signal: controller.signal,
    });

    const data = await res.json().catch(() => null);
    const items = Array.isArray(data?.data) ? data.data : data?.data ? [data.data] : [];

    if (res.status !== 201 || items.length === 0) {
      return NextResponse.json(
        { success: false, message: `Unexpected status: ${res.status}`, data },
        { status: res.status || 500, headers: corsHeaders }
      );
    }

    const c = items[0];
    const ok =
      !!c?._id &&
      c.name === testContributor.name &&
      c.position === testContributor.position &&
      c.level === testContributor.level_name;

    if (!ok) {
      return NextResponse.json(
        { success: false, message: "Legacy data structure is incorrect.", data },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Route returned expected 201 Created with contributor in legacy shape.",
        data,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    const msg = err?.name === "AbortError" ? "Request timed out" : (err?.message || "Unknown error");
    return NextResponse.json({ success: false, message: msg }, { status: 500, headers: corsHeaders });
  } finally {
    clearTimeout(timer);
  }
}