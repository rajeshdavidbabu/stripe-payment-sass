import { Button } from "@/components/ui/button";
import Link from "next/link";
import { db } from "@/db";
import { subscribedUsers as subscribedUsersTable } from "@/db/schema";
import { InferSelectModel } from "drizzle-orm";

type SubscribedUser = InferSelectModel<typeof subscribedUsersTable>;

export default async function Home() {
  let subscribedUsers: SubscribedUser[] = [];

  try {
    subscribedUsers = await db.select().from(subscribedUsersTable);
  } catch (error) {
    console.error(error);
    subscribedUsers = [];
  }

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 p-24">
      <div className="flex flex-col items-center gap-8">
        <Button asChild>
          <Link href="/subscriptions/buy-subscription">Buy now</Link>
        </Button>
        <Button asChild>
          <Link href="https://billing.stripe.com/p/login/test_bIY6rN36V9lb3hCfYY">
            Billing
          </Link>
        </Button>
      </div>

      <table className="min-w-full bg-white border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-2 px-4 border-b">Email</th>
            <th className="py-2 px-4 border-b">Type</th>
            <th className="py-2 px-4 border-b">Subscription Status</th>
            <th className="py-2 px-4 border-b">Invoice Status</th>
            <th className="py-2 px-4 border-b">Plan</th>
            <th className="py-2 px-4 border-b">Next Invoice Date</th>
            <th className="py-2 px-4 border-b">App Subscription Status</th>
          </tr>
        </thead>
        <tbody>
          {subscribedUsers.map((user, index) => (
            <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : ""}>
              <td className="py-2 px-4 border-b text-center">{user.email}</td>
              <td className="py-2 px-4 border-b text-center">{user.type}</td>
              <td className="py-2 px-4 border-b text-center">
                {user.subscriptionStatus}
              </td>
              <td className="py-2 px-4 border-b text-center">
                {user.invoiceStatus}
              </td>
              <td className="py-2 px-4 border-b text-center">
                {user.currentPlan}
              </td>
              <td className="py-2 px-4 border-b text-center">
                {user.nextInvoiceDate
                  ? new Date(user.nextInvoiceDate).toLocaleDateString()
                  : "-"}
              </td>
              {/* This needs to be calculated based on the user's subscription status and invoice status */}
              <td className="py-2 px-4 border-b text-center">-</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
