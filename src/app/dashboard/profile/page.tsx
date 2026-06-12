"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Trash2,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { isSupabaseConfigured } from "@/lib/supabase/helpers";
import { getCurrentUser } from "@/lib/data/auth";
import { updateShop, deleteShop } from "@/lib/data/dashboard";
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
  const router = useRouter();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // フォーム state
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
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
          license_number: "第123456789012号",
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
        .eq("is_active", true)
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
    setLicenseNumber(s.license_number || "");
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
    if (!licenseNumber.trim()) {
      alert("古物商許可番号は必須入力です");
      return;
    }
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
        license_number: licenseNumber.trim(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      alert(e instanceof Error ? e.message : "保存に失敗しました");
    }
    setSaving(false);
  }

  async function handleDeleteShop() {
    if (!shop) return;

    const confirmed = confirm(
      "本当にこの店舗を削除しますか？この操作は取り消せません。"
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteShop(shop.id);
      // ダッシュボード概要へリダイレクト
      alert("店舗を削除しました");
      window.location.href = "/dashboard";
    } catch (e) {
      alert(e instanceof Error ? e.message : "削除に失敗しました");
      setDeleting(false);
    }
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

      {/* 古物商許可番号セクション */}
      <div className="rounded-lg border p-4 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-1.5 text-muted-foreground">
          <ShieldCheck className="h-4 w-4" />
          古物商許可番号
        </h3>

        <div>
          <Label className="text-sm mb-1.5 block">
            古物商許可番号 <span className="text-destructive">*</span>
          </Label>
          <Input
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            placeholder="第○○○○○○○○○○○○号"
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            安全な取引のため、古物商許可番号の入力は必須です。公安委員会から交付された許可番号を入力してください。
          </p>
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
          Google マップで店舗の位置を右クリック → 座標をコピーして貼り付けてください
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
            タップで追加
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
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSave}
          disabled={!name || !address || !licenseNumber.trim() || saving}
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

      {/* 店舗削除セクション */}
      <Separator />
      <div className="rounded-lg border border-destructive/30 p-4 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-1.5 text-destructive">
          <AlertTriangle className="h-4 w-4" />
          危険な操作
        </h3>
        <p className="text-xs text-muted-foreground">
          店舗を削除すると、この店舗に紐づくメニューや予約データは非公開になります。この操作は取り消せません。
        </p>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
          onClick={handleDeleteShop}
          disabled={deleting}
        >
          {deleting ? (
            <>
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              削除中...
            </>
          ) : (
            <>
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              この店舗を削除する
            </>
          )}
        </Button>
      </div>

      {/* 下部余白 */}
      <div className="pb-8" />
    </div>
  );
}
