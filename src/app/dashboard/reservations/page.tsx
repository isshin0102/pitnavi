"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  CalendarDays,
  User,
  Phone,
  ChevronRight,
  X,
  FileText,
  CheckCircle2,
  Clock,
  Car,
  CircleDot,
  Ban,
  Wrench,
  HandCoins,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  RESERVATION_STATUS_LABELS,
  CAR_TYPE_LABELS,
  ADVANCE_BUTTON_LABELS,
  NEXT_STATUS_MAP,
} from "@/lib/types";
import type { ReservationStatus } from "@/lib/types";
import { formatYen } from "@/lib/fee-calculator";
import { isSupabaseConfigured } from "@/lib/supabase/helpers";
import { useReservationRealtime } from "@/lib/supabase/use-realtime";
import { getCurrentUser } from "@/lib/data/auth";
import {
  getMyReservations,
  advanceReservationStatus,
  cancelReservation,
} from "@/lib/data/dashboard";

/* ---------- ステータス別カラー & アイコン ---------- */

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

const ADVANCE_BUTTON_COLORS: Partial<Record<ReservationStatus, string>> = {
  pending: "bg-blue-600 hover:bg-blue-700 text-white",
  confirmed: "bg-purple-600 hover:bg-purple-700 text-white",
  visited: "bg-orange-600 hover:bg-orange-700 text-white",
  quoted: "bg-emerald-600 hover:bg-emerald-700 text-white",
  contracted: "bg-green-600 hover:bg-green-700 text-white",
};

/* ---------- モック予約データ ---------- */

const MOCK_RESERVATIONS = [
  {
    id: "res-1",
    customer_name: "佐藤 花子",
    customer_phone: "090-1111-2222",
    car_type: "light" as const,
    preferred_date: "2026-05-25",
    preferred_time: "10:00",
    status: "pending" as ReservationStatus,
    total_price: 4800,
    platform_fee: 800,
    shop_payout: 4000,
    quoted_price: null,
    work_memo: null,
    quoted_at: null,
    contracted_at: null,
    completed_at: null,
    visited_at: null,
    confirmed_at: null,
    customer_note: "タイヤは持ち込みです",
    service_menus: { name: "タイヤ交換（4本）" },
  },
  {
    id: "res-2",
    customer_name: "田中 一郎",
    customer_phone: "080-3333-4444",
    car_type: "standard" as const,
    preferred_date: "2026-05-26",
    preferred_time: "14:00",
    status: "confirmed" as ReservationStatus,
    total_price: 4500,
    platform_fee: 650,
    shop_payout: 3850,
    quoted_price: null,
    work_memo: null,
    quoted_at: null,
    contracted_at: null,
    completed_at: null,
    visited_at: null,
    confirmed_at: "2026-05-22T10:00:00Z",
    customer_note: null,
    service_menus: { name: "エンジンオイル交換" },
  },
  {
    id: "res-3",
    customer_name: "鈴木 次郎",
    customer_phone: "070-5555-6666",
    car_type: "light" as const,
    preferred_date: "2026-05-24",
    preferred_time: "09:00",
    status: "visited" as ReservationStatus,
    total_price: 38000,
    platform_fee: 4500,
    shop_payout: 33500,
    quoted_price: null,
    work_memo: null,
    quoted_at: null,
    contracted_at: null,
    completed_at: null,
    visited_at: "2026-05-24T09:15:00Z",
    confirmed_at: "2026-05-23T11:00:00Z",
    customer_note: "エンジン警告灯あり",
    service_menus: { name: "車検（法定費用別）" },
  },
];

/* ---------- フィルタータブ ---------- */

const FILTER_TABS: { label: string; statuses: ReservationStatus[] }[] = [
  { label: "対応中", statuses: ["pending", "confirmed", "visited", "quoted", "contracted"] },
  { label: "完了", statuses: ["completed"] },
  { label: "キャンセル", statuses: ["cancelled"] },
  { label: "すべて", statuses: [] },
];

