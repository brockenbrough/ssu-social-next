export async function GET() {
  try {
    const res = await fetch("http://localhost:3000/api/likeList");
    const data = await res.json();

    if (res.status !== 200 || !Array.isArray(data)) {
      return Response.json(
        { success: false, message: `Unexpected status ${res.status}`, data },
        { status: 500 }
      );
    }

    const expected = [
      { userId: "22222222-2222-2222-2222-222222222222", postId: "33333333-3333-3333-3333-333333333333" },
      { userId: "33333333-3333-3333-3333-333333333333", postId: "11111111-1111-1111-1111-111111111111" },
      { userId: "33333333-3333-3333-3333-333333333333", postId: "33333333-3333-3333-3333-333333333333", date: "2025-10-10T14:52:35.161Z" },
    ];

    const matchesAll = expected.every((exp) =>
      data.some((r: any) => {
        const uid = r.userId ?? r.user_id ?? r["user:Id"];
        const pid = r.postId ?? r.post_id;
        const date = r.date ?? r.createdAt ?? r.created_at;
        if (exp.date) {
          return uid === exp.userId && pid === exp.postId && date === exp.date;
        }
        return uid === exp.userId && pid === exp.postId;
      })
    );

    if (!matchesAll) {
      return Response.json(
        { success: false, message: "Expected entries not found in /api/likeList", data, expected },
        { status: 500 }
      );
    }

    return Response.json({ success: true, count: data.length, sample: data[0] });
  } catch (err: any) {
    return Response.json(
      { success: false, message: err.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}