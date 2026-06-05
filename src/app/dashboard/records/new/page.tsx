"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhotoUpload, type UploadedPhoto } from "@/components/photo-upload";
import type { ServiceCategory, CarType } from "@/lib/types";
import { SERVICE_CATEGORY_LABELS, CAR_TYPE_LABELS } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/helpers";
import { getCurrentUser } from "@/lib/data/auth";
import { addWorkRecord, addWorkRecordPhoto } from "@/lib/data/dashboard";

export default function NewRecordPage() {
  const [shopId, setShopId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [category, setCategory] = useState<ServiceCategory>("tire_change");
  const [carType, setCarType] = useState<CarType>("standard");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [laborCost, setLaborCost] = useState("");
  const [duration, setDuration] = useState("");
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);

  useEffect(() => {
    (async () => {
      if (!isSupabaseConfigured()) {
        setShopId("mock-shop");
        setLoading(false);
        return;
      }

      const user = await getCurrentUser();
      if (!user) { setLoading(false); return; }

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: shops } = await supabase
        .from("shops")
        .select("id")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      setShopId(shops?.[0]?.id ?? null);
      setLoading(false);
    })();
  }, []);

  async function handleSubmit() {
    if (!title || !laborCost || !duration || !shopId) return;
    setSaving(true);

    try {
      const record = await addWorkRecord({
        shop_id: shopId,
        title,
        description: description || undefined,
        category,
        car_type: carType,
        labor_cost: parseInt(laborCost, 10),
        duration_minutes: parseInt(duration, 10),
      });

      if (record?.id && photos.length > 0) {
        for (let i = 0; i < photos.length; i++) {
          if (photos[i].storagePath) {
            await addWorkRecordPhoto({
              work_record_id: record.id,
              storage_path: photos[i].storagePath!,
              display_order: i,
            });
          }
        }
      }

      setSubmitted(true);
    } catch (e) {
      alert(e instanceof Error ? e.message : "投稿に失敗しました");
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

  if (submitted) {
    return (
      <div className="py-12 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
        <h2 className="text-lg font-bold mb-2">作業実績を投稿しました</h2>
        <Button className="mt-4" render={<Link href="/dashboard/records" />}>
          一覧にもどる
        </Button>
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
      <Link
        href="/dashboard/records"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> 実績一覧にもどる
      </Link>

      <h2 className="text-lg font-semibold mb-4">作業実績を投稿</h2>

      <div className="space-y-4 max-w-lg">
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
          <Label className="text-sm mb-1 block">車種</Label>
          <div className="flex gap-2">
            {(["light", "standard"] as const).map((ct) => (
              <button
                key={ct}
                onClick={() => setCarType(ct)}
                className={`flex-1 rounded-lg border p-2 text-sm text-center transition-colors ${
                  carType === ct ? "border-primary bg-primary/5 font-medium" : "hover:bg-accent"
                }`}
              >
                {CAR_TYPE_LABELS[ct]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm mb-1 block">タイトル</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="スタッドレスからサマータイヤへ交換" />
        </div>

        <div>
          <Label className="text-sm mb-1 block">作業内容（任意）</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="N-BOXのタイヤ交換。155/65R14..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm mb-1 block">工賃（円）</Label>
            <Input type="number" value={laborCost} onChange={(e) => setLaborCost(e.target.value)} placeholder="4800" />
          </div>
          <div>
            <Label className="text-sm mb-1 block">作業時間（分）</Label>
            <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="40" />
          </div>
        </div>

        <div>
          <Label className="text-sm mb-2 block">施工写真（任意）</Label>
          <PhotoUpload onPhotosChange={setPhotos} maxPhotos={5} />
        </div>

        <Button onClick={handleSubmit} disabled={!title || !laborCost || !duration || saving} className="w-full">
          {saving ? "投稿中..." : "投稿する"}
        </Button>
      </div>
    </div>
  );
}
