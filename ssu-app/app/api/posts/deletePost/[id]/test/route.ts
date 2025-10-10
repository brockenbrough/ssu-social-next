import { NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const seededPostId = "33333333-3333-3333-3333-333333333333";

    // Step 1: Check if the post exists before deletion
    const preCheck = await sql<{ post_id: string }[]>`
      SELECT post_id
      FROM posts
      WHERE post_id = ${seededPostId}::uuid
      LIMIT 1
    `;

    if (preCheck.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Seeded post does not exist; cannot test delete",
      }, { status: 400 });
    }

    // Step 2: Delete the post
    const deleted = await sql<{ post_id: string }[]>`
      DELETE FROM posts
      WHERE post_id = ${seededPostId}::uuid
      RETURNING post_id
    `;

    if (deleted.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Failed to delete seeded post",
      }, { status: 500 });
    }

    // Step 3: Verify deletion
    const postAfterDelete = await sql<{ post_id: string }[]>`
      SELECT post_id
      FROM posts
      WHERE post_id = ${seededPostId}::uuid
    `;

    if (postAfterDelete.length > 0) {
      return NextResponse.json({
        success: false,
        message: "Post still exists after deletion",
        data: postAfterDelete,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Seeded post deleted successfully and verified",
      data: { deletedId: seededPostId },
    });

  } catch (err: any) {
    return NextResponse.json({
      success: false,
      message: err.message,
    }, { status: 500 });
  }
}
