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

    const { email } = await request.json();
    const stripe = getStripeServer();

    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 503 }
      );
    }

    const account = await stripe.accounts.create({
      type: "standard",
      email,
      country: "JP",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    const origin = new URL(request.url).origin;
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      return_url: `${origin}/dashboard?stripe=success`,
      refresh_url: `${origin}/dashboard?stripe=refresh`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      accountId: account.id,
      onboardingUrl: accountLink.url,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Account creation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
