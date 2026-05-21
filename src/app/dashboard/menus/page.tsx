"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ServiceMenuTable } from "@/components/service-menu-table";
import type { ServiceCategory, ServiceMenu } from "@/lib/types";
import { SERVICE_CATEGORY_LABELS } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/helpers";
import { getCurrentUser } from "@/lib/data/auth";
import { addServiceMenu, getMyMenus, deleteServiceMenu } from "@/lib/data/dashboard";
import { MOCK_SERVICE_MENUS } from "@/lib/mock-data";

export default function MenusPage() {
  const [menus, setMenus] = useState<ServiceMenu[]>([]);
  const [shopId, setShopId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
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
        setShopId("shop-1");
        setLoading(false);
        return;
      }

      const user = await getCurrentUser();
      if (!user) { setLoading(false); return; }

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: shop } = await supabase
        .from("shops")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (shop) {
        setShopId(shop.id);
        const data = await getMyMenus(shop.id);
        setMenus(data);
      }
      setLoading(false);
    })();
  }, []);

  async function handleAdd() {
    if (!name || !priceLight || !priceStandard || !shopId) return;
    setSaving(true);

    try {
      const newMenu = await addServiceMenu({
        shop_id: shopId,
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
    try {
      await deleteServiceMenu(menuId);
      setMenus(menus.filter((m) => m.id !== menuId));
    } catch (e) {
      alert(e instanceof Error ? e.message : "削除に失敗しました");
    }
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

  if (!shopId) {
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
        <Dialog open={open} onOpenChange={setOpen}>
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
                  onChange={(e) => setCategory(e.target.value as ServiceCategory)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  {Object.entries(SERVICE_CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-sm mb-1 block">メニュー名</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="タイヤ交換（4本）" />
              </div>
              <div>
                <Label className="text-sm mb-1 block">説明（任意）</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm mb-1 block">軽自動車（円）</Label>
                  <Input type="number" value={priceLight} onChange={(e) => setPriceLight(e.target.value)} placeholder="4800" />
                </div>
                <div>
                  <Label className="text-sm mb-1 block">普通車（円）</Label>
                  <Input type="number" value={priceStandard} onChange={(e) => setPriceStandard(e.target.value)} placeholder="6800" />
                </div>
              </div>
              <div>
                <Label className="text-sm mb-1 block">目安時間（分）</Label>
                <Input type="number" value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="40" />
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
        <ServiceMenuTable menus={menus} showFeeBreakdown />
      )}
    </div>
  );
}
