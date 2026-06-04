"use client";

import { useState } from "react";
import { CreditCard, Lock, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
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
  const [errorMsg, setErrorMsg] = useState("");

  async function handlePay() {
    setStatus("processing");
    setErrorMsg("");

    try {
      // 1. ログインユーザーのIDを取得
      const { getCurrentUser } = await import("@/lib/data/auth");
      const user = await getCurrentUser();

      if (!user) {
        setErrorMsg("ログインが必要です。ログインページからやり直してください。");
        setStatus("error");
        return;
      }

      // 2. Supabaseに予約レコードを作成
      const { createReservation } = await import("@/lib/data/dashboard");
      const reservation = await createReservation({
        customer_id: user.id,
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

      // 3. Stripe Checkout Session を作成
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId: reservation.id,
          shopId: reservationData.shop_id,
          shopName,
          menuName,
          totalPrice: breakdown.servicePrice,
          platformFee: breakdown.platformFee,
          origin: window.location.origin,
        }),
      });

      const data = await res.json();

      if (data.url) {
        // Stripe Checkout ページにリダイレクト
        window.location.href = data.url;
        return;
      }

      // Stripe未設定の場合 → 予約のみ完了として処理
      if (data.error?.includes("not configured")) {
        console.log("[PaymentForm] Stripe not configured, reservation only");
        setStatus("success");
        setTimeout(onPaymentComplete, 1500);
        return;
      }

      throw new Error(data.error || "決済の初期化に失敗しました");
    } catch (e) {
      console.error("[PaymentForm] error:", e);
      setErrorMsg(
        e instanceof Error ? e.message : "お支払い処理中にエラーが発生しました"
      );
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="py-6 text-center">
          <CheckCircle className="mx-auto h-10 w-10 text-green-500 mb-3" />
          <p className="font-medium text-green-800">予約が完了しました</p>
          <p className="text-xs text-green-600 mt-1">
            Stripe連携後はカード決済が利用可能になります
          </p>
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
          <div className="flex justify-between text-[10px]">
            <span className="text-muted-foreground">（うちプラットフォーム手数料）</span>
            <span className="text-muted-foreground">{formatYen(breakdown.platformFee)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-lg font-bold border-t pt-3">
          <span>お支払い合計</span>
          <span>{formatYen(breakdown.servicePrice)}</span>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">
            <AlertCircle className="h-3 w-3 shrink-0" />
            {errorMsg}
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
              <ExternalLink className="ml-1 h-3 w-3" />
            </>
          )}
        </Button>

        <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
          <Lock className="h-3 w-3" />
          Stripeの安全な決済ページへ移動します
        </p>
      </CardContent>
    </Card>
  );
}
