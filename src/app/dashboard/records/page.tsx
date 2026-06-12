"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Loader2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkRecordCard } from "@/components/work-record-card";
import { ShopSelector } from "@/components/shop-selector";
import { isSupabaseConfigured } from "@/lib/supabase/helpers";
import { getCurrentUser } from "@/lib/data/auth";
import { getMyShops, getMyWorkRecords } from "@/lib/data/dashboard";
import { MOCK_WORK_RECORDS } from "@/lib/mock-data";
import type { WorkRecord, Shop } from "@/lib/types";

export default function RecordsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [records, setRecords] = useState<WorkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);

  const fetchRecords = useCallback(async (shopId: string) => {
    setRecordsLoading(true);
    try {
      const data = await getMyWorkRecords(shopId);
      setRecords(data);
    } catch (e) {
      console.error("[RecordsPage] fetch error:", e);
      setRecords([]);
    }
    setRecordsLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      if (!isSupabaseConfigured()) {
        setRecords(MOCK_WORK_RECORDS.filter((r) => r.shop_id === "shop-1"));
        setLoading(false);
        return;
      }

      const user = await getCurrentUser();
      if (!user) { setLoading(false); return; }

      const myShops = (await getMyShops(user.id)) as Shop[];
      setShops(myShops);

      if (myShops.length > 0) {
        const firstId = myShops[0].id;
        setSelectedShopId(firstId);
        await fetchRecords(firstId);
      }
      setLoading(false);
    })();
  }, [fetchRecords]);

  async function handleShopChange(shopId: string) {
    setSelectedShopId(shopId);
    await fetchRecords(shopId);
  }

  const selectedShopName = shops.find((s) => s.id === selectedShopId)?.name ?? "";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />読み込み中...
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
        <h2 className="text-lg font-semibold">作業実績</h2>
        <Button size="sm" render={<Link href={`/dashboard/records/new${selectedShopId ? `?shopId=${selectedShopId}` : ""}`} />}>
          <Plus className="mr-1 h-4 w-4" />
          実績を投稿
        </Button>
      </div>

      <ShopSelector
        shops={shops}
        selectedShopId={selectedShopId}
        onSelect={handleShopChange}
        label="作業実績を表示する店舗を選択"
        subtitle={`${records.length}件の実績`}
      />

      {recordsLoading ? (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />読み込み中...
        </div>
      ) : records.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          「{selectedShopName}」の作業実績がまだ投稿されていません
        </p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground mb-2">
            「{selectedShopName}」の実績（{records.length}件）
          </p>
          <div className="space-y-3">
            {records.map((record) => (
              <WorkRecordCard key={record.id} record={record} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
