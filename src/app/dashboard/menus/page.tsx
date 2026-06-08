"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ServiceCategory, ServiceMenu } from "@/lib/types";
import { SERVICE_CATEGORY_LABELS, CAR_TYPE_LABELS } from "@/lib/types";
import { formatYen } from "@/lib/fee-calculator";
import { isSupabaseConfigured } from "@/lib/supabase/helpers";
import { getCurrentUser } from "@/lib/data/auth";
import {
  addServiceMenu,
  getAllMyMenus,
  getMyShops,
  deleteServiceMenu,
} from "@/lib/data/dashboard";
import { MOCK_SERVICE_MENUS } from "@/lib/mock-data";
import { Clock } from "lucide-react";

/** 車検カテゴリ選択時のテンプレート */
const INSPECTION_TEMPLATE = {
  name: "車検基本整備",
  description:
    "法定24ヶ月点検＋検査代行。基本料金にはブレーキ・灯火・排ガス等の検査項目が含まれます。\n※お車の状態により追加整備（ブレーキパッド、ブーツ類、ベルト交換等）が別途発生する場合があります。正確な金額はご来店・現車確認後にアプリ内でお見積もりを提示いたします。",
  priceLight: "45000",
  priceStandard: "55000",
  minutes: "120",
};

export default function MenusPage() {
  const [menus, setMenus] = useState<ServiceMenu[]>([]);
  const [shopIds, setShopIds] = useState<string[]>([]);
  const [primaryShopId, setPrimaryShopId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [category, setCategory] = useState<ServiceCategory>("tire_change");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceLight, setPriceLight] = useState("");
  const [priceStandard, setPriceStandard] = useState("");
  const [minutes, setMinutes] = useState("");

  useEffect(() => {
    (async () => {
      if (!isSupabaseConfigured()) {
        setMenus(MOCK_SERVICE_MENUS.filter((m) => m.shop_id === "shop-1"));
        setPrimaryShopId("shop-1");
        setShopIds(["shop-1"]);
        setLoading(false);
        return;
      }

      const user = await getCurrentUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // 全店舗を取得
      const shops = await getMyShops(user.id);
      if (shops.length === 0) {
        setLoading(false);
        return;
      }

      const ids = shops.map((s: { id: string }) => s.id);
      setShopIds(ids);
      setPrimaryShopId(ids[0]);

      // 全店舗のメニューをまとめて取得
      const data = await getAllMyMenus(ids);
      setMenus(data);
      setLoading(false);
    })();
  }, []);

  /** カテゴリ変更時にテンプレート適用 */
  function handleCategoryChange(newCategory: ServiceCategory) {
    setCategory(newCategory);

    // 車検を選んだ時、フォームが空ならテンプレートを自動入力
    if (newCategory === "inspection" && !name && !description) {
      setName(INSPECTION_TEMPLATE.name);
      setDescription(INSPECTION_TEMPLATE.description);
      setPriceLight(INSPECTION_TEMPLATE.priceLight);
      setPriceStandard(INSPECTION_TEMPLATE.priceStandard);
      setMinutes(INSPECTION_TEMPLATE.minutes);
    }
  }

  async function handleAdd() {
    if (!name || !priceLight || !priceStandard || !primaryShopId) return;
    setSaving(true);

    try {
      const newMenu = await addServiceMenu({
        shop_id: primaryShopId,
        category,
        name,
        description: description || undefined,
        price_light: parseInt(priceLight, 10),
        price_standard: parseInt(priceStandard, 10),
        estimated_minutes: minutes ? parseInt(minutes, 10) : undefined,
      });

      setMenus([...menus, newMenu as ServiceMenu]);
      resetForm();
      setOpen(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : "保存に失敗しました");
    }
    setSaving(false);
  }

  async function handleDelete(menuId: string) {
    if (!confirm("このメニューを削除しますか？")) return;
    setDeletingId(menuId);
    try {
      await deleteServiceMenu(menuId);
      setMenus(menus.filter((m) => m.id !== menuId));
    } catch (e) {
      alert(e instanceof Error ? e.message : "削除に失敗しました");
    }
    setDeletingId(null);
  }

  function resetForm() {
    setName("");
    setDescription("");
    setPriceLight("");
    setPriceStandard("");
    setMinutes("");
    setCategory("tire_change");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        読み込み中...
      </div>
    );
  }

  if (shopIds.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        まず「概要」ページで店舗を登録してください
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">メニュー管理</h2>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) resetForm();
          }}
        >
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="mr-1 h-4 w-4" />
            メニュー追加
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新しいメニューを追加</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label className="text-sm mb-1 block">カテゴリ</Label>
                <select
                  value={category}
                  onChange={(e) =>
                    handleCategoryChange(e.target.value as ServiceCategory)
                  }
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  {Object.entries(SERVICE_CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              {/* 車検カテゴリ選択時の注意書き */}
              {category === "inspection" && (
                <div className="rounded-md border border-orange-200 bg-orange-50 p-3 text-xs text-orange-800">
                  <div className="flex items-start gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium mb-1">
                        車検メニューの料金について
                      </p>
                      <p>
                        車検の基本料金は目安価格として「〇〇円〜」と表示されます。
                        お車の状態により追加整備費用が発生するため、正確な金額はご来店・現車確認後にお見積もりとして提示する流れになります。
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label className="text-sm mb-1 block">メニュー名</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={
                    category === "inspection"
                      ? "車検基本整備"
                      : "タイヤ交換（4本）"
                  }
                />
              </div>
              <div>
                <Label className="text-sm mb-1 block">説明（任意）</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder={
                    category === "inspection"
                      ? "法定24ヶ月点検＋検査代行。\n※お車の状態により追加整備が別途発生する場合があります。"
                      : "メニューの内容を入力"
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm mb-1 block">
                    軽自動車（円）
                    {category === "inspection" && (
                      <span className="text-orange-600 ml-1">※目安</span>
                    )}
                  </Label>
                  <Input
                    type="number"
                    value={priceLight}
                    onChange={(e) => setPriceLight(e.target.value)}
                    placeholder={category === "inspection" ? "45000" : "4800"}
                  />
                </div>
                <div>
                  <Label className="text-sm mb-1 block">
                    普通車（円）
                    {category === "inspection" && (
                      <span className="text-orange-600 ml-1">※目安</span>
                    )}
                  </Label>
                  <Input
                    type="number"
                    value={priceStandard}
                    onChange={(e) => setPriceStandard(e.target.value)}
                    placeholder={category === "inspection" ? "55000" : "6800"}
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm mb-1 block">目安時間（分）</Label>
                <Input
                  type="number"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  placeholder={category === "inspection" ? "120" : "40"}
                />
              </div>
              <Button onClick={handleAdd} className="w-full" disabled={saving}>
                {saving ? "保存中..." : "追加する"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {menus.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          メニューがまだ登録されていません
        </p>
      ) : (
        <div className="space-y-2">
          {menus.map((menu) => {
            const isInspection = menu.category === "inspection";
            return (
              <div
                key={menu.id}
                className="rounded-lg border p-3 relative group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {SERVICE_CATEGORY_LABELS[menu.category]}
                      </Badge>
                      <span className="font-medium text-sm truncate">
                        {menu.name}
                      </span>
                    </div>
                    {menu.description && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2 whitespace-pre-line">
                        {menu.description}
                      </p>
                    )}
                    {menu.estimated_minutes && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        約{menu.estimated_minutes}分
                      </div>
                    )}
                    {isInspection && (
                      <p className="mt-1 text-[10px] text-orange-600">
                        ※料金は目安です。追加整備費用が発生する場合があります
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-muted-foreground mb-0.5">
                      軽: {formatYen(menu.price_light)}
                      {isInspection && "〜"}
                    </div>
                    <div className="font-bold text-sm">
                      普: {formatYen(menu.price_standard)}
                      {isInspection && "〜"}
                    </div>
                  </div>
                </div>

                {/* 削除ボタン */}
                <button
                  onClick={() => handleDelete(menu.id)}
                  disabled={deletingId === menu.id}
                  className="absolute top-2 right-2 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="削除"
                >
                  {deletingId === menu.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
