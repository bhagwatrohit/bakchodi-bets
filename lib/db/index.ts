import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/*
  Single shared Postgres connection pool + Drizzle client.
  DATABASE_URL points at local Docker Postgres now, Lakebase later.
  See lib/db/lakebase-credential.ts for the future OAuth-token swap.
*/

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local.");
}

// Reuse the client across hot reloads in dev to avoid exhausting connections.
const globalForDb = globalThis as unknown as { __pg?: ReturnType<typeof postgres> };

const client =
  globalForDb.__pg ?? postgres(connectionString, { max: 10, prepare: false });
if (process.env.NODE_ENV !== "production") globalForDb.__pg = client;

export const db = drizzle(client, { schema });

export type DbClient = typeof db;
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Run `fn` inside a single Postgres transaction. */
export function withTransaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction(fn);
}

export { schema };
