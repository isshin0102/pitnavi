"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Loader2,
  CalendarDays,
  MapPin,
  Phone,
  FileText,
  CheckCircle2,
  Clock,
  Car,
  CircleDot,
  Ban,
  HandCoins,
  ClipboardList,
  Store,
  LogIn,
  CreditCard,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  RESERVATION_STATUS_LABELS,
  CAR_TYPE_LABELS,
  SERVICE_CATEGORY_LABELS,
} from "@/lib/types";
import type { ReservationStatus, ServiceCategory } from "@/lib/types";
import { formatYen } from "@/lib/fee-calculator";
import { isSupabaseConfigured } from "@/lib/supabase/helpers";
import { useReservationRealtime } from "@/lib/supabase/use-realtime";
import { getCurrentUser } from "@/lib/data/auth";
import { getCustomerReservations } from "@/lib/data/dashboard";

/* ---------- ステータス別カラー & アイコン（店側と統一） ---------- */

const STATUS_COLORS: Record<ReservationStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  confirmed: "bg-blue-100 text-blue-800 border-blue-300",
  visited: "bg-purple-100 text-purple-800 border-purple-300",
  quoted: "bg-orange-100 text-orange-800 border-orange-300",
  contracted: "bg-emerald-100 text-emerald-800 border-emerald-300",
  completed: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-gray-100 text-gray-500 border-gray-300",
};

const STATUS_ICONS: Record<ReservationStatus, typeof Clock> = {
  pending: Clock,
  confirmed: CalendarDays,
  visited: Car,
  quoted: FileText,
  contracted: HandCoins,
  completed: CheckCircle2,
  cancelled: Ban,
};

/** ステータスの補足メッセージ（お客様向け） */
const STATUS_DESCRIPTIONS: Record<ReservationStatus, string> = {
  pending: "工場が予約リクエストを確認中です",
  confirmed: "予約が確定しました。当日のご来店をお待ちしています",
  visited: "ご来店ありがとうございます。点検・見積中です",
  quoted: "見積もりが届いています。内容をご確認ください",
  contracted: "作業が確定しました。完了までお待ちください",
  completed: "作業が完了しました。ありがとうございました",
  cancelled: "この予約はキャンセルされました",
};

/* ---------- ステップインジケータ ---------- */

const STEP_STATUSES: ReservationStatus[] = [
  "pending",
  "confirmed",
  "visited",
  "quoted",
  "contracted",
  "completed",
];

function StatusStepper({ current }: { current: ReservationStatus }) {
  const currentIdx = STEP_STATUSES.indexOf(current);
  const isCancelled = current === "cancelled";

  return (
    <div className="flex items-center gap-0.5 mt-3">
      {STEP_STATUSES.map((s, i) => {
        const done = !isCancelled && i <= currentIdx;
        return (
          <div key={s} className="flex items-center flex-1">
            <div
              className={`h-1.5 w-full rounded-full transition-colors ${
                done ? "bg-primary" : "bg-muted"
              }`}
            />
          </div>
        );
      })}
    </div>
  );
}

/* ---------- モックデータ ---------- */