/* ---------- メインコンポーネント ---------- */

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(0);
  const [updating, setUpdating] = useState<string | null>(null);
  const [shopId, setShopId] = useState<string | null>(null);

  // 見積ダイアログ
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [quoteTarget, setQuoteTarget] = useState<any>(null);
  const [quotedPrice, setQuotedPrice] = useState("");
  const [workMemo, setWorkMemo] = useState("");

  useEffect(() => {
    loadReservations();
  }, []);

  /* ---------- Supabase Realtime: 新規予約の自動追加 ---------- */
  useReservationRealtime(
    shopId ? `shop_id=eq.${shopId}` : null,
    (updatedRow) => {
      // 他端末でのステータス変更を反映
      setReservations((prev) =>
        prev.map((r) =>
          r.id === updatedRow.id ? { ...r, ...updatedRow } : r
        )
      );
    },
    (newRow) => {
      // 新規予約が入ったら先頭に追加
      setReservations((prev) => [newRow, ...prev]);
    }
  );

  async function loadReservations() {
    if (!isSupabaseConfigured()) {
      setReservations(MOCK_RESERVATIONS);
      setLoading(false);
      return;
    }

    const user = await getCurrentUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data: shops, error: shopErr } = await supabase
      .from("shops")
      .select("id")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (shopErr) {
      console.error("[Reservations] shop query error:", shopErr);
    }

    const shop = shops?.[0] ?? null;
    if (shop) {
      setShopId(shop.id);
      const data = await getMyReservations(shop.id);
      setReservations(data);
    }
    setLoading(false);
  }

  async function handleAdvance(reservation: any) {
    const currentStatus = reservation.status as ReservationStatus;
    const nextStatus = NEXT_STATUS_MAP[currentStatus];
    if (!nextStatus) return;

    // visited → quoted の場合は見積ダイアログを開く
    if (nextStatus === "quoted") {
      setQuoteTarget(reservation);
      setQuotedPrice(reservation.total_price?.toString() ?? "");
      setWorkMemo("");
      setQuoteDialogOpen(true);
      return;
    }

    setUpdating(reservation.id);
    try {
      if (isSupabaseConfigured()) {
        await advanceReservationStatus(reservation.id, nextStatus);
      }
      // ローカルステートを更新
      setReservations((prev) =>
        prev.map((r) =>
          r.id === reservation.id ? { ...r, status: nextStatus } : r
        )
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : "更新に失敗しました");
    }
    setUpdating(null);
  }

  async function handleQuoteSubmit() {
    if (!quoteTarget || !quotedPrice) return;

    setUpdating(quoteTarget.id);
    try {
      if (isSupabaseConfigured()) {
        await advanceReservationStatus(quoteTarget.id, "quoted", {
          quoted_price: parseInt(quotedPrice, 10),
          work_memo: workMemo || undefined,
        });
      }
      setReservations((prev) =>
        prev.map((r) =>
          r.id === quoteTarget.id
            ? {
                ...r,
                status: "quoted",
                quoted_price: parseInt(quotedPrice, 10),
                work_memo: workMemo || null,
              }
            : r
        )
      );
      setQuoteDialogOpen(false);
      setQuoteTarget(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "見積提示に失敗しました");
    }
    setUpdating(null);
  }

  async function handleCancel(reservation: any) {
    if (!confirm("この予約をキャンセルしますか？")) return;

    setUpdating(reservation.id);
    try {
      if (isSupabaseConfigured()) {
        await cancelReservation(reservation.id);
      }
      setReservations((prev) =>
        prev.map((r) =>
          r.id === reservation.id ? { ...r, status: "cancelled" } : r
        )
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : "キャンセルに失敗しました");
    }
    setUpdating(null);
  }

  // フィルタリング
  const filtered =
    FILTER_TABS[activeFilter].statuses.length === 0
      ? reservations
      : reservations.filter((r) =>
          FILTER_TABS[activeFilter].statuses.includes(r.status)
        );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        読み込み中...
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">予約管理</h2>

      {/* フィルタータブ */}
      <div className="flex gap-1 mb-4 overflow-x-auto">
        {FILTER_TABS.map((tab, i) => {
          const count =
            tab.statuses.length === 0
              ? reservations.length
              : reservations.filter((r) => tab.statuses.includes(r.status)).length;
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
        <p className="text-sm text-muted-foreground py-8 text-center">
          該当する予約がありません
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((res) => {
            const status = res.status as ReservationStatus;
            const StatusIcon = STATUS_ICONS[status];
            const nextStatus = NEXT_STATUS_MAP[status];
            const advanceLabel = ADVANCE_BUTTON_LABELS[status];
            const isUpdating = updating === res.id;
            const isCancellable = ["pending", "confirmed"].includes(status);

            return (
              <Card
                key={res.id}
                className={`border-l-4 ${STATUS_COLORS[status].split(" ").pop()}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <CardTitle className="text-sm truncate">
                        {res.service_menus?.name ?? "メニュー不明"}
                      </CardTitle>
                    </div>
                    <Badge
                      className={`text-[10px] shrink-0 flex items-center gap-1 ${STATUS_COLORS[status]}`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {RESERVATION_STATUS_LABELS[status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* 顧客情報 */}
                  <div className="grid gap-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 shrink-0" />
                      {res.customer_name}（{CAR_TYPE_LABELS[res.car_type as keyof typeof CAR_TYPE_LABELS]}）
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3 shrink-0" />
                      {res.customer_phone}
                    </div>
                    <div className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3 shrink-0" />
                      {res.preferred_date} {res.preferred_time}
                    </div>
                    {res.customer_note && (
                      <div className="flex items-start gap-1 mt-1">
                        <FileText className="h-3 w-3 shrink-0 mt-0.5" />
                        <span className="text-foreground">{res.customer_note}</span>
                      </div>
                    )}
                  </div>

                  {/* 金額情報 */}
                  <div className="mt-3 pt-2 border-t flex justify-between text-xs">
                    <span>
                      {res.quoted_price ? (
                        <>
                          見積: <strong className="text-orange-700">{formatYen(res.quoted_price)}</strong>
                        </>
                      ) : (
                        <>
                          合計: <strong>{formatYen(res.total_price)}</strong>
                        </>
                      )}
                    </span>
                    <span className="text-muted-foreground">
                      手数料: {formatYen(res.platform_fee)} / 受取:{" "}
                      {formatYen(res.total_price - res.platform_fee)}
                    </span>
                  </div>

                  {/* 見積メモ表示 */}
                  {res.work_memo && (
                    <div className="mt-2 p-2 rounded bg-orange-50 border border-orange-200 text-xs">
                      <span className="font-medium text-orange-800">作業メモ: </span>
                      <span className="text-orange-700">{res.work_memo}</span>
                    </div>
                  )}

                  {/* アクションボタン */}
                  {status !== "completed" && status !== "cancelled" && (
                    <div className="mt-3 pt-2 border-t flex gap-2">
                      {advanceLabel && nextStatus && (
                        <Button
                          size="sm"
                          className={`flex-1 text-xs ${ADVANCE_BUTTON_COLORS[status] ?? ""}`}
                          onClick={() => handleAdvance(res)}
                          disabled={isUpdating}
                        >
                          {isUpdating ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <ChevronRight className="h-3 w-3 mr-1" />
                          )}
                          {advanceLabel}
                        </Button>
                      )}
                      {isCancellable && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs text-destructive hover:text-destructive"
                          onClick={() => handleCancel(res)}
                          disabled={isUpdating}
                        >
                          <X className="h-3 w-3 mr-1" />
                          キャンセル
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 見積提示ダイアログ */}
      <Dialog open={quoteDialogOpen} onOpenChange={setQuoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              見積もりを提示
            </DialogTitle>
          </DialogHeader>
          {quoteTarget && (
            <div className="space-y-4 mt-2">
              <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">お客様</span>
                  <span>{quoteTarget.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">メニュー</span>
                  <span>{quoteTarget.service_menus?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">予約時の金額</span>
                  <span>{formatYen(quoteTarget.total_price)}</span>
                </div>
              </div>

              <div>
                <Label className="text-sm mb-1 block">見積金額（円）</Label>
                <Input
                  type="number"
                  value={quotedPrice}
                  onChange={(e) => setQuotedPrice(e.target.value)}
                  placeholder="55000"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  追加作業が発生した場合は、変更後の金額を入力してください
                </p>
              </div>

              <div>
                <Label className="text-sm mb-1 block">作業メモ（任意）</Label>
                <Textarea
                  value={workMemo}
                  onChange={(e) => setWorkMemo(e.target.value)}
                  rows={3}
                  placeholder="ブレーキパッド残量少のため交換推奨。追加でフルード交換実施予定。"
                />
              </div>

              <Button
                onClick={handleQuoteSubmit}
                disabled={!quotedPrice || updating === quoteTarget?.id}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                {updating === quoteTarget?.id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    送信中...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    見積もりを提示する
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
