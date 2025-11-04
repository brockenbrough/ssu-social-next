// app/api/images/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";
import fs from "fs/promises";
import path from "path";
import { corsHeaders } from "@/utilities/cors";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

// Handle preflight CORS requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    // Ensure multipart/form-data
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { success: false, message: "Content-Type must be multipart/form-data" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Parse form data
    const formData = await req.formData();
    const postId = formData.get("post_id") as string;
    const file = formData.get("image") as File | null;

    if (!postId || !file) {
      return NextResponse.json(
        { success: false, message: "Missing post_id or image file" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Ensure post exists
    const postExists = await sql`
      SELECT 1 FROM posts WHERE post_id = ${postId}
    `;
    if (postExists.length === 0) {
      return NextResponse.json(
        { success: false, message: "Post not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Ensure uploads directory
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    // Save file with unique name
    const fileExt = path.extname(file.name) || ".jpg";
    const fileName = `${postId}-${Date.now()}${fileExt}`;
    const filePath = path.join(uploadDir, fileName);

    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(arrayBuffer));

    // Create public URL (for dev)
    const imageUrl = `/uploads/${fileName}`;

    // Update post in DB
    const updated = await sql`
      UPDATE posts
      SET image_uri = ${imageUrl}
      WHERE post_id = ${postId}
      RETURNING post_id, image_uri, content, created_at
    `;

    return NextResponse.json(
      {
        success: true,
        message: "Image uploaded and post updated successfully.",
        post: updated[0],
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error uploading post image:", error);
    return NextResponse.json(
      { success: false, message: "Error uploading post image." },
      { status: 500, headers: corsHeaders }
    );
  }
}
