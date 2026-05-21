"use client";

import { useState, useEffect } from "react";
import { Loader2, Store, CreditCard, CheckCircle, ExternalLink, CalendarCheck, ClipboardList, UtensilsCrossed, Banknote } from "lucide-react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { isSupabaseConfigured } from "@/lib/supabase/helpers";
import { getCurrentUser } from "@/lib/data/auth";
import { createShop, getMyMenus, getMyWorkRecords } from "@/lib/data/dashboard";
import type { Shop } from "@/lib/types";

export default function DashboardPage() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [menuCount, setMenuCount] = useState(0);
  const [recordCount, setRecordCount] = useState(0);

  const [shopName, setShopName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [lat, setLat] = useState("35.6894");
  const [lng, setLng] = useState("139.6917");

  useEffect(() => {
    (async () => {
      if (!isSupabaseConfigured()) {
        setShop({ id: "mock", name: "デモ店舗" } as Shop);
        setMenuCount(3);
        setRecordCount(2);
        setLoading(false);
        return;
      }

      const user = await getCurrentUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase
        .from("shops")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (data) {
        setShop(data as Shop);
        const menus = await getMyMenus(data.id);
        const records = await getMyWorkRecords(data.id);
        setMenuCount(menus.length);
        setRecordCount(records.length);
      } else {
        setShowForm(true);
      }
      setLoading(false);
    })();
  }, []);

  async function handleCreateShop() {
    if (!shopName || !address || !userId) return;
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
      });

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase
        .from("shops")
        .select("*")
        .eq("id", result.id)
        .single();
      setShop(data as Shop);
      setShowForm(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : "店舗の登録に失敗しました");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />読み込み中...
      </div>
    );
  }

  if (showForm || !shop) {
    return (
      <div className="max-w-md">
        <h2 className="text-lg font-semibold mb-2">店舗を登録</h2>
        <p className="text-sm text-muted-foreground mb-4">
          ダッシュボードを利用するには、まず店舗情報を登録してください。
        </p>
        <div className="space-y-4">
          <div>
            <Label className="text-sm mb-1 block">店舗名</Label>
            <Input value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="鈴木タイヤ＆オイル" />
          </div>
          <div>
            <Label className="text-sm mb-1 block">住所</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="東京都渋谷区..." />
          </div>
          <div>
            <Label className="text-sm mb-1 block">電話番号（任意）</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03-1234-5678" />
          </div>
          <div>
            <Label className="text-sm mb-1 block">紹介文（任意）</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm mb-1 block">緯度</Label>
              <Input type="number" step="0.0001" value={lat} onChange={(e) => setLat(e.target.value)} />
            </div>
            <div>
              <Label className="text-sm mb-1 block">経度</Label>
              <Input type="number" step="0.0001" value={lng} onChange={(e) => setLng(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleCreateShop} disabled={!shopName || !address || saving} className="w-full">
            {saving ? "登録中..." : "店舗を登録する"}
          </Button>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "登録メニュー", value: `${menuCount}件`, icon: UtensilsCrossed },
    { label: "作業実績", value: `${recordCount}件`, icon: ClipboardList },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Store className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">{shop.name}</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {stats.map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <CardTitle className="text-sm">Stripe Connect</CardTitle>
            </div>
            <Badge variant="secondary" className="text-[10px]">プロトタイプ</Badge>
          </div>
          <CardDescription className="text-xs">
            本番環境ではStripeアカウント連携により自動決済が有効になります
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
