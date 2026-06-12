"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { ServiceMenu, CarType } from "@/lib/types";
import { SERVICE_CATEGORY_LABELS, CAR_TYPE_LABELS } from "@/lib/types";
import { formatYen, calculateFeeBreakdown } from "@/lib/fee-calculator";
import { MenuDetailModal } from "@/components/menu-detail-modal";
import { Clock } from "lucide-react";

interface ServiceMenuTableProps {
  menus: ServiceMenu[];
  selectedCarType?: CarType;
  onSelect?: (menu: ServiceMenu) => void;
  showFeeBreakdown?: boolean;
}

export function ServiceMenuTable({
  menus,
  selectedCarType = "standard",
  onSelect,
  showFeeBreakdown = false,
}: ServiceMenuTableProps) {
  const [detailMenu, setDetailMenu] = useState<ServiceMenu | null>(null);

  function handleClick(menu: ServiceMenu) {
    // 予約フロー中（onSelect が渡されている）ならそちらを優先
    if (onSelect) {
      onSelect(menu);
    } else {
      // 閲覧モード：詳細モーダルを開く
      setDetailMenu(menu);
    }
  }

  return (
    <>
      <div className="space-y-2">
        {menus.map((menu) => {
          const price =
            selectedCarType === "light" ? menu.price_light : menu.price_standard;
          const breakdown = showFeeBreakdown
            ? calculateFeeBreakdown(menu.category, selectedCarType, price)
            : null;

          return (
            <div
              key={menu.id}
              className="rounded-lg border p-3 cursor-pointer transition-all hover:shadow-md hover:bg-accent/30 active:scale-[0.99]"
              onClick={() => handleClick(menu)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {SERVICE_CATEGORY_LABELS[menu.category]}
                    </Badge>
                    <span className="font-medium text-sm truncate">
                      {menu.name}
                    </span>
                  </div>
                  {menu.description && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {menu.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    {menu.estimated_minutes && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        約{menu.estimated_minutes}分
                      </span>
                    )}
                    {!onSelect && (
                      <span className="text-[10px] text-primary font-medium">
                        詳細を見る →
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-sm">{formatYen(price)}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {CAR_TYPE_LABELS[selectedCarType]}
                  </div>
                </div>
              </div>
              {breakdown && (
                <div className="mt-2 pt-2 border-t text-[10px] text-muted-foreground flex gap-3">
                  <span>手数料: {formatYen(breakdown.platformFee)}</span>
                  <span>店舗受取: {formatYen(breakdown.shopPayout)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <MenuDetailModal
        menu={detailMenu}
        open={!!detailMenu}
        onOpenChange={(open) => { if (!open) setDetailMenu(null); }}
        showFeeBreakdown={showFeeBreakdown}
      />
    </>
  );
}
