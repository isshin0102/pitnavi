const PLATFORM_FEE_RATE = 0.10;

export interface FeeBreakdown {
  servicePrice: number;
  platformFee: number;
  shopPayout: number;
  feeRate: number;
}

export function calculatePlatformFee(amount: number): number {
  return Math.floor(amount * PLATFORM_FEE_RATE);
}

export function calculateFeeBreakdown(
  _category: string,
  _carType: string,
  servicePrice: number
): FeeBreakdown {
  const platformFee = calculatePlatformFee(servicePrice);
  return {
    servicePrice,
    platformFee,
    shopPayout: servicePrice - platformFee,
    feeRate: PLATFORM_FEE_RATE,
  };
}

export function formatYen(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")}`;
}
