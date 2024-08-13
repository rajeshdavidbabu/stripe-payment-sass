import { Button } from "@/components/ui/button";
import Link from "next/link";
import { db } from "@/db";
import { users as usersTable } from "@/db/schema";
import { InferSelectModel } from "drizzle-orm";

type User = InferSelectModel<typeof usersTable>;

export default async function Home() {
  let users: User[] = [];

  try {
    users = await db.select().from(usersTable);
  } catch (error) {
    console.error(error);
    users = [];
  }

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 p-24">
      <Button asChild>
        <Link href="/payments/buy-tokens">Buy now</Link>
      </Button>

      <table className="min-w-full bg-white border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-2 px-4 border-b">Email</th>
            <th className="py-2 px-4 border-b">Type</th>
            <th className="py-2 px-4 border-b">Tokens</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, index) => (
            <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : ""}>
              <td className="py-2 px-4 border-b text-center">{user.email}</td>
              <td className="py-2 px-4 border-b text-center">{user.type}</td>
              <td className="py-2 px-4 border-b text-center">{user.tokens}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
