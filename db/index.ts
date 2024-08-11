import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import * as dotenv from "dotenv";
import postgres from "postgres";

dotenv.config({
  path: [".env.local"],
});

const connectionString = String(process.env.DATABASE_URL);
const client = postgres(connectionString);

export const db = drizzle(client, { schema });
