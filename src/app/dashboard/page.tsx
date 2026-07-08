"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  Store,
  CreditCard,
  Plus,
  UtensilsCrossed,
  ClipboardList,
  MapPin,
  Trash2,
  CheckCircle,
  Phone,
  ShieldCheck,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { isSupabaseConfigured } from "@/lib/supabase/helpers";
import { getCurrentUser } from "@/lib/data/auth";
import { createShop, deleteShop, getMyMenus, getMyWorkRecords } from "@/lib/data/dashboard";
import type { Shop } from "@/lib/types";

export default function DashboardPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [menuCount, setMenuCount] = useState(0);
  const [recordCount, setRecordCount] = useState(0);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState("");
  const [stripeConnecting, setStripeConnecting] = useState(false);
  const [stripeSuccess, setStripeSuccess] = useState("");

  const [shopName, setShopName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [lat, setLat] = useState("35.6894");
  const [lng, setLng] = useState("139.6917");

  // GPS で現在地を取得して緯度・経度をセット
  function fillCurrentLocation() {
    if (!navigator.geolocation) {
      alert("このブラウザでは位置情報を利用できません");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
      },
      () => alert("位置情報の取得に失敗しました"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  useEffect(() => {
    (async () => {
      if (!isSupabaseConfigured()) {
        setShops([{ id: "mock", name: "デモ店舗" } as Shop]);
        setSelectedShop({ id: "mock", name: "デモ店舗" } as Shop);
        setMenuCount(3);
        setRecordCount(2);
        setLoading(false);
        return;
      }

      const user = await getCurrentUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      // ★ 複数店舗に対応: アクティブな店舗のみ取得
      const { data, error } = await supabase
        .from("shops")
        .select("*")
        .eq("owner_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[dashboard] shops fetch error:", error);
      }

      const myShops = (data as Shop[]) ?? [];
      setShops(myShops);

      if (myShops.length > 0) {
        const first = myShops[0];
        setSelectedShop(first);
        const menus = await getMyMenus(first.id);
        const records = await getMyWorkRecords(first.id);
        setMenuCount(menus.length);
        setRecordCount(records.length);

        const params = new URLSearchParams(window.location.search);
        if (params.get("stripe") === "success") {
          const targetShopId = params.get("shop") || first.id;
          const targetShop = myShops.find((s) => s.id === targetShopId) || first;

          if (targetShop.stripe_account_id && !targetShop.stripe_onboarded) {
            try {
              const res = await fetch("/api/stripe/connect-status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ shopId: targetShop.id }),
              });
              const result = await res.json();
              if (result.onboarded) {
                const updated = { ...targetShop, stripe_onboarded: true };
                setShops(myShops.map((s) => (s.id === updated.id ? updated : s)));
                setSelectedShop(updated);
                setStripeSuccess("Stripe連携が完了しました！");
                setTimeout(() => setStripeSuccess(""), 5000);
              }
            } catch (e) {
              console.error("[dashboard] stripe status check error:", e);
            }
          }
          window.history.replaceState({}, "", "/dashboard");
        }
      } else {
        setShowForm(true);
      }

      setLoading(false);
    })();
  }, []);

  async function handleSelectShop(shop: Shop) {
    setSelectedShop(shop);
    const menus = await getMyMenus(shop.id);
    const records = await getMyWorkRecords(shop.id);
    setMenuCount(menus.length);
    setRecordCount(records.length);
  }

  async function handleCreateShop() {
    if (!shopName || !address || !userId) return;
    if (!licenseNumber.trim()) {
      alert("古物商許可番号は必須入力です");
      return;
    }
    setSaving(true);
    try {
      const result = await createShop({
        owner_id: userId,
        name: shopName,
        address,
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        description: description || undefined,
        phone: phone || undefined,
        license_number: licenseNumber.trim(),
      });

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase
        .from("shops")
        .select("*")
        .eq("id", result.id)
        .single();

      const newShop = data as Shop;
      setShops((prev) => [newShop, ...prev]);
      setSelectedShop(newShop);
      setMenuCount(0);
      setRecordCount(0);
      setShowForm(false);

      // フォームリセット
      setShopName("");
      setAddress("");
      setPhone("");
      setDescription("");
      setLicenseNumber("");
      setLat("35.6894");
      setLng("139.6917");
    } catch (e) {
      alert(e instanceof Error ? e.message : "店舗の登録に失敗しました");
    }
    setSaving(false);
  }

  async function handleDeleteShop(shop: Shop) {
    const confirmed = confirm(
      `本当に「${shop.name}」を削除しますか？この操作は取り消せません。`
    );
    if (!confirmed) return;

    setDeletingId(shop.id);
    try {
      await deleteShop(shop.id);

      // ステートから削除した店舗を除外
      const remaining = shops.filter((s) => s.id !== shop.id);
      setShops(remaining);

      // 選択中の店舗が削除された場合、次の店舗を選択
      if (selectedShop?.id === shop.id) {
        if (remaining.length > 0) {
          await handleSelectShop(remaining[0]);
        } else {
          setSelectedShop(null);
          setMenuCount(0);
          setRecordCount(0);
          setShowForm(true);
        }
      }

      setDeleteSuccess(`「${shop.name}」を削除しました`);
      setTimeout(() => setDeleteSuccess(""), 3000);
    } catch (e) {
      alert(e instanceof Error ? e.message : "削除に失敗しました");
    }
    setDeletingId(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        読み込み中...
      </div>
    );
  }

  // 新規登録フォーム
  if (showForm) {
    return (
      <div className="max-w-md">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">店舗を登録</h2>
          {shops.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              戻る
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          新しい店舗を追加します。
        </p>
        <div className="space-y-4">
          <div>
            <Label className="text-sm mb-1 block">店舗名</Label>
            <Input
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="鈴木タイヤ＆オイル"
            />
          </div>
          <div>
            <Label className="text-sm mb-1 block">住所</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="東京都渋谷区..."
            />
          </div>
          <div>
            <Label className="text-sm mb-1 block">電話番号（任意）</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="03-1234-5678"
            />
          </div>
          <div>
            <Label className="text-sm mb-1 block">
              古物商許可番号 <span className="text-destructive">*</span>
            </Label>
            <Input
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="第○○○○○○○○○○○○号"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              安全な取引のため、古物商許可番号の入力は必須です
            </p>
          </div>
          <div>
            <Label className="text-sm mb-1 block">紹介文（任意）</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm mb-1 block">緯度</Label>
              <Input
                type="number"
                step="0.0001"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm mb-1 block">経度</Label>
              <Input
                type="number"
                step="0.0001"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
              />
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={fillCurrentLocation}
          >
            <MapPin className="h-4 w-4 mr-1" />
            現在地の緯度・経度を自動入力
          </Button>
          <Button
            onClick={handleCreateShop}
            disabled={!shopName || !address || !licenseNumber.trim() || saving}
            className="w-full"
          >
            {saving ? "登録中..." : "店舗を登録する"}
          </Button>
        </div>
      </div>
    );
  }

  // メインダッシュボード
  return (
    <div className="space-y-6">
      {/* 成功メッセージ */}
      {(deleteSuccess || stripeSuccess) && (
        <div className="flex items-center gap-2 rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {deleteSuccess || stripeSuccess}
        </div>
      )}

      {/* 店舗一覧（複数対応） */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">あなたの店舗</h2>
            <Badge variant="secondary" className="text-[10px]">
              {shops.length}件
            </Badge>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            新しい店舗を追加
          </Button>
        </div>

        {/* 店舗カード一覧 — 選択＋削除対応 */}
        <div className="space-y-2">
          {shops.map((s) => {
            const isSelected = selectedShop?.id === s.id;
            const isDeleting = deletingId === s.id;
            return (
              <div
                key={s.id}
                className={`rounded-lg border p-3 transition-colors cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "hover:bg-accent"
                }`}
                onClick={() => handleSelectShop(s)}
              >
                <div className="flex items-center justify-between gap-3">
                  {/* 店舗情報 */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {s.name}
                      </span>
                      {isSelected && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] shrink-0"
                        >
                          選択中
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {s.address && (
                        <span className="flex items-center gap-0.5 truncate">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {s.address}
                        </span>
                      )}
                      {s.phone && (
                        <span className="flex items-center gap-0.5 shrink-0">
                          <Phone className="h-3 w-3" />
                          {s.phone}
                        </span>
                      )}
                    </div>
                    {s.license_number && (
                      <div className="flex items-center gap-0.5 mt-0.5 text-[10px] text-muted-foreground">
                        <ShieldCheck className="h-3 w-3" />
                        {s.license_number}
                      </div>
                    )}
                  </div>

                  {/* 削除ボタン */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // カード選択を防止
                      handleDeleteShop(s);
                    }}
                    disabled={isDeleting}
                    className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                    title={`「${s.name}」を削除`}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 選択中の店舗の詳細 */}
      {selectedShop && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                label: "登録メニュー",
                value: `${menuCount}件`,
                icon: UtensilsCrossed,
              },
              {
                label: "作業実績",
                value: `${recordCount}件`,
                icon: ClipboardList,
              },
            ].map(({ label, value, icon: Icon }) => (
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

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  <CardTitle className="text-sm">Stripe Connect</CardTitle>
                </div>
                {selectedShop.stripe_onboarded ? (
                  <Badge className="bg-green-100 text-green-800 text-[10px]">
                    連携済み
                  </Badge>
                ) : selectedShop.stripe_account_id ? (
                  <Badge variant="outline" className="text-[10px] text-orange-600 border-orange-300">
                    設定未完了
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px]">
                    未連携
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs">
                {selectedShop.stripe_onboarded
                  ? "Stripeアカウントが連携済みです。お客様からの決済を受け取れます"
                  : "Stripeアカウントを連携すると、お客様からの決済を自動で受け取れます"}
              </CardDescription>
            </CardHeader>
            {!selectedShop.stripe_onboarded && (
              <CardContent>
                <Button
                  className="w-full"
                  disabled={stripeConnecting}
                  onClick={async () => {
                    setStripeConnecting(true);
                    try {
                      const res = await fetch("/api/stripe/connect", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ shopId: selectedShop.id }),
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error);
                      window.location.href = data.onboardingUrl;
                    } catch (e) {
                      alert(e instanceof Error ? e.message : "エラーが発生しました");
                      setStripeConnecting(false);
                    }
                  }}
                >
                  {stripeConnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  {selectedShop.stripe_account_id
                    ? "Stripeの設定を続ける"
                    : "Stripeと連携する"}
                </Button>
              </CardContent>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
