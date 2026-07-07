import { calculatePlatformFee } from "@/lib/fee-calculator";
import { getStripeServer } from "./server";

export interface CreatePaymentParams {
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

  const platformFee = calculatePlatformFee(params.servicePrice);
  const customerTotal = params.servicePrice + platformFee;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: customerTotal,
    currency: "jpy",
    application_fee_amount: platformFee,
    transfer_data: {
      destination: params.shopStripeAccountId,
    },
    metadata: {
      reservation_id: params.reservationId,
      platform_fee: String(platformFee),
      shop_payout: String(params.servicePrice),
    },
    ...(params.customerEmail && {
      receipt_email: params.customerEmail,
    }),
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    platformFee,
    shopPayout: params.servicePrice,
    customerTotal,
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
    country: "JP",
    email,
  });

  return account.id;
}
