/*
  Lakebase migration helper (FUTURE — not used in local MVP).

  Lakebase is Databricks-managed Postgres. It is wire-compatible with vanilla
  Postgres, so the entire app runs against it unchanged EXCEPT for credentials:
  instead of a static password, Lakebase expects a short-lived OAuth token used
  as the Postgres password, refreshed periodically.

  To switch from local Docker to Lakebase:
    1. Set DATABASE_URL to the Lakebase endpoint (host/db/sslmode=require),
       leaving the password blank.
    2. Implement getLakebaseToken() below (e.g. via the Databricks SDK /
       `databricks` CLI `generate-database-credential`, or the MCP
       generate_lakebase_credential tool) and have lib/db/index.ts build the
       connection password from it, refreshing before the ~1h expiry.
    3. Optionally enable Postgres RLS — every row already carries clan_id.

  No application/query code changes are required beyond this module.
*/

export async function getLakebaseToken(): Promise<string> {
  throw new Error(
    "Lakebase credential vending not implemented — MVP runs on local Postgres.",
  );
}
