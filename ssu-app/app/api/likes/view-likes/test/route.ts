export async function GET() {
  try {
    const postId = "33333333-3333-3333-3333-333333333333";
    const res = await fetch(`http://localhost:3000/api/likes/view-likes/${postId}`);
    const text = await res.text();

    // ensure we have JSON
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return Response.json(
        { success: false, message: "Response was not JSON", body: text.substring(0, 200) },
        { status: 500 }
      );
    }

    if (res.status === 200 && data && typeof data === "object") {
      const returnedPost = data.post_id ?? data.postId ?? data.post_id;
      const returnedUser = data.user_id ?? data.userId;

      if (returnedPost !== postId) {
        return Response.json(
          { success: false, message: "Returned post_id does not match requested postId", expected: postId, actual: returnedPost, data },
          { status: 500 }
        );
      }

      if (typeof returnedUser !== "string" || returnedUser.length === 0) {
        return Response.json(
          { success: false, message: "Returned user_id is missing or invalid", data },
          { status: 500 }
        );
      }

      return Response.json({ success: true, sample: data }, { status: 200 });
    }

    // handle not found / other statuses
    if (res.status === 404) {
      return Response.json({ success: false, message: "No likes found for post", postId }, { status: 404 });
    }

    return Response.json(
      { success: false, message: `Unexpected status ${res.status}`, data },
      { status: 500 }
    );
  } catch (err: any) {
    return Response.json({ success: false, message: err?.message ?? "Unknown error" }, { status: 500 });
  }
}