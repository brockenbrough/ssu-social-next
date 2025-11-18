import { NextRequest, NextResponse } from "next/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { corsHeaders } from "@/utilities/cors";
import sql from "@/utilities/db";

// Handle CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Configure S3 Client
const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ imageKey: string }> }
) {
  try {
    const { imageKey } = await context.params;

    // imageKey = "12345-1710790023000.jpg"
    // Need to convert to S3 key: "uploads/<imageKey>"
    const s3Key = `uploads/${imageKey}`;

    // Delete from S3
    try {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME!,
          Key: s3Key,
        })
      );
      console.log(`Deleted from S3: ${s3Key}`);
    } catch (err) {
      console.warn(`S3 delete failed or object missing: ${s3Key}`, err);
    }

    // Remove image_uri from posts where it matches the S3 URL
    const fullImageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${s3Key}`;

    await sql`
      UPDATE posts
      SET image_uri = NULL
      WHERE image_uri = ${fullImageUrl}
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