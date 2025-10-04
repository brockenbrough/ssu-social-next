import { NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

type ApiContributor = {
  _id: string;
  name: string;
  position: string;
  level: string;
};

async function detectCols() {
  const rows = await sql<{ column_name: string }[]>`
    select column_name
    from information_schema.columns
    where table_schema='public' and table_name='contributors'
  `;
  const names = rows.map(r => r.column_name);

  const pkCol =
    names.includes("contributor_id") ? "contributor_id" :
    names.includes("id") ? "id" :
    names.includes("contributorid") ? "contributorid" :
    names.includes("contributorID") ? `"contributorID"` : null;

  const positionCol =
    names.includes("position") ? "position" :
    names.includes("Position") ? `"Position"` : null;

  const levelCol =
    names.includes("level_name") ? "level_name" :
    names.includes("level") ? "level" :
    names.includes("Level") ? `"Level"` : null;

  if (!pkCol)       throw new Error('contributors PK not found (expected contributor_id/id/contributorid/"contributorID")');
  if (!positionCol) throw new Error('contributors.position not found (expected position or "Position")');
  if (!levelCol)    throw new Error('contributors.level not found (expected level_name/level/"Level")');

  return { pkCol, positionCol, levelCol };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items = Array.isArray(body) ? body : [body];

    const normalized = items.map((it) => ({
      name: it?.name,
      position: it?.position,
      level: it?.level ?? it?.level_name, // accept either
    }));

    const allowedLevels = new Set(["Junior", "Mid", "Senior", "Lead"]);
    for (const it of normalized) {
      if (!it.name || !it.position || !it.level) {
        return NextResponse.json(
          { message: "name, position, and level (or level_name) are required." },
          { status: 400 }
        );
      }
      if (!allowedLevels.has(String(it.level))) {
        return NextResponse.json(
          { message: "level must be one of: Junior, Mid, Senior, Lead" },
          { status: 400 }
        );
      }
    }

    const { pkCol, positionCol, levelCol } = await detectCols();

    const out: ApiContributor[] = [];
    for (const it of normalized) {
      const insertQ = `
        insert into contributors (name, ${positionCol}, ${levelCol})
        values ($1, $2, $3)
        returning
          ${pkCol}::text as "_id",
          name,
          ${positionCol} as "position",
          ${levelCol}  as "level"
      `;
      const rows = await sql.unsafe(insertQ, [it.name, it.position, it.level]);
      out.push({
        _id: rows[0]._id,
        name: rows[0].name,
        position: rows[0].position,
        level: rows[0].level,
      });
    }

    return NextResponse.json(
      { message: "Contributor created successfully", data: Array.isArray(body) ? out : out[0] },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating contributor:", error);
    return NextResponse.json({ error: error?.message || "Could not create contributor" }, { status: 500 });
  }
}
