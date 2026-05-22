"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PaymentForm } from "@/components/payment-form";
import type { CarType, ServiceMenu, Shop } from "@/lib/types";
import { CAR_TYPE_LABELS, SERVICE_CATEGORY_LABELS } from "@/lib/types";
import { formatYen, calculateFeeBreakdown } from "@/lib/fee-calculator";
import { getShopById, getServiceMenus } from "@/lib/data/shops";

type Step = "details" | "payment" | "done";

export default function ReservePage({
  params,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const { shopId } = use(params);

  const [shop, setShop] = useState<Shop | null>(null);
  const [menus, setMenus] = useState<ServiceMenu[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [s, m] = await Promise.all([
        getShopById(shopId),
        getServiceMenus(shopId),
      ]);
      setShop(s);
      setMenus(m);
      setPageLoading(false);
    })();
  }, [shopId]);

  const [step, setStep] = useState<Step>("details");
  const [carType, setCarType] = useState<CarType>("standard");
  const [selectedMenu, setSelectedMenu] = useState<ServiceMenu | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />読み込み中...
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
  const breakdown = selectedMenu
    ? calculateFeeBreakdown(selectedMenu.category, carType, price)
    : null;

  const canProceed =
    selectedMenu && name.trim() && phone.trim() && date && time;

  if (step === "done") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
        <h1 className="text-xl font-bold mb-2">予約＆お支払いが完了しました</h1>
        <p className="text-sm text-muted-foreground mb-2">
          {shop.name} - {selectedMenu?.name}
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          {date} {time} / {CAR_TYPE_LABELS[carType]}
        </p>
        <Button render={<Link href="/" />}>トップに戻る</Button>
      </div>
    );
  }

  if (step === "payment" && breakdown && selectedMenu) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <button
          onClick={() => setStep("details")}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> 予約内容に戻る
        </button>

        <h1 className="text-xl font-bold mb-2">お支払い</h1>
        <p className="text-sm text-muted-foreground mb-6">
          予約内容を確認のうえ、お支払いください
        </p>

        <div className="rounded-lg border p-3 mb-4 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">お名前</span>
            <span>{name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">電話番号</span>
            <span>{phone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">車種</span>
            <span>{CAR_TYPE_LABELS[carType]}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">希望日時</span>
            <span>
              {date} {time}
            </span>
          </div>
          {note && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">備考</span>
              <span className="text-right max-w-[200px]">{note}</span>
            </div>
          )}
        </div>

        <PaymentForm
          breakdown={breakdown}
          shopName={shop.name}
          menuName={selectedMenu.name}
          onPaymentComplete={() => setStep("done")}
        />
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

        <div>
          <Label className="text-sm font-medium mb-2 block">
            作業メニューを選択
          </Label>
          <div className="space-y-2">
            {menus.map((menu) => {
              const menuPrice =
                carType === "light" ? menu.price_light : menu.price_standard;
              const isSelected = selectedMenu?.id === menu.id;
              const menuBreakdown = calculateFeeBreakdown(
                menu.category,
                carType,
                menuPrice
              );
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
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between text-lg font-bold">
              <span>お支払い金額</span>
              <span>{formatYen(breakdown.servicePrice)}</span>
            </div>
          </div>
        )}

        <Button
          onClick={() => setStep("payment")}
          disabled={!canProceed}
          className="w-full"
          size="lg"
        >
          お支払いへ進む
        </Button>
      </div>
    </div>
  );
}
