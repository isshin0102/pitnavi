"use client";

import { Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import type { Shop } from "@/lib/types";

interface ShopSelectorProps {
  shops: Shop[];
  selectedShopId: string | null;
  onSelect: (shopId: string) => void;
  /** セレクター上部のラベル（省略時は「店舗を選択」） */
  label?: string;
  /** 1店舗の場合にメニュー件数などを表示するサブテキスト */
  subtitle?: string;
}

export function ShopSelector({
  shops,
  selectedShopId,
  onSelect,
  label = "表示する店舗を選択",
  subtitle,
}: ShopSelectorProps) {
  const selectedShop = shops.find((s) => s.id === selectedShopId);

  if (shops.length === 0) return null;

  // 1店舗のみ → バッジ表示
  if (shops.length === 1) {
    return (
      <div className="mb-4 flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
        <Store className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm font-medium">{shops[0].name}</span>
        {subtitle && (
          <Badge variant="secondary" className="text-[10px]">
            {subtitle}
          </Badge>
        )}
      </div>
    );
  }

  // 複数店舗 → ドロップダウン
  return (
    <div className="mb-4">
      <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
        <Store className="h-3 w-3" />
        {label}
      </Label>
      <select
        value={selectedShopId ?? ""}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm font-medium"
      >
        {shops.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
            {s.address ? ` — ${s.address}` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
