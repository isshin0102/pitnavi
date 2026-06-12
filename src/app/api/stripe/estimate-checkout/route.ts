import { NextResponse } from "next/server";
import { getStripeServer } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    // 認証チェック
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
    const {
      reservationId,
      shopName,
      menuName,
      quotedPrice,
      workMemo,
      origin,
    } = body;

    if (!reservationId || !quotedPrice) {
      return NextResponse.json(
        { error: "reservationId and quotedPrice are required." },
        { status: 400 }
      );
    }

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
      metadata: {
        reservation_id: reservationId,
        checkout_type: "estimate",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Estimate checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
