"use client";

import { useState } from "react";
import { CreditCard, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { FeeBreakdown } from "@/lib/fee-calculator";
import { formatYen } from "@/lib/fee-calculator";

export interface ReservationData {
  shop_id: string;
  service_menu_id: string;
  car_type: "light" | "standard";
  preferred_date: string;
  preferred_time: string;
  customer_name: string;
  customer_phone: string;
  customer_note?: string;
}

interface PaymentFormProps {
  breakdown: FeeBreakdown;
  shopName: string;
  menuName: string;
  reservationData: ReservationData;
  onPaymentComplete: () => void;
}

export function PaymentForm({
  breakdown,
  shopName,
  menuName,
  reservationData,
  onPaymentComplete,
}: PaymentFormProps) {
  const [status, setStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");

  async function handlePay() {
    setStatus("processing");
    try {
      // 1. ログインユーザーのIDを取得
      const { getCurrentUser } = await import("@/lib/data/auth");
      const user = await getCurrentUser();

      // 2. Supabaseに予約レコードを作成
      const { createReservation } = await import("@/lib/data/dashboard");
      await createReservation({
        customer_id: user?.id ?? "anonymous",
        shop_id: reservationData.shop_id,
        service_menu_id: reservationData.service_menu_id,
        car_type: reservationData.car_type,
        preferred_date: reservationData.preferred_date,
        preferred_time: reservationData.preferred_time,
        customer_name: reservationData.customer_name,
        customer_phone: reservationData.customer_phone,
        customer_note: reservationData.customer_note,
        total_price: breakdown.servicePrice,
        platform_fee: breakdown.platformFee,
        shop_payout: breakdown.shopPayout,
      });

      setStatus("success");
      setTimeout(onPaymentComplete, 1500);
    } catch (e) {
      console.error("[PaymentForm] reservation create error:", e);
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="py-6 text-center">
          <CheckCircle className="mx-auto h-10 w-10 text-green-500 mb-3" />
          <p className="font-medium text-green-800">お支払いが完了しました</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          お支払い情報
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md bg-muted/50 p-3 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">作業メニュー</span>
            <span>{menuName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">工場</span>
            <span>{shopName}</span>
          </div>
          <div className="flex justify-between border-t pt-1 mt-1">
            <span className="text-muted-foreground">作業料金</span>
            <span>{formatYen(breakdown.servicePrice)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-lg font-bold border-t pt-3">
          <span>お支払い合計</span>
          <span>{formatYen(breakdown.servicePrice)}</span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              カード番号
            </label>
            <div className="rounded-md border bg-background px-3 py-2.5 text-sm text-muted-foreground">
              Stripe Elements（接続後に有効化）
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                有効期限
              </label>
              <div className="rounded-md border bg-background px-3 py-2.5 text-sm text-muted-foreground">
                MM / YY
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                CVC
              </label>
              <div className="rounded-md border bg-background px-3 py-2.5 text-sm text-muted-foreground">
                123
              </div>
            </div>
          </div>
        </div>

        {status === "error" && (
          <div className="flex items-center gap-2 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" />
            お支払いに失敗しました。もう一度お試しください。
          </div>
        )}

        <Button
          onClick={handlePay}
          disabled={status === "processing"}
          className="w-full"
          size="lg"
        >
          {status === "processing" ? (
            "処理中..."
          ) : (
            <>
              <Lock className="mr-1 h-4 w-4" />
              {formatYen(breakdown.servicePrice)} を支払う
            </>
          )}
        </Button>

        <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
          <Lock className="h-3 w-3" />
          Stripeによる安全な決済
        </p>
      </CardContent>
    </Card>
  );
}
