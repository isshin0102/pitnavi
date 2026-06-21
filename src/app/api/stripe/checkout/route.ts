import { NextResponse } from "next/server";
import { getStripeServer } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import { calculatePlatformFee } from "@/lib/fee-calculator";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const stripe = getStripeServer();
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured. Set STRIPE_SECRET_KEY." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { reservationId, shopId, shopName, menuName, totalPrice, origin } = body;

    const { data: shop } = await supabase
      .from("shops")
      .select("stripe_account_id, stripe_onboarded")
      .eq("id", shopId)
      .single();

    if (!shop?.stripe_account_id || !shop.stripe_onboarded) {
      return NextResponse.json(
        { error: "この店舗はまだStripe連携が完了していません" },
        { status: 400 }
      );
    }

    const platformFee = calculatePlatformFee(totalPrice);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "jpy",
            product_data: {
              name: menuName,
              description: `${shopName} - ${menuName}`,
            },
            unit_amount: totalPrice,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/reserve/${shopId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/reserve/${shopId}?cancelled=true`,
      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: shop.stripe_account_id,
        },
      },
      metadata: {
        reservation_id: reservationId,
        shop_id: shopId,
        platform_fee: String(platformFee),
        shop_payout: String(totalPrice - platformFee),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Checkout session creation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
