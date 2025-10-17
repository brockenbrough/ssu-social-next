// app/api/tests/posts/uploadImage/route.ts
import { NextResponse } from "next/server";
import postgres from "postgres";
import fs from "fs";
import path from "path";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function GET() {
  try {
    // 🧩 Step 1: Setup test data
    const testUserId = "11111111-1111-1111-1111-111111111111";
    const testPostId = "33333333-3333-3333-3333-333333333333";
    const dummyImagePath = path.join(process.cwd(), "public/uploads/test-image.jpg");
    const dummyImageUri = "/uploads/test-image.jpg";

    // 🧪 Step 2: Ensure dummy file exists
    if (!fs.existsSync(dummyImagePath)) {
      fs.mkdirSync(path.dirname(dummyImagePath), { recursive: true });
      fs.writeFileSync(dummyImagePath, "dummy image data");
    }

    // 🧠 Step 3: Update post record with dummy image URI
    const updateResult = await sql`
      UPDATE posts
      SET image_uri = ${dummyImageUri}
      WHERE post_id = ${testPostId} AND user_id = ${testUserId}
    `;

    // 📝 Step 4: Verify update
    const result = await sql<{ post_id: string; image_uri: string; user_id: string }[]>`
      SELECT post_id, image_uri, user_id
      FROM posts
      WHERE post_id = ${testPostId} AND user_id = ${testUserId}
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, message: "Test post not found." },
        { status: 404 }
      );
    }

    const updated = result[0];
    const isUpdated = updated.image_uri === dummyImageUri;

    if (isUpdated) {
      return NextResponse.json({
        success: true,
        message: "✅ Post image successfully updated in database.",
        post: updated,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "❌ Image URI not updated as expected.",
          post: updated,
        },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error("Error during image upload test:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Server error" },
      { status: 500 }
    );
  }
}
