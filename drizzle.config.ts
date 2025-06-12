import 'dotenv/config';
import { type Config } from "drizzle-kit";

import { env } from "~/env";

export default {
  schema: "./src/server/db/schema.ts", // Remove realestate schema since you deleted those tables
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  tablesFilter: ["*"],
  out: "./drizzle", // Migration files location
  verbose: true, // More detailed output
  strict: true, // Stricter validation
} satisfies Config;
