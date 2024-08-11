import Pricing from "@/components/pricing";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function PricingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-8 p-24">
      <Button asChild>
        <Link href="/">Home</Link>
      </Button>
      <Pricing />
    </main>
  );
}
