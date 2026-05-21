import type { ServiceCategory, CarType } from "@/lib/types";
import { calculateFeeBreakdown } from "@/lib/fee-calculator";
import { getStripeServer } from "./server";

export interface CreatePaymentParams {
  category: ServiceCategory;
  carType: CarType;
  servicePrice: number;
  shopStripeAccountId: string;
  reservationId: string;
  customerEmail?: string;
}

export async function createPaymentIntent(params: CreatePaymentParams) {
  const stripe = getStripeServer();
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  const breakdown = calculateFeeBreakdown(
    params.category,
    params.carType,
    params.servicePrice
  );

  const paymentIntent = await stripe.paymentIntents.create({
    amount: breakdown.servicePrice,
    currency: "jpy",
    application_fee_amount: breakdown.platformFee,
    transfer_data: {
      destination: params.shopStripeAccountId,
    },
    metadata: {
      reservation_id: params.reservationId,
      category: params.category,
      car_type: params.carType,
      platform_fee: String(breakdown.platformFee),
      shop_payout: String(breakdown.shopPayout),
    },
    ...(params.customerEmail && {
      receipt_email: params.customerEmail,
    }),
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    breakdown,
  };
}

export async function createConnectAccountLink(
  accountId: string,
  returnUrl: string,
  refreshUrl: string
) {
  const stripe = getStripeServer();
  if (!stripe) throw new Error("Stripe is not configured");

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    return_url: returnUrl,
    refresh_url: refreshUrl,
    type: "account_onboarding",
  });

  return accountLink.url;
}

export async function createConnectAccount(email: string) {
  const stripe = getStripeServer();
  if (!stripe) throw new Error("Stripe is not configured");

  const account = await stripe.accounts.create({
    type: "standard",
    email,
    country: "JP",
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });

  return account.id;
}
