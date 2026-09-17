import { NextResponse } from "next/server";
import { getStripeServer } from "@/lib/stripe/server";
import { createClient } from "@supabase/supabase-js";
import { sendBookingConfirmation } from "@/lib/email/send";
import {
  sendLinePushMessage,
  buildReservationNotificationMessages,
} from "@/lib/line/send";

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
        const checkoutType = session.metadata?.checkout_type;

        if (reservationId && supabase) {
          if (checkoutType === "estimate") {
            await supabase
              .from("reservations")
              .update({
                status: "contracted",
                payment_status: "paid",
                estimate_payment_intent_id: session.payment_intent as string,
                contracted_at: new Date().toISOString(),
              })
              .eq("id", reservationId);

            console.log(`[Webhook] Estimate paid: ${reservationId} → contracted`);
          } else {
            await supabase
              .from("reservations")
              .update({
                status: "confirmed",
                payment_status: "paid",
                stripe_payment_intent_id: session.payment_intent as string,
                confirmed_at: new Date().toISOString(),
              })
              .eq("id", reservationId);

            console.log(`[Webhook] Booking paid: ${reservationId} → confirmed`);
          }

          // メール通知 + LINE通知送信
          try {
            const { data: reservation } = await supabase
              .from("reservations")
              .select("*, service_menus(name), shops(name, owner_id, line_channel_access_token)")
              .eq("id", reservationId)
              .single();

            if (reservation) {
              const ownerEmail = reservation.shops?.owner_id
                ? (await supabase.auth.admin.getUserById(reservation.shops.owner_id))
                    .data?.user?.email
                : null;

              const customerEmail = session.customer_details?.email
                || (await supabase.auth.admin.getUserById(reservation.customer_id))
                    .data?.user?.email;

              const notificationParams = {
                customerName: reservation.customer_name,
                shopName: reservation.shops?.name ?? "店舗",
                menuName: reservation.service_menus?.name ?? "作業",
                date: reservation.preferred_date,
                time: reservation.preferred_time,
                price: reservation.quoted_price ?? reservation.total_price,
              };

              // メール通知
              if (customerEmail) {
                await sendBookingConfirmation({
                  ...notificationParams,
                  customerEmail,
                  shopEmail: ownerEmail ?? "",
                });
                console.log(`[Webhook] Notification emails sent for: ${reservationId}`);
              }

              // LINE通知
              const lineToken = reservation.shops?.line_channel_access_token;
              if (lineToken) {
                try {
                  const { data: follower } = await supabase
                    .from("line_followers")
                    .select("line_user_id")
                    .eq("shop_id", reservation.shop_id)
                    .eq("pitnavi_user_id", reservation.customer_id)
                    .single();

                  if (follower) {
                    await sendLinePushMessage(
                      lineToken,
                      follower.line_user_id,
                      buildReservationNotificationMessages(notificationParams)
                    );
                    console.log(`[Webhook] LINE notification sent for: ${reservationId}`);
                  }
                } catch (lineErr) {
                  console.error("[Webhook] LINE notification failed:", lineErr);
                }
              }
            }
          } catch (emailErr) {
            console.error("[Webhook] Notification failed:", emailErr);
          }
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
