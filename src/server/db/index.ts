import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "~/env";
import * as schema from "./schema";

/**
 * Cache the database connection in all environments.
 * This prevents creating new connections on every serverless function invocation.
 */
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

// Configure connection pooling options to prevent "too many clients" errors
const connectionOptions = {
  max: 10, // Max 10 connections
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout after 10 seconds
  prepare: false, // Disable prepared statements for better connection reuse
};

// Use cached connection or create a new one with pooling
const conn = globalForDb.conn ?? postgres(env.DATABASE_URL, connectionOptions);

// Cache the connection in all environments (including production)
globalForDb.conn = conn;

export const db = drizzle(conn, { schema });
