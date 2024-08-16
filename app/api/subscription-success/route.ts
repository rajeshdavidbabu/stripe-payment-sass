import { db } from "@/db";
import { subscribedUsers, subscriptionEvents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(req: NextRequest) {
  const { event, error } = await constructStripeEvent(req);
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
  } catch (err) {
    return handleError(err, customerEmail, updates, errors);
  }

  return NextResponse.json({
    received: true,
    email: customerEmail,
    updates,
    errors,
  });
}

async function constructStripeEvent(
  req: NextRequest
): Promise<{ event?: Stripe.Event; error?: NextResponse }> {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") as string;

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET_SUB!
    );
    return { event };
  } catch (err) {
    const error = createErrorResponse(err);
    return { error };
  }
}

async function handleSubscriptionCreated(
  event: Stripe.Event,
  updates: string[]
) {
  const subscription = await retrieveSubscription(event);
  const customerEmail = getCustomerEmail(subscription);
  const subscriptionType = getSubscriptionType(subscription);

  await updateSubscribedUser(customerEmail, subscription, subscriptionType);
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
  const subscription = await retrieveSubscription(event);
  const customerEmail = getCustomerEmail(subscription);
  const subscriptionType = getSubscriptionType(subscription);

  await updateSubscribedUser(customerEmail, subscription, subscriptionType);
  await recordSubscriptionEvent(event, customerEmail);

  updates.push(
    `Updated subscription details and recorded event ${event.id} for ${customerEmail}`
  );
}

async function handleSubscriptionDeleted(
  event: Stripe.Event,
  updates: string[]
) {
  const subscription = await retrieveSubscription(event);
  const customerEmail = getCustomerEmail(subscription);

  await resetSubscription(customerEmail);
  await recordSubscriptionEvent(event, customerEmail);

  updates.push(
    `Deleted subscription and recorded event ${event.id} for ${customerEmail}`
  );
}

async function retrieveSubscription(
  event: Stripe.Event
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.retrieve(
    (event.data.object as Stripe.Subscription).id,
    { expand: ["customer"] }
  );
}

function getCustomerEmail(subscription: Stripe.Subscription): string {
  const customerEmail = (subscription.customer as Stripe.Customer).email;
  if (!customerEmail) {
    throw new Error(
      `Customer email not found for subscription: ${subscription.id}`
    );
  }
  return customerEmail;
}

function getSubscriptionType(subscription: Stripe.Subscription): string {
  const priceId = subscription.items.data[0].plan.id;
  if (priceId === process.env.PRICE_ID_SUBSCRIBER) {
    return "subscriber-basic";
  } else if (priceId === process.env.PRICE_ID_SUBSCRIBER_PRO) {
    return "subscriber-pro";
  }
  throw new Error(`Unknown or unsupported price ID ${priceId}`);
}

function getCustomerEmailFromInvoice(invoice: Stripe.Invoice): string {
  const customerEmail = invoice.customer_email;
  if (!customerEmail) {
    throw new Error(`Customer email not found for invoice: ${invoice.id}`);
  }
  return customerEmail;
}

async function updateSubscribedUser(
  customerEmail: string,
  subscription: Stripe.Subscription,
  subscriptionType: string
) {
  // If the subscription is set to cancel at the end of the period, set the next invoice date to null
  const nextInvoiceDate = subscription.cancel_at_period_end
    ? null
    : new Date(subscription.current_period_end * 1000);

  await db
    .update(subscribedUsers)
    .set({
      type: "subscribed",
      subscriptionStatus: subscription.status,
      currentPlan: subscriptionType,
      nextInvoiceDate,
    })
    .where(eq(subscribedUsers.email, customerEmail));
}

async function resetSubscription(customerEmail: string) {
  await db
    .update(subscribedUsers)
    .set({
      type: "free",
      subscriptionStatus: null,
      currentPlan: null,
      invoiceStatus: null,
      nextInvoiceDate: null,
    })
    .where(eq(subscribedUsers.email, customerEmail));
}

async function updateInvoiceStatus(customerEmail: string, status: string) {
  await db
    .update(subscribedUsers)
    .set({ invoiceStatus: status })
    .where(eq(subscribedUsers.email, customerEmail));
}

async function recordSubscriptionEvent(
  event: Stripe.Event,
  customerEmail: string
) {
  await db.insert(subscriptionEvents).values({
    eventId: event.id,
    eventPayload: event,
    email: customerEmail,
  });
}

function createErrorResponse(err: unknown): NextResponse {
  if (err instanceof Error) {
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }
  return NextResponse.json({ error: "Unknown error" }, { status: 500 });
}

function handleError(
  err: unknown,
  customerEmail: string | null | undefined,
  updates: string[],
  errors: string[]
): NextResponse {
  const errorMessage = err instanceof Error ? err.message : "Unknown error";
  errors.push(`Error occurred at payment-success db update: ${errorMessage}`);

  return NextResponse.json(
    {
      received: true,
      email: customerEmail || "missing email",
      updates,
      errors,
    },
    { status: 500 }
  );
}
