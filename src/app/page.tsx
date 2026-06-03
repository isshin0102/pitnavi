"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Search,
  MapPin,
  Loader2,
  SlidersHorizontal,
  X,
  Navigation,
} from "lucide-react";
import { ShopCard } from "@/components/shop-card";
import { Badge } from "@/components/ui/badge";
import { getShops, getAllMenus } from "@/lib/data/shops";
import { sortShopsByDistance, formatDistance } from "@/lib/geo-utils";
import type { Shop, ServiceMenu } from "@/lib/types";
import type { MapCenter } from "@/components/map-view";

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

/* ---------- ジャンルフィルター候補 ---------- */
const GENRE_FILTERS = [
  "ドリフト",
  "シャコタン",
  "VIP",
  "オフロード",
  "スポーツカー",
  "旧車・レストア",
  "輸入車",
  "EV・ハイブリッド",
  "タイヤ交換",
  "オイル交換",
  "車検",
  "板金・塗装",
  "エアロ",
  "足回り",
  "マフラー",
  "ラッピング",
];

export default function HomePage() {
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [menus, setMenus] = useState<ServiceMenu[]>([]);
  const [loading, setLoading] = useState(true);

  // 検索・フィルター
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [showGenreFilter, setShowGenreFilter] = useState(false);

  // マップ連動
  const [mapCenter, setMapCenter] = useState<MapCenter>({
    lat: 35.6894,
    lng: 139.6917,
  });

  // ホバー連動
  const [hoveredShopId, setHoveredShopId] = useState<string | null>(null);

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

  const handleMoveEnd = useCallback((center: MapCenter) => {
    setMapCenter(center);
  }, []);

  function toggleGenre(genre: string) {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  }

  // フィルタリング + ソート
  const filteredAndSortedShops = useMemo(() => {
    let result = [...shops];

    // キーワード検索（店名、住所、紹介文）
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q) ||
          (s.description && s.description.toLowerCase().includes(q)) ||
          (s.specialty && s.specialty.some((sp) => sp.toLowerCase().includes(q)))
      );
    }

    // ジャンルフィルター
    if (selectedGenres.length > 0) {
      result = result.filter(
        (s) =>
          s.specialty &&
          selectedGenres.some((g) => s.specialty.includes(g))
      );
    }

    // 距離順ソート
    return sortShopsByDistance(result, mapCenter.lat, mapCenter.lng);
  }, [shops, searchQuery, selectedGenres, mapCenter]);

  // マップに表示されるジャンル一覧（実際のデータから抽出）
  const availableGenres = useMemo(() => {
    const all = new Set<string>();
    shops.forEach((s) => s.specialty?.forEach((sp) => all.add(sp)));
    // データにあるものを先に、なければフィルター候補から
    const fromData = Array.from(all);
    const extra = GENRE_FILTERS.filter((g) => !all.has(g));
    return [...fromData, ...extra];
  }, [shops]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        読み込み中...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* ヘッダー */}
      <section className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          近くの整備工場をさがす
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          タイヤ交換・オイル交換・車検・カスタムをかんたん予約
        </p>
      </section>

      {/* 検索バー */}
      <section className="mb-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="店名・住所・ジャンルで検索..."
              className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-10 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowGenreFilter(!showGenreFilter)}
            className={`shrink-0 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
              showGenreFilter || selectedGenres.length > 0
                ? "bg-primary text-primary-foreground"
                : "bg-background hover:bg-accent"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        {/* 選択中ジャンルバッジ */}
        {selectedGenres.length > 0 && !showGenreFilter && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {selectedGenres.map((g) => (
              <Badge
                key={g}
                variant="secondary"
                className="gap-1 pl-2 pr-1 py-0.5 cursor-pointer"
                onClick={() => toggleGenre(g)}
              >
                {g}
                <X className="h-3 w-3" />
              </Badge>
            ))}
            <button
              onClick={() => setSelectedGenres([])}
              className="text-[11px] text-muted-foreground hover:text-foreground ml-1"
            >
              クリア
            </button>
          </div>
        )}

        {/* ジャンルフィルターパネル */}
        {showGenreFilter && (
          <div className="mt-2 rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground mb-2">
              得意ジャンルで絞り込み（タップで選択）
            </p>
            <div className="flex flex-wrap gap-1.5">
              {availableGenres.map((genre) => {
                const active = selectedGenres.includes(genre);
                return (
                  <button
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* マップ */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            マップ
          </h2>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Navigation className="h-3 w-3" />
            マップを動かすと近くの店が並び替わります
          </span>
        </div>
        <MapView
          shops={filteredAndSortedShops}
          onShopClick={handleShopClick}
          onMoveEnd={handleMoveEnd}
          selectedShopId={hoveredShopId}
        />
      </section>

      {/* 検索結果 / おすすめショップ */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {searchQuery || selectedGenres.length > 0
              ? `検索結果（${filteredAndSortedShops.length}件）`
              : "近くのおすすめ工場"}
          </h2>
          {filteredAndSortedShops.length > 0 && (
            <span className="text-xs text-muted-foreground">
              距離順で表示
            </span>
          )}
        </div>

        {filteredAndSortedShops.length === 0 ? (
          <div className="py-12 text-center">
            <Search className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              条件に合う工場が見つかりませんでした
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedGenres([]);
              }}
              className="text-sm text-primary mt-2 hover:underline"
            >
              フィルターをクリア
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedShops.map((shop) => (
              <ShopCard
                key={shop.id}
                shop={shop}
                menus={menus.filter((m) => m.shop_id === shop.id)}
                distance={shop.distance}
                highlighted={hoveredShopId === shop.id}
                onHover={setHoveredShopId}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
