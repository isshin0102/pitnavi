"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Search, MapPin, Loader2 } from "lucide-react";
import { ShopCard } from "@/components/shop-card";
import { getShops, getAllMenus } from "@/lib/data/shops";
import type { Shop, ServiceMenu } from "@/lib/types";

const MapView = dynamic(
  () => import("@/components/map-view").then((m) => m.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-lg border bg-muted/50 h-64 md:h-80 flex items-center justify-center text-sm text-muted-foreground">
        地図を読み込み中...
      </div>
    ),
  }
);

export default function HomePage() {
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [menus, setMenus] = useState<ServiceMenu[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, m] = await Promise.all([getShops(), getAllMenus()]);
        setShops(s);
        setMenus(m);
      } catch (e) {
        console.error("Failed to load shops:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function handleShopClick(shop: Shop) {
    router.push(`/shops/${shop.id}`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />読み込み中...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <section className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          近くの整備工場をさがす
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          タイヤ交換・オイル交換・車検をかんたん予約
        </p>
      </section>

      <section className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="エリア・駅名・キーワードで検索..."
            className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </section>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            マップ
          </h2>
        </div>
        <MapView shops={shops} onShopClick={handleShopClick} />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">おすすめの整備工場</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shops.map((shop) => (
            <ShopCard
              key={shop.id}
              shop={shop}
              menus={menus.filter((m) => m.shop_id === shop.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
