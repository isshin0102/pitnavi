"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
  Store,
  Clock,
} from "lucide-react";
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
import type { ServiceCategory, ServiceMenu, Shop } from "@/lib/types";
import { SERVICE_CATEGORY_LABELS } from "@/lib/types";
import { formatYen } from "@/lib/fee-calculator";
import { isSupabaseConfigured } from "@/lib/supabase/helpers";
import { getCurrentUser } from "@/lib/data/auth";
import {
  addServiceMenu,
  getMyMenus,
  getMyShops,
  deleteServiceMenu,
} from "@/lib/data/dashboard";
import { MOCK_SERVICE_MENUS } from "@/lib/mock-data";
import { MOCK_SHOPS } from "@/lib/mock-data";

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
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [menus, setMenus] = useState<ServiceMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [menusLoading, setMenusLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [category, setCategory] = useState<ServiceCategory>("tire_change");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceLight, setPriceLight] = useState("");
  const [priceStandard, setPriceStandard] = useState("");
  const [minutes, setMinutes] = useState("");

  /** 指定店舗のメニューを取得 */
  const fetchMenusForShop = useCallback(async (shopId: string) => {
    setMenusLoading(true);
    try {
      const data = await getMyMenus(shopId);
      setMenus(data);
    } catch (e) {
      console.error("[MenusPage] fetchMenus error:", e);
      setMenus([]);
    }
    setMenusLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      if (!isSupabaseConfigured()) {
        setShops(MOCK_SHOPS);
        setSelectedShopId("shop-1");
        setMenus(MOCK_SERVICE_MENUS.filter((m) => m.shop_id === "shop-1"));
        setLoading(false);
        return;
      }

      const user = await getCurrentUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const myShops = (await getMyShops(user.id)) as Shop[];
      setShops(myShops);

      if (myShops.length > 0) {
        const firstId = myShops[0].id;
        setSelectedShopId(firstId);
        await fetchMenusForShop(firstId);
      }

      setLoading(false);
    })();
  }, [fetchMenusForShop]);

  /** 店舗切り替え */
  async function handleShopChange(shopId: string) {
    setSelectedShopId(shopId);
    await fetchMenusForShop(shopId);
  }

  /** カテゴリ変更時にテンプレート適用 */
  function handleCategoryChange(newCategory: ServiceCategory) {
    setCategory(newCategory);
    if (newCategory === "inspection" && !name && !description) {
      setName(INSPECTION_TEMPLATE.name);
      setDescription(INSPECTION_TEMPLATE.description);
      setPriceLight(INSPECTION_TEMPLATE.priceLight);
      setPriceStandard(INSPECTION_TEMPLATE.priceStandard);
      setMinutes(INSPECTION_TEMPLATE.minutes);
    }
  }

  async function handleAdd() {
    if (!name || !priceLight || !priceStandard || !selectedShopId) return;
    setSaving(true);

    try {
      const newMenu = await addServiceMenu({
        shop_id: selectedShopId,
        category,
        name,
        description: description || undefined,
        price_light: parseInt(priceLight, 10),
        price_standard: parseInt(priceStandard, 10),
        estimated_minutes: minutes ? parseInt(minutes, 10) : undefined,
      });

      setMenus((prev) => [...prev, newMenu as ServiceMenu]);
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
      setMenus((prev) => prev.filter((m) => m.id !== menuId));
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

  /** 選択中の店舗名を取得 */
  const selectedShopName =
    shops.find((s) => s.id === selectedShopId)?.name ?? "";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        読み込み中...
      </div>
    );
  }

  if (shops.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        まず「概要」ページで店舗を登録してください
      </p>
    );
  }

  return (
    <div>
      {/* ヘッダー：タイトル + メニュー追加ボタン */}
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
              {/* 追加先の店舗表示 */}
              <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2">
                <p className="text-xs text-muted-foreground">追加先の店舗</p>
                <p className="text-sm font-medium flex items-center gap-1.5 mt-0.5">
                  <Store className="h-3.5 w-3.5 text-primary" />
                  {selectedShopName}
                </p>
              </div>

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

      {/* 店舗セレクター */}
      {shops.length > 1 ? (
        <div className="mb-4">
          <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
            <Store className="h-3 w-3" />
            メニューを表示・追加する店舗を選択
          </Label>
          <select
            value={selectedShopId ?? ""}
            onChange={(e) => handleShopChange(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm font-medium"
          >
            {shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.address ? ` — ${s.address}` : ""}
              </option>
            ))}
          </select>
        </div>
      ) : (
        /* 1店舗のみの場合は店舗名バッジで表示 */
        <div className="mb-4 flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
          <Store className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-medium">{selectedShopName}</span>
          <Badge variant="secondary" className="text-[10px]">
            {menus.length}件のメニュー
          </Badge>
        </div>
      )}

      {/* メニュー一覧 */}
      {menusLoading ? (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          メニューを読み込み中...
        </div>
      ) : menus.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">
            「{selectedShopName}」にはまだメニューが登録されていません
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            右上の「メニュー追加」から追加してください
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">
              「{selectedShopName}」のメニュー（{menus.length}件）
            </p>
          </div>
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
                        <Badge
                          variant="outline"
                          className="text-[10px] shrink-0"
                        >
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
        </>
      )}
    </div>
  );
}
