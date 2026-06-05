"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  CheckCircle,
  ImagePlus,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WORK_CATEGORY_LABELS } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/helpers";
import { getCurrentUser } from "@/lib/data/auth";
import { uploadWorkImage, createWork } from "@/lib/data/works";

type PhotoSlot = {
  label: string;
  file: File | null;
  preview: string | null;
};

export default function NewWorkPage() {
  const [shopId, setShopId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [carName, setCarName] = useState("");
  const [workDate, setWorkDate] = useState("");
  const [category, setCategory] = useState("other");

  const [photos, setPhotos] = useState<PhotoSlot[]>([
    { label: "作業前（Before）", file: null, preview: null },
    { label: "作業後（After）", file: null, preview: null },
    { label: "追加写真（任意）", file: null, preview: null },
  ]);

  const fileRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    (async () => {
      try {
        if (!isSupabaseConfigured()) {
          setShopId("mock-shop");
          return;
        }
        const user = await getCurrentUser();
        if (!user) return;

        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: shops } = await supabase
          .from("shops")
          .select("id")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);
        setShopId(shops?.[0]?.id ?? null);
      } catch (e) {
        console.error("[NewWorkPage] init error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function handleFileSelect(index: number, files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    const preview = URL.createObjectURL(file);
    setPhotos((prev) =>
      prev.map((p, i) => (i === index ? { ...p, file, preview } : p))
    );
  }

  function clearPhoto(index: number) {
    setPhotos((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, file: null, preview: null } : p
      )
    );
  }

  async function handleSubmit() {
    if (!title.trim() || !shopId) return;
    setSaving(true);

    try {
      // 画像アップロード
      let beforeUrl: string | undefined;
      let afterUrl: string | undefined;
      let extraUrl: string | undefined;

      if (photos[0].file) {
        beforeUrl = await uploadWorkImage(photos[0].file, "before");
      }
      if (photos[1].file) {
        afterUrl = await uploadWorkImage(photos[1].file, "after");
      }
      if (photos[2].file) {
        extraUrl = await uploadWorkImage(photos[2].file, "extra");
      }

      await createWork({
        shop_id: shopId,
        title,
        description: description || undefined,
        car_name: carName || undefined,
        work_date: workDate || undefined,
        before_image_url: beforeUrl,
        after_image_url: afterUrl,
        extra_image_url: extraUrl,
        category,
      });

      setSubmitted(true);
    } catch (e) {
      console.error("[NewWorkPage] submit error:", e);
      alert(e instanceof Error ? e.message : "投稿に失敗しました");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        読み込み中...
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="py-12 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
        <h2 className="text-lg font-bold mb-2">実績を投稿しました！</h2>
        <p className="text-sm text-muted-foreground mb-6">
          ギャラリーページに公開されます
        </p>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" render={<Link href="/dashboard/works" />}>
            実績一覧へ
          </Button>
          <Button render={<Link href="/works" />}>ギャラリーを見る</Button>
        </div>
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
        href="/dashboard/works"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> 実績一覧にもどる
      </Link>

      <h2 className="text-lg font-semibold mb-1">実績を投稿</h2>
      <p className="text-xs text-muted-foreground mb-6">
        ビフォーアフター写真でお客さんにアピール！
      </p>

      <div className="space-y-5 max-w-lg">
        {/* カテゴリ */}
        <div>
          <Label className="text-sm mb-1 block">カテゴリ</Label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            {Object.entries(WORK_CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {/* タイトル */}
        <div>
          <Label className="text-sm mb-1 block">タイトル *</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="N-BOX タイヤ交換 ビフォーアフター"
          />
        </div>

        {/* 作業内容 */}
        <div>
          <Label className="text-sm mb-1 block">作業内容</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="155/65R14 スタッドレスからサマータイヤへ交換。バランス調整込み。"
          />
        </div>

        {/* 車名・日付 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm mb-1 block">車名・型式</Label>
            <Input
              value={carName}
              onChange={(e) => setCarName(e.target.value)}
              placeholder="N-BOX JF3"
            />
          </div>
          <div>
            <Label className="text-sm mb-1 block">作業日</Label>
            <Input
              type="date"
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
            />
          </div>
        </div>

        {/* 写真アップロード（Before / After / Extra） */}
        <div>
          <Label className="text-sm mb-2 block">
            写真アップロード（スマホカメラ対応）
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((slot, i) => (
              <div key={i}>
                <p className="text-[10px] text-muted-foreground mb-1 text-center font-medium">
                  {slot.label}
                </p>
                {slot.preview ? (
                  <div className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                    <img
                      src={slot.preview}
                      alt={slot.label}
                      className="h-full w-full object-cover"
                    />
                    <button
                      onClick={() => clearPhoto(i)}
                      className="absolute top-1 right-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRefs[i].current?.click()}
                    className="aspect-square w-full rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 text-muted-foreground hover:bg-accent/50 transition-colors"
                  >
                    {i < 2 ? (
                      <Camera className="h-6 w-6" />
                    ) : (
                      <ImagePlus className="h-6 w-6" />
                    )}
                    <span className="text-[10px]">
                      {i === 0 ? "Before" : i === 1 ? "After" : "追加"}
                    </span>
                  </button>
                )}
                <input
                  ref={fileRefs[i]}
                  type="file"
                  accept="image/*"
                  capture={i < 2 ? "environment" : undefined}
                  className="hidden"
                  onChange={(e) => handleFileSelect(i, e.target.files)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 投稿ボタン */}
        <Button
          onClick={handleSubmit}
          disabled={!title.trim() || saving}
          className="w-full"
          size="lg"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              アップロード中...
            </>
          ) : (
            <>
              <Camera className="mr-2 h-4 w-4" />
              実績を投稿する
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
