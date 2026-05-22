"use client";

import { useState, useEffect } from "react";
import { Loader2, CalendarDays, User, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RESERVATION_STATUS_LABELS, CAR_TYPE_LABELS } from "@/lib/types";
import type { ReservationStatus, Reservation } from "@/lib/types";
import { formatYen } from "@/lib/fee-calculator";
import { isSupabaseConfigured } from "@/lib/supabase/helpers";
import { getCurrentUser } from "@/lib/data/auth";
import { getMyReservations } from "@/lib/data/dashboard";

const MOCK_RESERVATIONS = [
  {
    id: "res-1",
    customer_name: "佐藤 花子",
    customer_phone: "090-1111-2222",
    car_type: "light" as const,
    preferred_date: "2025-05-25",
    preferred_time: "10:00",
    status: "pending" as ReservationStatus,
    total_price: 4800,
    platform_fee: 800,
    shop_payout: 4000,
    service_menus: { name: "タイヤ交換（4本）" },
  },
  {
    id: "res-2",
    customer_name: "田中 一郎",
    customer_phone: "080-3333-4444",
    car_type: "standard" as const,
    preferred_date: "2025-05-26",
    preferred_time: "14:00",
    status: "confirmed" as ReservationStatus,
    total_price: 4500,
    platform_fee: 650,
    shop_payout: 3850,
    service_menus: { name: "エンジンオイル交換" },
  },
];

const STATUS_COLORS: Record<ReservationStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!isSupabaseConfigured()) {
        setReservations(MOCK_RESERVATIONS);
        setLoading(false);
        return;
      }

      const user = await getCurrentUser();
      if (!user) { setLoading(false); return; }

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: shop } = await supabase
        .from("shops")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (shop) {
        const data = await getMyReservations(shop.id);
        setReservations(data);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />読み込み中...
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">予約管理</h2>

      {reservations.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          予約がありません
        </p>
      ) : (
        <div className="space-y-3">
          {reservations.map((res) => (
            <Card key={res.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm">
                    {res.service_menus?.name ?? "メニュー不明"}
                  </CardTitle>
                  <Badge
                    className={`text-[10px] ${STATUS_COLORS[res.status as ReservationStatus]}`}
                  >
                    {RESERVATION_STATUS_LABELS[res.status as ReservationStatus]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {res.customer_name}（{CAR_TYPE_LABELS[res.car_type as keyof typeof CAR_TYPE_LABELS]}）
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {res.customer_phone}
                  </div>
                  <div className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {res.preferred_date} {res.preferred_time}
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t flex justify-between text-xs">
                  <span>
                    合計: <strong>{formatYen(res.total_price)}</strong>
                  </span>
                  <span className="text-muted-foreground">
                    手数料: {formatYen(res.platform_fee)} / 受取:{" "}
                    {formatYen(res.total_price - res.platform_fee)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
