import { CheckIcon } from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";

const pricingPlans = [
  {
    title: "Subscriber Basic",
    price: 11.99,
    currency: "EUR",
    link: "https://buy.stripe.com/test_eVa2aW1ewcwe3w428e",
    frequency: "/month",
    description: "For small teams and businesses.",
    features: ["Access to our pro features"],
    cta: "Subscribe now",
  },
  {
    title: "Subscriber Pro",
    price: 19.99,
    currency: "EUR",
    frequency: "/month",
    link: "https://buy.stripe.com/test_8wM02ObTaeEmfeM5kr",
    description: "For large teams and businesses.",
    features: ["Access to our pro, enterprise support and AI features"],
    cta: "Subscribe now",
  },
];

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
