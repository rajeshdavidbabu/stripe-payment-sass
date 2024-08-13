import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8">
      <Button asChild>
        <Link href="/payments">Payments</Link>
      </Button>

      <Button asChild>
        <Link href="/subscriptions">Subscriptions</Link>
      </Button>
    </main>
  );
}
