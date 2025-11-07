// app/api/images/create/route.ts
import { NextRequest, NextResponse } from "next/server";
 
import fs from "fs/promises";
import path from "path";
import { corsHeaders } from "@/utilities/cors";

import sql from "@/utilities/db";

// Handle preflight CORS requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { success: false, message: "Content-Type must be multipart/form-data" },
        { status: 400, headers: corsHeaders }
      );
    }

    const formData = await req.formData();
    const postId = formData.get("post_id") as string | null;
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No image file provided" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Ensure uploads directory
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    console.log("Uploads directory:", uploadDir);
    await fs.mkdir(uploadDir, { recursive: true });

    // Save file with unique name
    const fileExt = path.extname(file.name) || ".jpg";
    const uniqueId = Date.now();
    const fileName = postId
      ? `${postId}-${uniqueId}${fileExt}`
      : `prepost-${uniqueId}${fileExt}`;
    const filePath = path.join(uploadDir, fileName);
    console.log("Saving file to:", filePath);

    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(arrayBuffer));

    const isProduction = process.env.NODE_ENV === "production";
    const baseUrl = isProduction
      ? "https://ssu-social-newwave.vercel.app"
      : "http://localhost:3000";
    const fullImageUrl = `${baseUrl}/uploads/${fileName}`;

    // If postId exists, attach image to post
    let post = null;
    if (postId) {
      const postExists = await sql`SELECT 1 FROM posts WHERE post_id = ${postId}`;
      if (postExists.length === 0) {
        return NextResponse.json(
          { success: false, message: "Post not found" },
          { status: 404, headers: corsHeaders }
        );
      }

      const updated = await sql`
        UPDATE posts
        SET image_uri = ${fullImageUrl}
        WHERE post_id = ${postId}
        RETURNING post_id, image_uri, content, created_at
      `;
      post = updated[0];
    }

    return NextResponse.json(
      {
        success: true,
        message: "Image uploaded successfully",
        imageUri: fullImageUrl, // frontend uses this directly
        post,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { success: false, message: "Error uploading image" },
      { status: 500, headers: corsHeaders }
    );
  }
}