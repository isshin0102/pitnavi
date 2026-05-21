import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RESERVATION_STATUS_LABELS } from "@/lib/types";
import type { ReservationStatus } from "@/lib/types";
import { formatYen } from "@/lib/fee-calculator";
import { CalendarDays, User, Phone } from "lucide-react";

const MOCK_RESERVATIONS = [
  {
    id: "res-1",
    customer_name: "佐藤 花子",
    customer_phone: "090-1111-2222",
    service_name: "タイヤ交換（4本）",
    car_type_label: "軽自動車",
    preferred_date: "2025-05-25",
    preferred_time: "10:00",
    status: "pending" as ReservationStatus,
    total_price: 4800,
    platform_fee: 800,
  },
  {
    id: "res-2",
    customer_name: "田中 一郎",
    customer_phone: "080-3333-4444",
    service_name: "エンジンオイル交換",
    car_type_label: "普通車",
    preferred_date: "2025-05-26",
    preferred_time: "14:00",
    status: "confirmed" as ReservationStatus,
    total_price: 4500,
    platform_fee: 650,
  },
];

const STATUS_COLORS: Record<ReservationStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
};

export default function ReservationsPage() {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">予約管理</h2>

      {MOCK_RESERVATIONS.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          予約がありません
        </p>
      ) : (
        <div className="space-y-3">
          {MOCK_RESERVATIONS.map((res) => (
            <Card key={res.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm">{res.service_name}</CardTitle>
                  <Badge
                    className={`text-[10px] ${STATUS_COLORS[res.status]}`}
                  >
                    {RESERVATION_STATUS_LABELS[res.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {res.customer_name}（{res.car_type_label}）
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
