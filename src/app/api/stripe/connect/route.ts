import { NextResponse } from "next/server";
import { getStripeServer } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    // 認証チェック: ログインユーザーのみ Stripe アカウント作成を許可
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    const { email, shopId } = await request.json();
    const stripe = getStripeServer();

    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 503 }
      );
    }

    let accountId: string;

    if (shopId) {
      const { data: shop } = await supabase
        .from("shops")
        .select("stripe_account_id")
        .eq("id", shopId)
        .eq("owner_id", user.id)
        .single();

      if (shop?.stripe_account_id) {
        accountId = shop.stripe_account_id;
      } else {
        const account = await stripe.accounts.create({
          type: "standard",
          country: "JP",
          email: email || user.email,
        });
        accountId = account.id;
      }
    } else {
      const account = await stripe.accounts.create({
        type: "standard",
        country: "JP",
        email: email || user.email,
      });
      accountId = account.id;
    }

    if (shopId) {
      await supabase
        .from("shops")
        .update({ stripe_account_id: accountId })
        .eq("id", shopId)
        .eq("owner_id", user.id);
    }

    const origin = new URL(request.url).origin;
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      return_url: `${origin}/dashboard?stripe=success`,
      refresh_url: `${origin}/dashboard?stripe=refresh`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      accountId,
      onboardingUrl: accountLink.url,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Account creation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
