/**
 * Haversine公式で2点間の距離(km)を計算
 */
export function getDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // 地球の半径 (km)
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * 距離を見やすい文字列にフォーマット
 * 1km未満は m 表示、それ以上は km 表示
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

/**
 * ショップ配列を指定座標から近い順にソートして返す
 * 各ショップに distance (km) を付与
 */
export function sortShopsByDistance<T extends { latitude: number; longitude: number }>(
  shops: T[],
  centerLat: number,
  centerLng: number
): (T & { distance: number })[] {
  return shops
    .map((shop) => ({
      ...shop,
      distance: getDistanceKm(centerLat, centerLng, shop.latitude, shop.longitude),
    }))
    .sort((a, b) => a.distance - b.distance);
}
