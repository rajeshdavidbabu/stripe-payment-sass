import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  constructStripeEvent,
  getCurrentPlan,
  getCustomerEmail,
  getCustomerEmailFromInvoice,
  handleError,
  recordSubscriptionEvent,
  resetSubscription,
  retrieveSubscription,
  updateInvoiceStatus,
  updateSubscribedUser,
} from "./helpers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(req: NextRequest) {
  const { event, error } = await constructStripeEvent(req, stripe);
  if (error || !event) return error;

  let customerEmail: string | null | undefined;
  let errors: string[] = [];
  let updates: string[] = [];

  try {
    switch (event.type) {
      case "customer.subscription.created":
        await handleSubscriptionCreated(event, updates);
        break;
      case "invoice.paid":
        await handleInvoicePaid(event, updates);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event, updates);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event, updates);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event, updates);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error) {
    return handleError(error, customerEmail, updates, errors);
  }

  return NextResponse.json({
    received: true,
    email: customerEmail,
    updates,
    errors,
  });
}

async function handleSubscriptionCreated(
  event: Stripe.Event,
  updates: string[]
) {
  const subscription = await retrieveSubscription(event, stripe);
  const customerEmail = getCustomerEmail(subscription);
  const currentPlan = getCurrentPlan(subscription);

  await updateSubscribedUser(customerEmail, subscription, currentPlan);
  await recordSubscriptionEvent(event, customerEmail);

  updates.push(
    `Created subscription for ${customerEmail} and recorded event ${event.id}`
  );
}

async function handleInvoicePaid(event: Stripe.Event, updates: string[]) {
  const invoice = event.data.object as Stripe.Invoice;
  const customerEmail = getCustomerEmailFromInvoice(invoice);

  await updateInvoiceStatus(customerEmail, "paid");
  await recordSubscriptionEvent(event, customerEmail);

  updates.push(
    `Updated invoice status to 'paid' and recorded event ${event.id} for ${customerEmail}`
  );
}

async function handleInvoicePaymentFailed(
  event: Stripe.Event,
  updates: string[]
) {
  const invoice = event.data.object as Stripe.Invoice;
  const customerEmail = getCustomerEmailFromInvoice(invoice);

  await updateInvoiceStatus(customerEmail, "unpaid");
  await recordSubscriptionEvent(event, customerEmail);

  updates.push(
    `Updated invoice status to 'unpaid' and recorded event ${event.id} for ${customerEmail}`
  );
}

async function handleSubscriptionUpdated(
  event: Stripe.Event,
  updates: string[]
) {
  const subscription = await retrieveSubscription(event, stripe);
  const customerEmail = getCustomerEmail(subscription);
  const currentPlan = getCurrentPlan(subscription);

  await updateSubscribedUser(customerEmail, subscription, currentPlan);
  await recordSubscriptionEvent(event, customerEmail);

  updates.push(
    `Updated subscription details and recorded event ${event.id} for ${customerEmail}`
  );
}

async function handleSubscriptionDeleted(
  event: Stripe.Event,
  updates: string[]
) {
  const subscription = await retrieveSubscription(event, stripe);
  const customerEmail = getCustomerEmail(subscription);

  await resetSubscription(customerEmail);
  await recordSubscriptionEvent(event, customerEmail);

  updates.push(
    `Deleted subscription and recorded event ${event.id} for ${customerEmail}`
  );
}
