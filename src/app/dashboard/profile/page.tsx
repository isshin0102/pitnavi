"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  Save,
  Store,
  MapPin,
  Phone,
  FileText,
  Sparkles,
  X,
  Plus,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { isSupabaseConfigured } from "@/lib/supabase/helpers";
import { getCurrentUser } from "@/lib/data/auth";
import { updateShop } from "@/lib/data/dashboard";
import type { Shop } from "@/lib/types";

/* ---------- おすすめタグ ---------- */
const SUGGESTED_SPECIALTIES = [
  "ドリフト",
  "シャコタン",
  "VIP",
  "オフロード",
  "痛車",
  "スポーツカー",
  "旧車・レストア",
  "ユーロ",
  "アメ車",
  "輸入車",
  "トラック・商用車",
  "EV・ハイブリッド",
  "タイヤ交換",
  "オイル交換",
  "車検",
  "板金・塗装",
  "エアロ",
  "足回り",
  "マフラー",
  "ラッピング",
];

export default function ShopProfilePage() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // フォーム state
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [specialty, setSpecialty] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    (async () => {
      if (!isSupabaseConfigured()) {
        const mock: Shop = {
          id: "mock",
          owner_id: "mock",
          name: "デモ店舗",
          address: "東京都渋谷区1-2-3",
          phone: "03-1234-5678",
          description: "デモ用店舗です",
          postal_code: null,
          latitude: 35.6894,
          longitude: 139.6917,
          image_url: null,
          specialty: ["ドリフト", "シャコタン"],
          stripe_account_id: null,
          stripe_onboarded: false,
          is_active: true,
          created_at: "",
          updated_at: "",
        };
        setShop(mock);
        populateForm(mock);
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
      const { data: shops } = await supabase
        .from("shops")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      const firstShop = shops?.[0] ?? null;
      if (firstShop) {
        const shopData = firstShop as Shop;
        setShop(shopData);
        populateForm(shopData);
      }
      setLoading(false);
    })();
  }, []);

  function populateForm(s: Shop) {
    setName(s.name || "");
    setAddress(s.address || "");
    setPhone(s.phone || "");
    setDescription(s.description || "");
    setLat(String(s.latitude || ""));
    setLng(String(s.longitude || ""));
    setSpecialty(s.specialty || []);
  }

  function addTag(tag: string) {
    const trimmed = tag.trim();
    if (!trimmed || specialty.includes(trimmed)) return;
    setSpecialty([...specialty, trimmed]);
  }

  function removeTag(tag: string) {
    setSpecialty(specialty.filter((t) => t !== tag));
  }

  function handleAddCustomTag() {
    if (newTag.trim()) {
      addTag(newTag.trim());
      setNewTag("");
    }
  }

  async function handleSave() {
    if (!shop || !name || !address) return;
    setSaving(true);
    setSaved(false);
    try {
      await updateShop(shop.id, {
        name,
        address,
        phone: phone || undefined,
        description: description || undefined,
        latitude: lat ? parseFloat(lat) : undefined,
        longitude: lng ? parseFloat(lng) : undefined,
        specialty,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      alert(e instanceof Error ? e.message : "保存に失敗しました");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        読み込み中...
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="py-16 text-center">
        <Store className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
        <p className="text-sm text-muted-foreground">
          先にダッシュボード概要から店舗を登録してください
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            ショップ情報
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            お店のプロフィールを編集できます
          </p>
        </div>
        {saved && (
          <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
            <CheckCircle className="h-3 w-3" />
            保存しました
          </Badge>
        )}
      </div>

      {/* 基本情報セクション */}
      <div className="rounded-lg border p-4 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-1.5 text-muted-foreground">
          <FileText className="h-4 w-4" />
          基本情報
        </h3>

        <div>
          <Label className="text-sm mb-1.5 block">
            店舗名 <span className="text-destructive">*</span>
          </Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="○○モータース"
          />
        </div>

        <div>
          <Label className="text-sm mb-1.5 block">
            住所 <span className="text-destructive">*</span>
          </Label>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="東京都渋谷区神宮前1-2-3"
          />
        </div>

        <div>
          <Label className="text-sm mb-1.5 block">
            <Phone className="inline h-3.5 w-3.5 mr-1" />
            電話番号
          </Label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="03-1234-5678"
          />
        </div>

        <div>
          <Label className="text-sm mb-1.5 block">紹介文</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="お店の特徴、こだわりポイント、営業時間など自由にどうぞ！"
          />
        </div>
      </div>

      {/* 位置情報セクション */}
      <div className="rounded-lg border p-4 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          位置情報（マップ表示用）
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm mb-1.5 block">緯度</Label>
            <Input
              type="number"
              step="0.0001"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="35.6894"
            />
          </div>
          <div>
            <Label className="text-sm mb-1.5 block">経度</Label>
            <Input
              type="number"
              step="0.0001"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="139.6917"
            />
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          💡 Google マップで店舗の位置を右クリック → 座標をコピーして貼り付けてください
        </p>
      </div>

      {/* 得意ジャンル セクション */}
      <div className="rounded-lg border p-4 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-1.5 text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          得意なカスタム・ジャンル
        </h3>

        {/* 選択済みタグ */}
        {specialty.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {specialty.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="gap-1 pl-2.5 pr-1.5 py-1"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-0.5 rounded-full hover:bg-muted p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* カスタムタグ入力 */}
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="自由入力で追加..."
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCustomTag();
              }
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddCustomTag}
            disabled={!newTag.trim()}
          >
            <Plus className="h-4 w-4 mr-1" />
            追加
          </Button>
        </div>

        {/* おすすめタグ */}
        <div>
          <p className="text-[11px] text-muted-foreground mb-2">
            タップで追加 👇
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_SPECIALTIES.filter((s) => !specialty.includes(s)).map(
              (tag) => (
                <button
                  key={tag}
                  onClick={() => addTag(tag)}
                  className="px-2.5 py-1 rounded-full text-xs border bg-background hover:bg-accent transition-colors"
                >
                  + {tag}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* 保存ボタン */}
      <div className="flex justify-end pt-2 pb-8">
        <Button
          onClick={handleSave}
          disabled={!name || !address || saving}
          className="min-w-[160px]"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              変更を保存する
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
