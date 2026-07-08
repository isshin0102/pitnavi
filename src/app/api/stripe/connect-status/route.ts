import { NextResponse } from "next/server";
import { getStripeServer } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { shopId } = await request.json();
    if (!shopId) {
      return NextResponse.json({ error: "shopId is required" }, { status: 400 });
    }

    const { data: shop } = await supabase
      .from("shops")
      .select("stripe_account_id, stripe_onboarded")
      .eq("id", shopId)
      .eq("owner_id", user.id)
      .single();

    if (!shop?.stripe_account_id) {
      return NextResponse.json({ onboarded: false });
    }

    if (shop.stripe_onboarded) {
      return NextResponse.json({ onboarded: true });
    }

    const stripe = getStripeServer();
    if (!stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
    }

    const account = await stripe.accounts.retrieve(shop.stripe_account_id);
    const onboarded = account.charges_enabled && account.payouts_enabled;

    if (onboarded) {
      await supabase
        .from("shops")
        .update({ stripe_onboarded: true })
        .eq("id", shopId)
        .eq("owner_id", user.id);
    }

    return NextResponse.json({ onboarded });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Status check failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
