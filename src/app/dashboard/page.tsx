"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarCheck,
  ClipboardList,
  UtensilsCrossed,
  Banknote,
  CreditCard,
  CheckCircle,
  ExternalLink,
} from "lucide-react";

const STATS = [
  { label: "登録メニュー", value: "3件", icon: UtensilsCrossed },
  { label: "作業実績", value: "12件", icon: ClipboardList },
  { label: "今月の予約", value: "8件", icon: CalendarCheck },
  { label: "今月の売上", value: "¥156,000", icon: Banknote },
];

export default function DashboardPage() {
  const [stripeConnected, setStripeConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  async function handleStripeConnect() {
    setConnecting(true);
    // デモ: Stripe未設定時は2秒後に接続成功扱い
    await new Promise((r) => setTimeout(r, 2000));
    setStripeConnected(true);
    setConnecting(false);
  }

  return (
    <div className="space-y-6">
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

      <div>
        <h2 className="text-lg font-semibold mb-4">決済設定</h2>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                <CardTitle className="text-sm">Stripe Connect</CardTitle>
              </div>
              {stripeConnected ? (
                <Badge className="bg-green-100 text-green-800 text-[10px]">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  接続済み
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px]">
                  未接続
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs">
              お客様からの支払いを受け取るにはStripeアカウントの連携が必要です
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stripeConnected ? (
              <div className="text-sm text-muted-foreground">
                <p>Stripeアカウントが正常に連携されています。</p>
                <p className="mt-1">
                  予約確定時にお客様のお支払い額から手数料を差し引いた金額が自動送金されます。
                </p>
              </div>
            ) : (
              <Button
                onClick={handleStripeConnect}
                disabled={connecting}
                size="sm"
              >
                {connecting ? (
                  "接続中..."
                ) : (
                  <>
                    <ExternalLink className="mr-1 h-4 w-4" />
                    Stripeアカウントを連携する
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
