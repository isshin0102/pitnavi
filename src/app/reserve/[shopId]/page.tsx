"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { CarType, ServiceMenu } from "@/lib/types";
import { CAR_TYPE_LABELS, SERVICE_CATEGORY_LABELS } from "@/lib/types";
import { formatYen, calculateFeeBreakdown } from "@/lib/fee-calculator";
import { MOCK_SHOPS, MOCK_SERVICE_MENUS } from "@/lib/mock-data";

export default function ReservePage({
  params,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const { shopId } = use(params);
  const router = useRouter();

  const shop = MOCK_SHOPS.find((s) => s.id === shopId);
  const menus = MOCK_SERVICE_MENUS.filter((m) => m.shop_id === shopId);

  const [carType, setCarType] = useState<CarType>("standard");
  const [selectedMenu, setSelectedMenu] = useState<ServiceMenu | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

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
  const breakdown = selectedMenu
    ? calculateFeeBreakdown(selectedMenu.category, carType, price)
    : null;

  const canSubmit =
    selectedMenu && name.trim() && phone.trim() && date && time;

  function handleSubmit() {
    if (!canSubmit) return;
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
        <h1 className="text-xl font-bold mb-2">予約リクエストを送信しました</h1>
        <p className="text-sm text-muted-foreground mb-6">
          工場からの確認をお待ちください。確定後にお支払い案内をお送りします。
        </p>
        <Button render={<Link href="/" />}>
          トップに戻る
        </Button>
      </div>
    );
  }

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
        <div>
          <Label className="text-sm font-medium mb-2 block">車種を選択</Label>
          <div className="flex gap-2">
            {(["light", "standard"] as const).map((ct) => (
              <button
                key={ct}
                onClick={() => setCarType(ct)}
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

        <div>
          <Label className="text-sm font-medium mb-2 block">
            作業メニューを選択
          </Label>
          <div className="space-y-2">
            {menus.map((menu) => {
              const menuPrice =
                carType === "light" ? menu.price_light : menu.price_standard;
              const isSelected = selectedMenu?.id === menu.id;
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
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <Separator />

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
          <div>
            <Label htmlFor="date" className="text-sm mb-1 block">
              希望日
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="time" className="text-sm mb-1 block">
              希望時間
            </Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
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

        {breakdown && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">お支払い金額</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-lg font-bold">
                <span>合計</span>
                <span>{formatYen(breakdown.servicePrice)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full"
          size="lg"
        >
          予約リクエストを送信
        </Button>
      </div>
    </div>
  );
}
