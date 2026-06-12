"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Loader2, Camera, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShopSelector } from "@/components/shop-selector";
import { WORK_CATEGORY_LABELS } from "@/lib/types";
import type { Work, Shop } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/helpers";
import { getCurrentUser } from "@/lib/data/auth";
import { getMyShops } from "@/lib/data/dashboard";
import { getWorksByShop } from "@/lib/data/works";

export default function WorksListPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [worksLoading, setWorksLoading] = useState(false);

  const fetchWorks = useCallback(async (shopId: string) => {
    setWorksLoading(true);
    try {
      const data = await getWorksByShop(shopId);
      setWorks(data);
    } catch (e) {
      console.error("[WorksListPage] fetch error:", e);
      setWorks([]);
    }
    setWorksLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (!isSupabaseConfigured()) {
          setLoading(false);
          return;
        }
        const user = await getCurrentUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const myShops = (await getMyShops(user.id)) as Shop[];
        setShops(myShops);

        if (myShops.length > 0) {
          const firstId = myShops[0].id;
          setSelectedShopId(firstId);
          await fetchWorks(firstId);
        }
      } catch (e) {
        console.error("[WorksListPage]", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchWorks]);

  async function handleShopChange(shopId: string) {
    setSelectedShopId(shopId);
    await fetchWorks(shopId);
  }

  const selectedShopName = shops.find((s) => s.id === selectedShopId)?.name ?? "";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        読み込み中...
      </div>
    );
  }

  if (shops.length === 0 && isSupabaseConfigured()) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        まず「概要」ページで店舗を登録してください
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">実績ギャラリー</h2>
        <Button size="sm" render={<Link href={`/dashboard/works/new${selectedShopId ? `?shopId=${selectedShopId}` : ""}`} />}>
          <Plus className="mr-1 h-4 w-4" />
          実績を投稿
        </Button>
      </div>

      <ShopSelector
        shops={shops}
        selectedShopId={selectedShopId}
        onSelect={handleShopChange}
        label="実績ギャラリーを表示する店舗を選択"
        subtitle={`${works.length}件の実績`}
      />

      {worksLoading ? (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />読み込み中...
        </div>
      ) : works.length === 0 ? (
        <div className="py-12 text-center">
          <Camera className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            「{selectedShopName}」の実績がまだ投稿されていません
          </p>
          <Button
            variant="outline"
            size="sm"
            render={<Link href={`/dashboard/works/new${selectedShopId ? `?shopId=${selectedShopId}` : ""}`} />}
          >
            <Plus className="mr-1 h-4 w-4" />
            最初の実績を投稿する
          </Button>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground mb-2">
            「{selectedShopName}」の実績（{works.length}件）
          </p>
          <div className="grid grid-cols-2 gap-3">
            {works.map((work) => (
              <Card key={work.id} className="overflow-hidden">
                {work.before_image_url || work.after_image_url ? (
                  <div className="grid grid-cols-2 aspect-[2/1]">
                    <div className="relative bg-muted">
                      {work.before_image_url ? (
                        <img src={work.before_image_url} alt="Before" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-muted-foreground/30" />
                        </div>
                      )}
                      <span className="absolute bottom-0 left-0 bg-black/60 text-white text-[8px] px-1.5 py-0.5">Before</span>
                    </div>
                    <div className="relative bg-muted">
                      {work.after_image_url ? (
                        <img src={work.after_image_url} alt="After" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-muted-foreground/30" />
                        </div>
                      )}
                      <span className="absolute bottom-0 left-0 bg-primary/90 text-white text-[8px] px-1.5 py-0.5">After</span>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-[2/1] bg-muted flex items-center justify-center">
                    <Camera className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                )}
                <CardContent className="p-2">
                  <div className="flex items-center gap-1 mb-1">
                    <Badge variant="outline" className="text-[9px]">
                      {WORK_CATEGORY_LABELS[work.category] ?? work.category}
                    </Badge>
                  </div>
                  <p className="text-xs font-medium line-clamp-1">{work.title}</p>
                  {work.car_name && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{work.car_name}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
