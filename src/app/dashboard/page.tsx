import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarCheck, ClipboardList, UtensilsCrossed, Banknote } from "lucide-react";

const STATS = [
  { label: "登録メニュー", value: "3件", icon: UtensilsCrossed },
  { label: "作業実績", value: "12件", icon: ClipboardList },
  { label: "今月の予約", value: "8件", icon: CalendarCheck },
  { label: "今月の売上", value: "¥156,000", icon: Banknote },
];

export default function DashboardPage() {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">概要</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {STATS.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