const MOCK_RESERVATIONS = [
  {
    id: "cres-1",
    shop_id: "shop-1",
    customer_name: "テスト ユーザー",
    customer_phone: "090-0000-0000",
    car_type: "light" as const,
    preferred_date: "2026-05-25",
    preferred_time: "10:00",
    status: "confirmed" as ReservationStatus,
    total_price: 4800,
    platform_fee: 800,
    shop_payout: 4000,
    quoted_price: null,
    work_memo: null,
    customer_note: "タイヤ持ち込み",
    created_at: "2026-05-22T08:00:00Z",
    shops: { name: "タイヤショップ田中", address: "東京都渋谷区1-2-3", phone: "03-1234-5678" },
    service_menus: { name: "タイヤ交換（4本）", category: "tire_change" as ServiceCategory },
  },
  {
    id: "cres-2",
    shop_id: "shop-2",
    customer_name: "テスト ユーザー",
    customer_phone: "090-0000-0000",
    car_type: "standard" as const,
    preferred_date: "2026-05-20",
    preferred_time: "14:00",
    status: "quoted" as ReservationStatus,
    total_price: 4500,
    platform_fee: 650,
    shop_payout: 3850,
    quoted_price: 55000,
    work_memo: "ブレーキパッド残量少のため交換推奨",
    customer_note: null,
    created_at: "2026-05-18T10:00:00Z",
    shops: { name: "オートサービス鈴木", address: "東京都新宿区4-5-6", phone: "03-9876-5432" },
    service_menus: { name: "車検（法定費用別）", category: "inspection" as ServiceCategory },
  },
  {
    id: "cres-3",
    shop_id: "shop-1",
    customer_name: "テスト ユーザー",
    customer_phone: "090-0000-0000",
    car_type: "light" as const,
    preferred_date: "2026-05-10",
    preferred_time: "09:00",
    status: "completed" as ReservationStatus,
    total_price: 3200,
    platform_fee: 550,
    shop_payout: 2650,
    quoted_price: 3200,
    work_memo: "交換完了。次回は5000km後を推奨",
    customer_note: null,
    created_at: "2026-05-08T11:00:00Z",
    shops: { name: "タイヤショップ田中", address: "東京都渋谷区1-2-3", phone: "03-1234-5678" },
    service_menus: { name: "エンジンオイル交換", category: "oil_change" as ServiceCategory },
  },
];

/* ---------- フィルタータブ ---------- */

const FILTER_TABS: { label: string; statuses: ReservationStatus[] }[] = [
  {
    label: "進行中",
    statuses: ["pending", "confirmed", "visited", "quoted", "contracted"],
  },
  { label: "完了", statuses: ["completed"] },
  { label: "すべて", statuses: [] },
];

/* ---------- メインコンポーネント ---------- */

