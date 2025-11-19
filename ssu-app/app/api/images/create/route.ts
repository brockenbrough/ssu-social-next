// app/api/images/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { corsHeaders } from "@/utilities/cors";
import sql from "@/utilities/db";

// Handle preflight CORS requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Configure S3 Client using your .env variables
const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    console.log("Content-Type:", req.headers.get("content-type"));
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { success: false, message: "Content-Type must be multipart/form-data" },
        { status: 400, headers: corsHeaders }
      );
    }

    const formData = await req.formData();
    console.log("FormData keys:", Array.from(formData.keys()));
    const postId = formData.get("post_id") as string | null;
    const file = formData.get("image") as File | null;
    console.log("File object:", file);


    if (!file) {
      return NextResponse.json(
        { success: false, message: "No image file provided" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Convert file to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const fileExt = file.name.split(".").pop() || "jpg";

    // Unique filename
    const uniqueName = `${postId ?? "prepost"}-${Date.now()}.${fileExt}`;

    // Upload to S3
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: `uploads/${uniqueName}`,
        Body: Buffer.from(arrayBuffer),
        ContentType: file.type,
      })
    );

    // Public URL
    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/uploads/${uniqueName}`;

    // If post_id was provided, save imageUri to DB
    let post = null;

    if (postId) {
      const postExists = await sql`
        SELECT 1 FROM posts WHERE post_id = ${postId}
      `;

      if (postExists.length === 0) {
        return NextResponse.json(
          { success: false, message: "Post not found" },
          { status: 404, headers: corsHeaders }
        );
      }

      const updated = await sql`
        UPDATE posts
        SET image_uri = ${fileUrl}
        WHERE post_id = ${postId}
        RETURNING post_id, image_uri, content, created_at
      `;

      post = updated[0];
    }

    return NextResponse.json(
      {
        success: true,
        message: "Image uploaded successfully",
        imageUri: fileUrl,
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
