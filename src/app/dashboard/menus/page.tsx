"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
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
import { MOCK_SERVICE_MENUS } from "@/lib/mock-data";

export default function MenusPage() {
  const [menus, setMenus] = useState<ServiceMenu[]>(
    MOCK_SERVICE_MENUS.filter((m) => m.shop_id === "shop-1")
  );
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<ServiceCategory>("tire_change");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceLight, setPriceLight] = useState("");
  const [priceStandard, setPriceStandard] = useState("");
  const [minutes, setMinutes] = useState("");

  function handleAdd() {
    if (!name || !priceLight || !priceStandard) return;
    const newMenu: ServiceMenu = {
      id: `menu-${Date.now()}`,
      shop_id: "shop-1",
      category,
      name,
      description: description || null,
      price_light: parseInt(priceLight, 10),
      price_standard: parseInt(priceStandard, 10),
      estimated_minutes: minutes ? parseInt(minutes, 10) : null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setMenus([...menus, newMenu]);
    resetForm();
    setOpen(false);
  }

  function resetForm() {
    setName("");
    setDescription("");
    setPriceLight("");
    setPriceStandard("");
    setMinutes("");
    setCategory("tire_change");
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
                  onChange={(e) =>
                    setCategory(e.target.value as ServiceCategory)
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
              <div>
                <Label className="text-sm mb-1 block">メニュー名</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="タイヤ交換（4本）"
                />
              </div>
              <div>
                <Label className="text-sm mb-1 block">説明（任意）</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm mb-1 block">軽自動車（円）</Label>
                  <Input
                    type="number"
                    value={priceLight}
                    onChange={(e) => setPriceLight(e.target.value)}
                    placeholder="4800"
                  />
                </div>
                <div>
                  <Label className="text-sm mb-1 block">普通車（円）</Label>
                  <Input
                    type="number"
                    value={priceStandard}
                    onChange={(e) => setPriceStandard(e.target.value)}
                    placeholder="6800"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm mb-1 block">目安時間（分）</Label>
                <Input
                  type="number"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  placeholder="40"
                />
              </div>
              <Button onClick={handleAdd} className="w-full">
                追加する
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
