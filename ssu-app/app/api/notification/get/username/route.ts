// app/api/notifications/get/username/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { success: false, error: "Username query parameter is required." },
        { status: 400 }
      );
    }

    // Find user_id
    const { data: user, error: userError } = await supabase
      .from("ssu_users")
      .select("user_id")
      .eq("username", username)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "User not found." },
        { status: 404 }
      );
    }

    // Fetch notifications for that user
    const { data: notifications, error: notifError } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.user_id)
      .order("created_at", { ascending: false });

    if (notifError) {
      return NextResponse.json(
        { success: false, error: notifError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: notifications ?? [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
