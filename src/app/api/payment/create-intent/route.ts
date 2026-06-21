import { NextResponse } from "next/server";
import { calculatePlatformFee } from "@/lib/fee-calculator";
import { getStripeServer } from "@/lib/stripe/server";

interface CreateIntentBody {
  servicePrice: number;
  shopStripeAccountId: string;
  reservationId: string;
}

export async function POST(request: Request) {
  try {
    const body: CreateIntentBody = await request.json();
    const stripe = getStripeServer();

    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured. Set STRIPE_SECRET_KEY." },
        { status: 503 }
      );
    }

    const platformFee = calculatePlatformFee(body.servicePrice);
    const shopPayout = body.servicePrice - platformFee;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: body.servicePrice,
      currency: "jpy",
      application_fee_amount: platformFee,
      transfer_data: {
        destination: body.shopStripeAccountId,
      },
      metadata: {
        reservation_id: body.reservationId,
        platform_fee: String(platformFee),
        shop_payout: String(shopPayout),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      platformFee,
      shopPayout,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Payment creation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
