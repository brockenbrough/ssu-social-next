import { NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id || !/^[0-9a-fA-F-]{36}$/.test(id)) {
      return NextResponse.json({ success: false, message: "Invalid post ID" }, { status: 400 });
    }

    // Attempt deletion
    const result = await sql<{ post_id: string }[]>`
      DELETE FROM posts
      WHERE post_id = ${id}::uuid
      RETURNING post_id
    `;

    if (result.length === 0) {
      return NextResponse.json({ success: false, message: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Post deleted successfully",
      data: { deletedId: result[0].post_id },
    });

  } catch (err: any) {
    console.error("Delete post error:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
