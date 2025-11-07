import { NextResponse } from "next/server";
 
import { corsHeaders } from "@/utilities/cors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import sql from "@/utilities/db";

export async function OPTIONS() {
  return NextResponse.json(null, { status: 200, headers: corsHeaders });
}

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
      name: String(it?.name ?? "").trim(),
      position: String(it?.position ?? "").trim(),
      level: String(it?.level ?? it?.level_name ?? "").trim(),
    }));

    // Validate/normalize level
    const allowed = new Set(["junior", "mid", "senior", "lead"]);
    for (const it of normalized) {
      if (!it.name || !it.position || !it.level) {
        return NextResponse.json(
          { message: "name, position, and level (or level_name) are required." },
          { status: 400, headers: corsHeaders }
        );
      }
      const lvl = it.level.toLowerCase();
      if (!allowed.has(lvl)) {
        return NextResponse.json(
          { message: "level must be one of: Junior, Mid, Senior, Lead" },
          { status: 400, headers: corsHeaders }
        );
      }
      // Title-case the level so DB is consistent
      it.level = lvl.charAt(0).toUpperCase() + lvl.slice(1);
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

      try {
        // Type the result and guard against empty return
        const rows = await sql.unsafe<ApiContributor[]>(insertQ, [it.name, it.position, it.level]);
        const row = rows?.[0];
        if (!row) {
          throw new Error("Insert failed: no row returned from INSERT ... RETURNING");
        }
        out.push(row);
      } catch (e: any) {
        console.error("Insert error for payload:", it, ":", e?.message || e);
        throw e; // bubble up to outer catch
      }
    }

    return NextResponse.json(
      { message: "Contributor created successfully", data: Array.isArray(body) ? out : out[0] },
      { status: 201, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("Error creating contributor:", error);
    return NextResponse.json(
      { error: error?.message || "Could not create contributor" },
      { status: 500, headers: corsHeaders }
    );
  }
}