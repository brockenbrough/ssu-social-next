export async function GET() {
  try {
    const res = await fetch("http://localhost:3000/api/bookmarks");
    const data = await res.json();

    if (res.status !== 200 || !Array.isArray(data)) {
      return Response.json(
        { success: false, message: `Unexpected status ${res.status}`, data },
        { status: 500 }
      );
    }

    const hasSeeded = data.some(
      (b: any) =>
        b.user_id === "22222222-2222-2222-2222-222222222222" &&
        b.post_id === "33333333-3333-3333-3333-333333333333"
    );

    if (!hasSeeded) {
      return Response.json(
        {
          success: false,
          message: "Seeded bookmark not found in GET /api/bookmarks",
          data,
        },
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

