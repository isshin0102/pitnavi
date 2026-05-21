import { NextResponse } from "next/server";
import { getStripeServer } from "@/lib/stripe/server";

export async function POST(request: Request) {
  const stripe = getStripeServer();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object;
        const reservationId = pi.metadata.reservation_id;
        // TODO: Update reservation status to 'confirmed' in Supabase
        console.log(`Payment succeeded for reservation: ${reservationId}`);
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object;
        console.log(`Payment failed for reservation: ${pi.metadata.reservation_id}`);
        break;
      }
      case "account.updated": {
        const account = event.data.object;
        if (account.charges_enabled && account.payouts_enabled) {
          // TODO: Update shop stripe_onboarded = true in Supabase
          console.log(`Stripe account ${account.id} fully onboarded`);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
