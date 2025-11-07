// /utilities/db.ts
import postgres, { Sql } from "postgres";

// Extend globalThis to include our postgresClient
declare global {
  // @ts-ignore
  var postgresClient: Sql<any> | undefined;
}

const sql: Sql<any> =
  globalThis.postgresClient ||
  postgres(process.env.POSTGRES_URL!, { ssl: "require" });

// Save the client globally in dev to reuse across HMR reloads
if (process.env.NODE_ENV !== "production") {
  globalThis.postgresClient = sql;
}

export default sql;
