"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkRecordCard } from "@/components/work-record-card";
import { MOCK_WORK_RECORDS } from "@/lib/mock-data";
import type { WorkRecord } from "@/lib/types";

export default function RecordsPage() {
  const [records] = useState<WorkRecord[]>(
    MOCK_WORK_RECORDS.filter((r) => r.shop_id === "shop-1")
  );

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
