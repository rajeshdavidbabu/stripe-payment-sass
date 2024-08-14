import { db } from "@/db";
import {
  payments,
  subscribedUsers,
  subscriptionEvents,
  users,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    if (err instanceof Error) {
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }

  let customerEmail: string | null | undefined;
  let errors: string[] = [];
  let updates: string[] = [];

  try {
    switch (event.type) {
      case "customer.subscription.created": {

      
        const subscription = await stripe.subscriptions.retrieve(
          (event.data.object as Stripe.Subscription).id,
          {
            expand: ["customer"],
          }
        );

        const customerEmail = (subscription.customer as Stripe.Customer).email;

        if (!customerEmail) {
          throw new Error(
            `Customer email not found for subscription: ${subscription.id}`
          );
        }

        const plan = subscription.items.data[0].plan;
        const priceId = plan.id;
        let subscriptionType = "";

        if (priceId === process.env.PRICE_ID_SUBSCRIBER) {
          subscriptionType = "subscriber";
        } else {
          throw new Error(`Unknown or unsupported price ID ${priceId}`);
        }

        // Update subscribedUsers table
        await db.insert(subscribedUsers).values({
          email: customerEmail,
          type: "subscriber",
          subscriptionStatus: subscription.status,
          invoiceStatus: "pending", // Will be updated when invoice is paid
          currentPlan: subscriptionType,
          nextInvoiceDate: new Date(subscription.current_period_end * 1000),
        });

        updates.push(
          `Inserted/Updated ${customerEmail} in subscribed_users table`
        );

        // Record the subscription event
        await db.insert(subscriptionEvents).values({
          eventId: event.id,
          eventPayload: event,
          email: customerEmail,
        });

        updates.push(
          `Recorded event ${event.id} in subscription_events table for ${customerEmail}`
        );
        break;
      }
      case "invoice.paid": {
        const invoice = await stripe.invoices.retrieve(
          (event.data.object as Stripe.Invoice).id,
          {
            expand: ["subscription"],
          }
        );
        const customerEmail = invoice.customer_email;

        if (!customerEmail) {
          throw new Error(
            `Customer email not found for invoice: ${invoice.id}`
          );
        }

        const subscription = invoice.subscription as Stripe.Subscription;
        if (!subscription) {
          throw new Error(`Subscription not found for invoice: ${invoice.id}`);
        }

        const plan = subscription.items.data[0].plan;
        const priceId = plan.id;

        let subscriptionType = "";
        if (priceId === process.env.PRICE_ID_SUBSCRIBER) {
          subscriptionType = "subscriber";
        } else {
          throw new Error(`Unknown or unsupported price ID ${priceId}`);
        }

        await db
          .update(subscribedUsers)
          .set({
            invoiceStatus: "paid",
            currentPlan: subscriptionType,
            nextInvoiceDate: new Date(subscription.current_period_end * 1000),
            subscriptionStatus: subscription.status,
          })
          .where(eq(subscribedUsers.email, customerEmail));

        updates.push(
          `Updated invoice status to 'paid', plan to '${subscriptionType}', subscription status to '${subscription.status}', and next invoice date for ${customerEmail}`
        );

        // Record the invoice paid event
        await db.insert(subscriptionEvents).values({
          eventId: event.id,
          eventPayload: event,
          email: customerEmail,
        });

        updates.push(
          `Recorded invoice paid event ${event.id} for ${customerEmail}`
        );
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (err) {
    errors.push(`Error occurred at payment-success db update: ${err}`);

    return NextResponse.json(
      {
        received: true,
        email: customerEmail || "missing email",
        updates,
        errors,
      },
      {
        status: 500,
      }
    );
  }

  return NextResponse.json({
    received: true,
    email: customerEmail,
    updates,
    errors,
  });
}
