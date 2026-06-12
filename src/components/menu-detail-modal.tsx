"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { ServiceMenu, CarType } from "@/lib/types";
import { SERVICE_CATEGORY_LABELS, CAR_TYPE_LABELS } from "@/lib/types";
import { formatYen, calculateFeeBreakdown } from "@/lib/fee-calculator";
import { Clock, Banknote, Car } from "lucide-react";

interface MenuDetailModalProps {
  menu: ServiceMenu | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showFeeBreakdown?: boolean;
}

export function MenuDetailModal({
  menu,
  open,
  onOpenChange,
  showFeeBreakdown = false,
}: MenuDetailModalProps) {
  if (!menu) return null;

  const breakdownLight = showFeeBreakdown
    ? calculateFeeBreakdown(menu.category, "light", menu.price_light)
    : null;
  const breakdownStandard = showFeeBreakdown
    ? calculateFeeBreakdown(menu.category, "standard", menu.price_standard)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" className="text-xs">
              {SERVICE_CATEGORY_LABELS[menu.category]}
            </Badge>
            {menu.estimated_minutes && (
              <Badge variant="outline" className="text-[10px]">
                <Clock className="h-3 w-3 mr-0.5" />
                約{menu.estimated_minutes}分
              </Badge>
            )}
          </div>
          <DialogTitle className="text-base font-bold leading-snug">
            {menu.name}
          </DialogTitle>
        </DialogHeader>

        {/* 料金テーブル */}
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Car className="h-3.5 w-3.5" />
                    車種
                  </div>
                </th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                  <div className="flex items-center justify-end gap-1">
                    <Banknote className="h-3.5 w-3.5" />
                    料金
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="px-3 py-2.5">{CAR_TYPE_LABELS.light}</td>
                <td className="px-3 py-2.5 text-right font-bold">
                  {formatYen(menu.price_light)}
                </td>
              </tr>
              <tr className="border-t">
                <td className="px-3 py-2.5">{CAR_TYPE_LABELS.standard}</td>
                <td className="px-3 py-2.5 text-right font-bold">
                  {formatYen(menu.price_standard)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 手数料の内訳（店舗側のみ） */}
        {showFeeBreakdown && breakdownLight && breakdownStandard && (
          <div className="rounded-lg border overflow-hidden">
            <div className="px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
              手数料内訳
            </div>
            <div className="divide-y text-xs">
              <div className="flex items-center justify-between px-3 py-2">
                <span>{CAR_TYPE_LABELS.light}</span>
                <span>
                  手数料 {formatYen(breakdownLight.platformFee)} ／ 受取{" "}
                  {formatYen(breakdownLight.shopPayout)}
                </span>
              </div>
              <div className="flex items-center justify-between px-3 py-2">
                <span>{CAR_TYPE_LABELS.standard}</span>
                <span>
                  手数料 {formatYen(breakdownStandard.platformFee)} ／ 受取{" "}
                  {formatYen(breakdownStandard.shopPayout)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 説明文：全文表示 */}
        {menu.description && (
          <div className="rounded-lg bg-muted/30 p-3">
            <h4 className="text-xs font-medium text-muted-foreground mb-1.5">
              メニュー説明
            </h4>
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {menu.description}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
