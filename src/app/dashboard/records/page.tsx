"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkRecordCard } from "@/components/work-record-card";
import { isSupabaseConfigured } from "@/lib/supabase/helpers";
import { getCurrentUser } from "@/lib/data/auth";
import { getMyWorkRecords } from "@/lib/data/dashboard";
import { MOCK_WORK_RECORDS } from "@/lib/mock-data";
import type { WorkRecord } from "@/lib/types";

export default function RecordsPage() {
  const [records, setRecords] = useState<WorkRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!isSupabaseConfigured()) {
        setRecords(MOCK_WORK_RECORDS.filter((r) => r.shop_id === "shop-1"));
        setLoading(false);
        return;
      }

      const user = await getCurrentUser();
      if (!user) { setLoading(false); return; }

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: shops } = await supabase
        .from("shops")
        .select("id")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      const shop = shops?.[0] ?? null;
      if (shop) {
        const data = await getMyWorkRecords(shop.id);
        setRecords(data);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />読み込み中...
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">作業実績</h2>
        <Button size="sm" render={<Link href="/dashboard/records/new" />}>
          <Plus className="mr-1 h-4 w-4" />
          実績を投稿
        </Button>
      </div>

      {records.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          作業実績がまだ投稿されていません
        </p>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <WorkRecordCard key={record.id} record={record} />
          ))}
        </div>
      )}
    </div>
  );
}