export default function MyPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [activeFilter, setActiveFilter] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (!isSupabaseConfigured()) {
          setLoggedIn(true);
          setReservations(MOCK_RESERVATIONS);
          return;
        }

        const user = await getCurrentUser();
        if (!user) {
          setLoggedIn(false);
          return;
        }
        setLoggedIn(true);
        setUserId(user.id);

        const data = await getCustomerReservations(user.id);
        setReservations(data);
      } catch (e) {
        console.error("[MyPage] load error:", e);
        setReservations(MOCK_RESERVATIONS);
        setLoggedIn(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ---------- Supabase Realtime: ステータス自動更新 ---------- */
  useReservationRealtime(
    userId ? `customer_id=eq.${userId}` : null,
    (updatedRow) => {
      // UPDATE: 既存予約をリアルタイムで差し替え
      setReservations((prev) =>
        prev.map((r) =>
          r.id === updatedRow.id
            ? { ...r, ...updatedRow }
            : r
        )
      );
    },
    (newRow) => {
      // INSERT: 新規予約を先頭に追加
      setReservations((prev) => [newRow, ...prev]);
    }
  );

  /** 見積もりを承諾して Stripe Checkout へ遷移 */
  async function handleAcceptEstimate(res: any) {
    setPayingId(res.id);
    try {
      const response = await fetch("/api/stripe/estimate-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId: res.id,
          shopName: res.shops?.name ?? "店舗",
          menuName: res.service_menus?.name ?? "作業",
          quotedPrice: res.quoted_price,
          workMemo: res.work_memo ?? "",
          origin: window.location.origin,
        }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "決済ページの作成に失敗しました");
        setPayingId(null);
      }
    } catch (e) {
      alert("通信エラーが発生しました");
      setPayingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        読み込み中...
      </div>
    );
  }

  if (loggedIn === false) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
        <h1 className="text-lg font-bold mb-2">マイページ</h1>
        <p className="text-sm text-muted-foreground mb-6">
          予約状況を確認するにはログインしてください
        </p>
        <Button render={<Link href="/login" />}>
          <LogIn className="mr-2 h-4 w-4" />
          ログイン
        </Button>
      </div>
    );
  }

  const filtered =
    FILTER_TABS[activeFilter].statuses.length === 0
      ? reservations
      : reservations.filter((r) =>
          FILTER_TABS[activeFilter].statuses.includes(r.status)
        );

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <ClipboardList className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">マイページ</h1>
      </div>

      {/* フィルタータブ */}
      <div className="flex gap-1 mb-4">
        {FILTER_TABS.map((tab, i) => {
          const count =
            tab.statuses.length === 0
              ? reservations.length
              : reservations.filter((r) =>
                  tab.statuses.includes(r.status)
                ).length;
          return (
            <button
              key={tab.label}
              onClick={() => setActiveFilter(i)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activeFilter === i
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className="ml-1 opacity-70">({count})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 予約一覧 */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            予約はまだありません
          </p>
          <Button variant="outline" render={<Link href="/" />}>
            <MapPin className="mr-2 h-4 w-4" />
            工場をさがす
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((res) => {
            const status = res.status as ReservationStatus;
            const StatusIcon = STATUS_ICONS[status];
            const shopName = res.shops?.name ?? "店舗名不明";
            const menuName = res.service_menus?.name ?? "メニュー不明";
            const menuCategory = res.service_menus?.category as
              | ServiceCategory
              | undefined;

            return (
              <Card key={res.id} className="overflow-hidden">
                {/* ステータスヘッダー帯 */}
                <div
                  className={`px-4 py-2 flex items-center justify-between ${STATUS_COLORS[status]}`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <StatusIcon className="h-3.5 w-3.5" />
                    {RESERVATION_STATUS_LABELS[status]}
                  </div>
                  {menuCategory && (
                    <span className="text-[10px] opacity-75">
                      {SERVICE_CATEGORY_LABELS[menuCategory]}
                    </span>
                  )}
                </div>

                <CardContent className="pt-3">
                  {/* ステータス補足メッセージ */}
                  <p className="text-xs text-muted-foreground mb-3">
                    {STATUS_DESCRIPTIONS[status]}
                  </p>

                  {/* 店舗 & メニュー情報 */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <Store className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">{shopName}</p>
                        {res.shops?.address && (
                          <p className="text-xs text-muted-foreground">
                            {res.shops.address}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>
                        {res.preferred_date} {res.preferred_time}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>
                        {menuName} / {CAR_TYPE_LABELS[res.car_type as keyof typeof CAR_TYPE_LABELS]}
                      </span>
                    </div>

                    {res.customer_note && (
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <span className="text-xs text-muted-foreground">
                          {res.customer_note}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 見積情報（quoted 以降で表示） */}
                  {res.quoted_price && (
                    <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-orange-800">
                          見積金額
                        </span>
                        <span className="text-base font-bold text-orange-900">
                          {formatYen(res.quoted_price)}
                        </span>
                      </div>
                      {res.work_memo && (
                        <p className="mt-1.5 text-xs text-orange-700 leading-relaxed">
                          {res.work_memo}
                        </p>
                      )}

                      {/* 見積もり承諾 & 決済ボタン（quoted ステータスのときだけ） */}
                      {status === "quoted" && (
                        <Button
                          className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => handleAcceptEstimate(res)}
                          disabled={payingId === res.id}
                        >
                          {payingId === res.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              決済ページへ移動中...
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-4 w-4 mr-2" />
                              この見積もりで依頼する（決済へ進む）
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* 予約時の金額（見積前の場合） */}
                  {!res.quoted_price && res.total_price > 0 && (
                    <div className="mt-3 pt-2 border-t flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">お支払い金額</span>
                      <span className="font-bold">
                        {formatYen(res.total_price)}
                      </span>
                    </div>
                  )}

                  {/* ステップインジケータ */}
                  <StatusStepper current={status} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
