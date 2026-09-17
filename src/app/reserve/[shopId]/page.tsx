"use client";

import { useState, useEffect, useMemo } from "react";
import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  Send,
  AlertCircle,
  Info,
} from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type {
  CarType,
  ServiceMenu,
  Shop,
  ShopRegularHoliday,
  ShopBlockedSlot,
} from "@/lib/types";
import { CAR_TYPE_LABELS, SERVICE_CATEGORY_LABELS } from "@/lib/types";
import { formatYen } from "@/lib/fee-calculator";
import { getShopById, getServiceMenus } from "@/lib/data/shops";

export default function ReservePage({
  params,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const { shopId } = use(params);

  const [shop, setShop] = useState<Shop | null>(null);
  const [menus, setMenus] = useState<ServiceMenu[]>([]);
  const [holidays, setHolidays] = useState<ShopRegularHoliday[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<ShopBlockedSlot[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, m, scheduleRes] = await Promise.all([
          getShopById(shopId),
          getServiceMenus(shopId),
          fetch(`/api/shops/${shopId}/schedule`).then((r) => r.json()),
        ]);
        setShop(s);
        setMenus(m);
        setHolidays(scheduleRes.holidays ?? []);
        setBlockedSlots(scheduleRes.blockedSlots ?? []);
      } catch (e) {
        console.error("Failed to load reservation data:", e);
      } finally {
        setPageLoading(false);
      }
    })();
  }, [shopId]);

  const [step, setStep] = useState<"details" | "done">("details");
  const [carType, setCarType] = useState<CarType>("standard");
  const [selectedMenu, setSelectedMenu] = useState<ServiceMenu | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const date = selectedDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`
    : "";

  const holidayDays = useMemo(
    () => new Set(holidays.map((h) => h.day_of_week)),
    [holidays]
  );

  const fullDayBlockedDates = useMemo(
    () =>
      blockedSlots
        .filter((s) => !s.start_time && !s.end_time)
        .map((s) => new Date(s.blocked_date + "T00:00:00")),
    [blockedSlots]
  );

  const isDateDisabled = (d: Date) => {
    if (d < new Date(new Date().toDateString())) return true;
    if (holidayDays.has(d.getDay())) return true;
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (
      blockedSlots.some(
        (s) => s.blocked_date === dateStr && !s.start_time && !s.end_time
      )
    )
      return true;
    return false;
  };

  const timeBlockedForDate = useMemo(() => {
    if (!date) return [];
    return blockedSlots.filter(
      (s) => s.blocked_date === date && s.start_time && s.end_time
    );
  }, [date, blockedSlots]);

  const isTimeBlocked = (t: string) => {
    return timeBlockedForDate.some((slot) => {
      const st = slot.start_time!;
      const et = slot.end_time!;
      return t >= st.slice(0, 5) && t < et.slice(0, 5);
    });
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        読み込み中...
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p>工場が見つかりません</p>
      </div>
    );
  }

  const price = selectedMenu
    ? carType === "light"
      ? selectedMenu.price_light
      : selectedMenu.price_standard
    : 0;

  const isInspection = selectedMenu?.category === "inspection";
  const canProceed =
    selectedMenu &&
    name.trim() &&
    phone.trim() &&
    date &&
    time &&
    !isTimeBlocked(time);

  /** 予約リクエストを送信（決済なし） */
  async function handleSubmitReservation() {
    if (!selectedMenu || !canProceed) return;
    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop_id: shopId,
          service_menu_id: selectedMenu.id,
          car_type: carType,
          preferred_date: date,
          preferred_time: time,
          customer_name: name,
          customer_phone: phone,
          customer_note: note || undefined,
          total_price: price,
          platform_fee: 0,
          shop_payout: price,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "予約リクエストの送信に失敗しました");
      }

      setStep("done");
    } catch (e) {
      console.error("[Reserve] submit error:", e);
      setErrorMsg(
        e instanceof Error ? e.message : "予約リクエストの送信に失敗しました"
      );
      setSubmitting(false);
    }
  }

  /* ========== 完了画面 ========== */
  if (step === "done") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
        <h1 className="text-xl font-bold mb-2">予約リクエストを送信しました</h1>
        <p className="text-sm text-muted-foreground mb-1">
          {shop.name} - {selectedMenu?.name}
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          {date} {time} / {CAR_TYPE_LABELS[carType]}
        </p>

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 mb-6 text-left">
          <p className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-1">
            <Info className="h-4 w-4" />
            今後の流れ
          </p>
          <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
            <li>工場が予約リクエストを確認します</li>
            <li>ご来店いただき、現車を確認します</li>
            <li>工場から正式な見積もりが届きます</li>
            <li>見積もりを確認して、決済・作業依頼を行います</li>
          </ol>
        </div>

        <div className="flex flex-col gap-2">
          <Button render={<Link href="/mypage" />} className="w-full">
            マイページで状況を確認
          </Button>
          <Button
            variant="outline"
            render={<Link href="/" />}
            className="w-full"
          >
            トップに戻る
          </Button>
        </div>
      </div>
    );
  }

  /* ========== 予約フォーム ========== */
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link
        href={`/shops/${shopId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> {shop.name}にもどる
      </Link>

      <h1 className="text-xl font-bold mb-6">予約リクエスト</h1>

      <div className="space-y-6">
        {/* 車種選択 */}
        <div>
          <Label className="text-sm font-medium mb-2 block">車種を選択</Label>
          <div className="flex gap-2">
            {(["light", "standard"] as const).map((ct) => (
              <button
                key={ct}
                onClick={() => {
                  setCarType(ct);
                  setSelectedMenu(null);
                }}
                className={`flex-1 rounded-lg border p-3 text-sm text-center transition-colors ${
                  carType === ct
                    ? "border-primary bg-primary/5 font-medium"
                    : "hover:bg-accent"
                }`}
              >
                {CAR_TYPE_LABELS[ct]}
              </button>
            ))}
          </div>
        </div>

        {/* メニュー選択 */}
        <div>
          <Label className="text-sm font-medium mb-2 block">
            作業メニューを選択
          </Label>
          <div className="space-y-2">
            {menus.map((menu) => {
              const menuPrice =
                carType === "light" ? menu.price_light : menu.price_standard;
              const isSelected = selectedMenu?.id === menu.id;
              const isMenuInspection = menu.category === "inspection";
              return (
                <button
                  key={menu.id}
                  onClick={() => setSelectedMenu(menu)}
                  className={`w-full text-left rounded-lg border p-3 transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "hover:bg-accent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {SERVICE_CATEGORY_LABELS[menu.category]}
                      </Badge>
                      <span className="text-sm font-medium">{menu.name}</span>
                    </div>
                    <span className="text-sm font-bold">
                      {formatYen(menuPrice)}
                      {isMenuInspection && "〜"}
                    </span>
                  </div>
                  {isMenuInspection && (
                    <p className="text-[10px] text-orange-600 mt-1">
                      ※お車の状態により追加整備費用が発生する場合があります
                    </p>
                  )}
                  {menu.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {menu.description}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* お客様情報 */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="name" className="text-sm mb-1 block">
              お名前
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="山田 太郎"
            />
          </div>
          <div>
            <Label htmlFor="phone" className="text-sm mb-1 block">
              電話番号
            </Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="090-1234-5678"
            />
          </div>
        </div>

        {/* カレンダー日付選択 */}
        <div>
          <Label className="text-sm mb-2 block">希望日を選択</Label>
          <div className="rounded-lg border p-3 flex justify-center">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={isDateDisabled}
              startMonth={new Date()}
              locale={{
                localize: {
                  day: (n: number) => ["日", "月", "火", "水", "木", "金", "土"][n],
                  month: (n: number) =>
                    [
                      "1月", "2月", "3月", "4月", "5月", "6月",
                      "7月", "8月", "9月", "10月", "11月", "12月",
                    ][n],
                  ordinalNumber: (n: number) => String(n),
                  era: () => "",
                  quarter: () => "",
                  dayPeriod: () => "",
                } as ReturnType<typeof Object>["localize"],
                formatLong: {
                  date: () => "yyyy/MM/dd",
                  time: () => "HH:mm",
                  dateTime: () => "yyyy/MM/dd HH:mm",
                } as ReturnType<typeof Object>["formatLong"],
                options: { weekStartsOn: 0 as const, firstWeekContainsDate: 1 },
              } as never}
              footer={
                selectedDate ? (
                  <p className="text-xs text-center mt-2 text-muted-foreground">
                    選択: {date}
                    {timeBlockedForDate.length > 0 && (
                      <span className="text-orange-600 ml-2">
                        ※一部時間帯が予約不可
                      </span>
                    )}
                  </p>
                ) : (
                  <p className="text-xs text-center mt-2 text-muted-foreground">
                    日付を選択してください
                  </p>
                )
              }
            />
          </div>
          {holidayDays.size > 0 && (
            <p className="text-[10px] text-muted-foreground mt-1">
              グレーの日付は定休日のため予約できません。
            </p>
          )}
        </div>

        {/* 時間選択 */}
        <div>
          <Label htmlFor="time" className="text-sm mb-1 block">
            希望時間
          </Label>
          <Input
            id="time"
            type="time"
            value={time}
            onChange={(e) => {
              const v = e.target.value;
              if (isTimeBlocked(v)) {
                setErrorMsg("この時間帯は予約不可に設定されています");
                return;
              }
              setErrorMsg("");
              setTime(v);
            }}
          />
          {timeBlockedForDate.length > 0 && (
            <div className="mt-1 space-y-0.5">
              {timeBlockedForDate.map((slot) => (
                <p
                  key={slot.id}
                  className="text-[10px] text-orange-600"
                >
                  ※ {slot.start_time?.slice(0, 5)}〜{slot.end_time?.slice(0, 5)}{" "}
                  は予約不可
                  {slot.reason && `（${slot.reason}）`}
                </p>
              ))}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="note" className="text-sm mb-1 block">
            備考（任意）
          </Label>
          <Textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="タイヤは持ち込みです、など"
            rows={3}
          />
        </div>

        {/* 参考価格表示 */}
        {selectedMenu && (
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {isInspection ? "参考基本料金" : "参考料金"}
              </span>
              <span className="text-lg font-bold">
                {formatYen(price)}
                {isInspection && "〜"}
              </span>
            </div>
            {isInspection && (
              <p className="text-[10px] text-orange-600 mt-2">
                ※車検は分解整備後に追加整備（ブレーキパッド交換・ブーツ類等）が発生する場合があります。
                正確な金額は店舗での現車確認後、アプリ内で最終見積もりを提示します。
              </p>
            )}
            <p className="text-[10px] text-muted-foreground mt-1">
              ※最終金額は店舗の見積もり後に確定します。この時点で決済は発生しません。
            </p>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">
            <AlertCircle className="h-3 w-3 shrink-0" />
            {errorMsg}
          </div>
        )}

        <Button
          onClick={handleSubmitReservation}
          disabled={!canProceed || submitting}
          className="w-full"
          size="lg"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              送信中...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              予約リクエストを送る
            </>
          )}
        </Button>

        <p className="text-[10px] text-center text-muted-foreground">
          この時点ではお支払いは発生しません。店舗からの見積もり後にお支払いへ進みます。
        </p>
      </div>
    </div>
  );
}
