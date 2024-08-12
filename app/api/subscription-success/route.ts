import { db } from "@/db";
import { payments, users } from "@/db/schema";
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
      case "checkout.session.completed":
        const session = await stripe.checkout.sessions.retrieve(
          event.data.object.id,
          {
            expand: ["line_items", "customer"],
          }
        );

         customerEmail =
          session.customer_details?.email || session.customer_email;
        const priceId = session.line_items?.data[0]?.price?.id;

        if (!customerEmail) {
          throw new Error(`Customer email not found for session: ${session.id}`);
        }

        if (!priceId) {
            throw new Error(`Price ID not found for session: ${session.id}`);
          }
        
          let subscriptionType = '';
          if (priceId === process.env.PRICE_ID_UNLIMITED) {
            subscriptionType = 'unlimited';
          } else {
            throw new Error(`Unknown or unsupported price ID ${priceId}`);
          }
        
          const currentUserArr = await db
            .select()
            .from(users)
            .where(eq(users.email, customerEmail))
            .limit(1);
        
          if (!currentUserArr || currentUserArr.length === 0) {
            throw new Error(
              `User not found on the database for email: ${customerEmail}`
            );
          }
        
          const currentUser = currentUserArr[0];
        
          // Check if user is already subscribed
          if (currentUser.type === 'subscriber') {
            throw new Error(`User ${customerEmail} is already subscribed`);
          }
        
          // Update the user's subscription type and set tokens to infinity in the database
          await db
            .update(users)
            .set({
              tokens: Number.POSITIVE_INFINITY,
              type: 'subscriber',
              subscription: subscriptionType
            })
            .where(eq(users.email, customerEmail));

        updates.push(
          `Updated tokens for ${customerEmail}: ${currentUser.tokens} -> unlimited`
        );

        // Store the payment information
        await db.insert(payments).values({
          email: customerEmail,
          id: session.id,
          checkoutSessionObject: session,
        });

        updates.push(`Inserted ${session.id} in payments table for ${customerEmail}`);
        break;
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
