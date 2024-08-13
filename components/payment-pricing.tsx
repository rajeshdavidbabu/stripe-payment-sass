import { CheckIcon } from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";

const pricingPlans = [
  {
    title: "Starter",
    price: 2.99,
    currency: "EUR",
    frequency: "/one-time",
    link: "https://buy.stripe.com/test_9AQ5n86yQ8fY5EccMP",
    description: "Perfect for individuals who want to try out the product.",
    features: ["250000 tokens"],
    cta: "Buy now",
  },
  {
    title: "Expert",
    price: 6.99,
    currency: "EUR",
    frequency: "/one-time",
    link: "https://buy.stripe.com/test_00g8zk3mEdAi2s0cMQ",
    description: "For users who can't get enough",
    features: ["800000 tokens"],
    cta: "Buy now",
  },
];

function generateStripeLink(baseLink: string, email: string) {
  const encodedEmail = encodeURIComponent(email);
  return `${baseLink}?prefilled_email=${encodedEmail}`;
}

export default function Pricing() {
  return (
    <div className="grid  lg:grid-cols-2 gap-12 lg:gap-8 py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {pricingPlans.map((plan) => (
        <div
          key={plan.title}
          className={`p-8 bg-white rounded-2xl relative flex flex-col border-slate-200 border-2 shadow-lg`}
        >
          <h3 className="text-xl font-semibold text-slate-9000 leading-5">
            {plan.title}
          </h3>
          <p className="mt-4 text-slate-700 text-sm leading-6">
            {plan.description}
          </p>
          <div className="mt-4 p-6 rounded-lg -mx-6">
            <p className="text-sm font-semibold text-slate-500 flex items-center">
              <span>{plan.currency}</span>
              <span className="ml-3 text-4xl text-slate-900 ">
                ${plan.price}
              </span>
              <span className=" ml-1.5">{plan.frequency}</span>
            </p>
          </div>
          <ul className="mt-6 space-y-4 flex-1">
            {plan.features.map((feature) => (
              <li
                key={feature}
                className="text-slate-700 text-sm leading-6 flex"
              >
                <CheckIcon className="h-5 w-5 text-cyan-500 shrink-0" />
                <span className="ml-3">{feature}</span>
              </li>
            ))}
          </ul>
          <Button>
            <Link href={plan.link}>{plan.cta}</Link>
          </Button>
        </div>
      ))}
    </div>
  );
}
