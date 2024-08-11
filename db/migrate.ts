import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config({
  path: [".env.local"],
});

const connectionString = String(process.env.DATABASE_URL);
export const connection = postgres(connectionString);
export const db = drizzle(connection);

export const migrateDB = async () => {
  try {
    await migrate(db, {
      migrationsFolder: "db/migrations",
    });

    await connection.end();
    console.log("Migration successful");
  } catch (error) {
    console.error("Migration failed", error);
    process.exit(1);
  }
};

migrateDB();
