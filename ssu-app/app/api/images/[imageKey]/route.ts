// deleting post pictures
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { corsHeaders } from "@/utilities/cors";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

// Handle CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ imageKey: string }> }
) {
  const { imageKey } = await context.params; // await params

  try {
    // Construct absolute path to the uploaded file
    const imagePath = path.join(process.cwd(), "public", "uploads", imageKey);

    // Try to delete from file system
    try {
      await fs.unlink(imagePath);
      console.log(`Deleted local file: ${imagePath}`);
    } catch (err) {
      console.warn(`File not found: ${imagePath}`);
    }

    // Remove image reference in the database
    const imageUri = `/uploads/${imageKey}`;
    await sql`
      UPDATE posts
      SET image_uri = NULL
      WHERE image_uri = ${imageUri}
    `;

    return NextResponse.json(
      { success: true, message: "Image deleted successfully." },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error deleting image:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete image." },
      { status: 500, headers: corsHeaders }
    );
  }
}