import type { ServiceCategory, CarType } from "./types";

type FeeKey = `${ServiceCategory}:${CarType}` | `${ServiceCategory}:*`;

const PLATFORM_FEES: Record<string, number> = {
  "tire_change:light": 800,
  "tire_change:standard": 1500,
  "oil_change:light": 550,
  "oil_change:standard": 650,
  "inspection:*": 4500,
};

export interface FeeBreakdown {
  servicePrice: number;
  platformFee: number;
  shopPayout: number;
}

function buildKey(category: ServiceCategory, carType: CarType): FeeKey {
  return `${category}:${carType}`;
}

function buildWildcardKey(category: ServiceCategory): FeeKey {
  return `${category}:*`;
}

export function getPlatformFee(
  category: ServiceCategory,
  carType: CarType
): number {
  const exact = PLATFORM_FEES[buildKey(category, carType)];
  if (exact !== undefined) return exact;

  const wildcard = PLATFORM_FEES[buildWildcardKey(category)];
  if (wildcard !== undefined) return wildcard;

  return 0;
}

export function calculateFeeBreakdown(
  category: ServiceCategory,
  carType: CarType,
  servicePrice: number
): FeeBreakdown {
  const platformFee = getPlatformFee(category, carType);
  return {
    servicePrice,
    platformFee,
    shopPayout: servicePrice - platformFee,
  };
}

export function formatYen(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")}`;
}

export function getAllFeeRules(): {
  category: ServiceCategory;
  carType: CarType | "*";
  fee: number;
}[] {
  return Object.entries(PLATFORM_FEES).map(([key, fee]) => {
    const [category, carType] = key.split(":") as [
      ServiceCategory,
      CarType | "*",
    ];
    return { category, carType, fee };
  });
}
