"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Plus, Trash2, CalendarOff, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/data/auth";
import { isSupabaseConfigured } from "@/lib/supabase/helpers";
import type { ShopRegularHoliday, ShopBlockedSlot } from "@/lib/types";
import { DAY_OF_WEEK_LABELS } from "@/lib/types";

const DAYS = [0, 1, 2, 3, 4, 5, 6] as const;

export default function SchedulePage() {
  const [shopId, setShopId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [holidays, setHolidays] = useState<ShopRegularHoliday[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<ShopBlockedSlot[]>([]);
  const [saving, setSaving] = useState(false);

  const [newDate, setNewDate] = useState("");
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");
  const [newReason, setNewReason] = useState("");

  const fetchSchedule = useCallback(async (sid: string) => {
    const res = await fetch(`/api/shops/${sid}/schedule`);
    if (res.ok) {
      const data = await res.json();
      setHolidays(data.holidays);
      setBlockedSlots(data.blockedSlots);
    }
  }, []);

  useEffect(() => {
    (async () => {
      if (!isSupabaseConfigured()) {
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
      const { data } = await supabase
        .from("shops")
        .select("id")
        .eq("owner_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1);

      const sid = data?.[0]?.id ?? null;
      setShopId(sid);
      if (sid) await fetchSchedule(sid);
      setLoading(false);
    })();
  }, [fetchSchedule]);

  const holidayDays = new Set(holidays.map((h) => h.day_of_week));

  async function toggleHoliday(day: number) {
    if (!shopId) return;
    setSaving(true);

    if (holidayDays.has(day)) {
      const holiday = holidays.find((h) => h.day_of_week === day);
      if (holiday) {
        await fetch(
          `/api/shops/${shopId}/schedule?type=holiday&id=${holiday.id}`,
          { method: "DELETE" }
        );
      }
    } else {
      await fetch(`/api/shops/${shopId}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "holiday", day_of_week: day }),
      });
    }

    await fetchSchedule(shopId);
    setSaving(false);
  }

  async function addBlockedSlot() {
    if (!shopId || !newDate) return;
    setSaving(true);

    await fetch(`/api/shops/${shopId}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "blocked_slot",
        blocked_date: newDate,
        start_time: newStartTime || null,
        end_time: newEndTime || null,
        reason: newReason || null,
      }),
    });

    setNewDate("");
    setNewStartTime("");
    setNewEndTime("");
    setNewReason("");
    await fetchSchedule(shopId);
    setSaving(false);
  }

  async function removeBlockedSlot(id: string) {
    if (!shopId) return;
    setSaving(true);

    await fetch(
      `/api/shops/${shopId}/schedule?type=blocked_slot&id=${id}`,
      { method: "DELETE" }
    );

    await fetchSchedule(shopId);
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        読み込み中...
      </div>
    );
  }

  if (!shopId) {
    return (
      <p className="text-sm text-muted-foreground py-8">
        店舗を先に登録してください。
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2">
          <CalendarOff className="h-5 w-5" />
          スケジュール管理
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          定休日や予約不可の日時を設定できます。設定した日時は予約カレンダーに反映されます。
        </p>
      </div>

      {/* 定休日セクション */}
      <div>
        <h3 className="text-sm font-semibold mb-3">定休日（毎週）</h3>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((day) => {
            const isHoliday = holidayDays.has(day);
            return (
              <button
                key={day}
                onClick={() => toggleHoliday(day)}
                disabled={saving}
                className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                  isHoliday
                    ? "bg-red-100 border-red-300 text-red-700 font-medium"
                    : "hover:bg-accent"
                }`}
              >
                {DAY_OF_WEEK_LABELS[day]}
                {isHoliday && " ✕"}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          クリックして定休日のON/OFFを切り替えます。赤い曜日は予約不可になります。
        </p>
      </div>

      <Separator />

      {/* ブロック枠セクション */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          特定日時ブロック
        </h3>

        <div className="rounded-lg border p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="blocked-date" className="text-xs mb-1 block">
                日付
              </Label>
              <Input
                id="blocked-date"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">理由（任意）</Label>
              <Input
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="研修、イベント等"
              />
            </div>
            <div>
              <Label htmlFor="blocked-start" className="text-xs mb-1 block">
                開始時間（空欄で終日）
              </Label>
              <Input
                id="blocked-start"
                type="time"
                value={newStartTime}
                onChange={(e) => setNewStartTime(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="blocked-end" className="text-xs mb-1 block">
                終了時間（空欄で終日）
              </Label>
              <Input
                id="blocked-end"
                type="time"
                value={newEndTime}
                onChange={(e) => setNewEndTime(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={addBlockedSlot}
            disabled={!newDate || saving}
            size="sm"
          >
            <Plus className="mr-1 h-3 w-3" />
            ブロック枠を追加
          </Button>
        </div>

        {/* 登録済みブロック枠一覧 */}
        {blockedSlots.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              登録済みブロック枠
            </p>
            {blockedSlots.map((slot) => (
              <div
                key={slot.id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">{slot.blocked_date}</Badge>
                  {slot.start_time && slot.end_time ? (
                    <span className="text-muted-foreground">
                      {slot.start_time.slice(0, 5)} 〜{" "}
                      {slot.end_time.slice(0, 5)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">終日</span>
                  )}
                  {slot.reason && (
                    <span className="text-xs text-muted-foreground">
                      ({slot.reason})
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeBlockedSlot(slot.id)}
                  disabled={saving}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {blockedSlots.length === 0 && (
          <p className="text-xs text-muted-foreground mt-3">
            特定日時のブロック枠はまだ登録されていません。
          </p>
        )}
      </div>
    </div>
  );
}
