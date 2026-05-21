import { NextResponse } from "next/server";
import type { ServiceCategory, CarType } from "@/lib/types";
import { calculateFeeBreakdown } from "@/lib/fee-calculator";
import { getStripeServer } from "@/lib/stripe/server";

interface CreateIntentBody {
  category: ServiceCategory;
  carType: CarType;
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

    const breakdown = calculateFeeBreakdown(
      body.category,
      body.carType,
      body.servicePrice
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount: breakdown.servicePrice,
      currency: "jpy",
      application_fee_amount: breakdown.platformFee,
      transfer_data: {
        destination: body.shopStripeAccountId,
      },
      metadata: {
        reservation_id: body.reservationId,
        category: body.category,
        car_type: body.carType,
        platform_fee: String(breakdown.platformFee),
        shop_payout: String(breakdown.shopPayout),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      breakdown,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Payment creation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
