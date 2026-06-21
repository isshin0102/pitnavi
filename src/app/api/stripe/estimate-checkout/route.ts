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
        { error: "Stripe is not configured." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { reservationId, shopName, menuName, quotedPrice, workMemo, origin } = body;

    if (!reservationId || !quotedPrice) {
      return NextResponse.json(
        { error: "reservationId and quotedPrice are required." },
        { status: 400 }
      );
    }

    const { data: reservation } = await supabase
      .from("reservations")
      .select("shop_id")
      .eq("id", reservationId)
      .single();

    if (!reservation) {
      return NextResponse.json({ error: "予約が見つかりません" }, { status: 404 });
    }

    const { data: shop } = await supabase
      .from("shops")
      .select("stripe_account_id, stripe_onboarded")
      .eq("id", reservation.shop_id)
      .single();

    if (!shop?.stripe_account_id || !shop.stripe_onboarded) {
      return NextResponse.json(
        { error: "この店舗はまだStripe連携が完了していません" },
        { status: 400 }
      );
    }

    const platformFee = calculatePlatformFee(quotedPrice);

    const description = [
      `${shopName ?? "店舗"} - ${menuName ?? "作業"}`,
      workMemo ? `内容: ${workMemo}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "jpy",
            product_data: {
              name: `見積もり承諾: ${menuName ?? "作業"}`,
              description,
            },
            unit_amount: quotedPrice,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/mypage/estimate-success?reservation_id=${reservationId}`,
      cancel_url: `${origin}/mypage?cancelled=true`,
      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: shop.stripe_account_id,
        },
      },
      metadata: {
        reservation_id: reservationId,
        checkout_type: "estimate",
        platform_fee: String(platformFee),
        shop_payout: String(quotedPrice - platformFee),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Estimate checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
