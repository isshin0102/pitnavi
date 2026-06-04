import { NextResponse } from "next/server";
import { getStripeServer } from "@/lib/stripe/server";
import { createClient } from "@supabase/supabase-js";

// Webhook は service_role キーで DB を更新する（RLS バイパス）
function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

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

    const supabase = getAdminSupabase();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const reservationId = session.metadata?.reservation_id;

        if (reservationId && supabase) {
          // 予約ステータスを confirmed に、決済情報を保存
          await supabase
            .from("reservations")
            .update({
              status: "confirmed",
              payment_status: "paid",
              stripe_payment_intent_id: session.payment_intent as string,
              confirmed_at: new Date().toISOString(),
            })
            .eq("id", reservationId);

          console.log(`[Webhook] Reservation ${reservationId} → confirmed + paid`);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object;
        const reservationId = pi.metadata?.reservation_id;

        if (reservationId && supabase) {
          await supabase
            .from("reservations")
            .update({ payment_status: "failed" })
            .eq("id", reservationId);

          console.log(`[Webhook] Payment failed for reservation: ${reservationId}`);
        }
        break;
      }

      case "account.updated": {
        const account = event.data.object;
        if (account.charges_enabled && account.payouts_enabled && supabase) {
          await supabase
            .from("shops")
            .update({ stripe_onboarded: true })
            .eq("stripe_account_id", account.id);

          console.log(`[Webhook] Stripe account ${account.id} fully onboarded`);
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
