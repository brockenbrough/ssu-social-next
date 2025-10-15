export async function GET() {
  try {
    const res = await fetch("http://localhost:3000/api/likesByUser");
    const data = await res.json();

    if (res.status !== 200 || !Array.isArray(data)) {
      return Response.json(
        { success: false, message: `Unexpected status ${res.status}`, data },
        { status: 500 }
      );
    }

    const seedUserId = "33333333-3333-3333-3333-333333333333";

    if (data.length === 0) {
      return Response.json(
        { success: false, message: "No rows returned for likesByUser", data },
        { status: 500 }
      );
    }

    const allForUser = data.every(
      (r: any) => r.userId === seedUserId || r.user_id === seedUserId
    );

    if (!allForUser) {
      return Response.json(
        {
          success: false,
          message: "Not all returned rows belong to the expected userId",
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