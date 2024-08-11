import type { Config } from "drizzle-kit";

import * as dotenv from "dotenv";

dotenv.config({
  path: [".env.local"],
});

export default {
  schema: "./db/schema.ts",
  dialect: "postgresql",
  out: "./db/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
} as Config;
