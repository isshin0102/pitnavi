"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Loader2,
  MapPin,
  Store,
  X,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WORK_CATEGORY_LABELS } from "@/lib/types";
import type { Work } from "@/lib/types";
import { getAllPublicWorks } from "@/lib/data/works";
import { isSupabaseConfigured } from "@/lib/supabase/helpers";

/* ---------- モックデータ ---------- */
const MOCK_WORKS: Work[] = [
  {
    id: "w1",
    shop_id: "shop-1",
    title: "N-BOX スタッドレス → サマータイヤ交換",
    description:
      "155/65R14 スタッドレスからサマータイヤへ交換。バランス調整込みで40分で完了しました。",
    car_name: "Honda N-BOX JF3",
    work_date: "2026-05-15",
    before_image_url: null,
    after_image_url: null,
    extra_image_url: null,
    category: "tire_change",
    is_published: true,
    created_at: "2026-05-15T10:00:00Z",
    updated_at: "2026-05-15T10:00:00Z",
    shops: { name: "鈴木タイヤ＆オイル", address: "東京都渋谷区神宮前1-2-3" },
  },
  {
    id: "w2",
    shop_id: "shop-2",
    title: "アクア エンジンオイル交換 50,000km",
    description: "トヨタ アクアの定期オイル交換。0W-20を3.4L使用。フィルターも同時交換。",
    car_name: "Toyota Aqua NHP10",
    work_date: "2026-05-12",
    before_image_url: null,
    after_image_url: null,
    extra_image_url: null,
    category: "oil_change",
    is_published: true,
    created_at: "2026-05-12T14:00:00Z",
    updated_at: "2026-05-12T14:00:00Z",
    shops: { name: "山田モータース", address: "東京都新宿区新宿3-4-5" },
  },
  {
    id: "w3",
    shop_id: "shop-1",
    title: "ジムニー フロントバンパー板金塗装",
    description: "スズキ ジムニーのフロントバンパー擦り傷を板金塗装で修復。色合わせバッチリ。",
    car_name: "Suzuki Jimny JB64W",
    work_date: "2026-05-10",
    before_image_url: null,
    after_image_url: null,
    extra_image_url: null,
    category: "body_repair",
    is_published: true,
    created_at: "2026-05-10T09:00:00Z",
    updated_at: "2026-05-10T09:00:00Z",
    shops: { name: "鈴木タイヤ＆オイル", address: "東京都渋谷区神宮前1-2-3" },
  },
];

/* ---------- カテゴリフィルタ ---------- */
const FILTER_CATEGORIES = [
  { key: "all", label: "すべて" },
  { key: "tire_change", label: "タイヤ" },
  { key: "oil_change", label: "オイル" },
  { key: "inspection", label: "車検" },
  { key: "body_repair", label: "板金" },
  { key: "custom", label: "カスタム" },
  { key: "maintenance", label: "整備" },
];

/* ---------- ライトボックス ---------- */
function Lightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(initialIndex);

  function handlePrev() {
    setIdx((i) => (i > 0 ? i - 1 : images.length - 1));
  }
  function handleNext() {
    setIdx((i) => (i < images.length - 1 ? i + 1 : 0));
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 text-white/80 hover:text-white"
      >
        <X className="h-6 w-6" />
      </button>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-3 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-3 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      <img
        src={images[idx]}
        alt=""
        loading="lazy"
        decoding="async"
        className="max-h-[85vh] max-w-[95vw] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />

      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                i === idx ? "bg-white" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- ギャラリーカード ---------- */
function WorkCard({
  work,
  onImageClick,
}: {
  work: Work;
  onImageClick: (images: string[], idx: number) => void;
}) {
  const images = [
    work.before_image_url,
    work.after_image_url,
    work.extra_image_url,
  ].filter(Boolean) as string[];

  const hasImages = images.length > 0;
  const hasBothBA = work.before_image_url && work.after_image_url;

  return (
    <div className="group rounded-xl overflow-hidden border bg-card shadow-sm hover:shadow-md transition-shadow">
      {/* 写真エリア */}
      {hasBothBA ? (
        <div className="grid grid-cols-2 aspect-[2/1]">
          <div
            className="relative bg-muted cursor-pointer overflow-hidden"
            onClick={() => onImageClick(images, 0)}
          >
            <img
              src={work.before_image_url!}
              alt="Before"
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <span className="absolute bottom-0 left-0 bg-gradient-to-r from-black/70 to-transparent text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
              Before
            </span>
          </div>
          <div
            className="relative bg-muted cursor-pointer overflow-hidden"
            onClick={() => onImageClick(images, 1)}
          >
            <img
              src={work.after_image_url!}
              alt="After"
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <span className="absolute bottom-0 left-0 bg-gradient-to-r from-primary/90 to-transparent text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
              After
            </span>
          </div>
        </div>
      ) : hasImages ? (
        <div
          className="relative aspect-video bg-muted cursor-pointer overflow-hidden"
          onClick={() => onImageClick(images, 0)}
        >
          <img
            src={images[0]}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {images.length > 1 && (
            <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
              +{images.length - 1}
            </span>
          )}
        </div>
      ) : (
        <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
          <Camera className="h-10 w-10 text-muted-foreground/20" />
        </div>
      )}

      {/* 情報エリア */}
      <div className="p-3">
        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
          <Badge
            variant="secondary"
            className="text-[9px] px-1.5 py-0"
          >
            {WORK_CATEGORY_LABELS[work.category] ?? work.category}
          </Badge>
          {work.car_name && (
            <span className="text-[10px] text-muted-foreground">
              {work.car_name}
            </span>
          )}
        </div>

        <h3 className="text-sm font-semibold leading-tight line-clamp-2 mb-1.5">
          {work.title}
        </h3>

        {work.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {work.description}
          </p>
        )}

        {/* 店舗情報 */}
        {work.shops && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground border-t pt-2 mt-2">
            <Store className="h-3 w-3 shrink-0" />
            <span className="truncate">{work.shops.name}</span>
          </div>
        )}

        {work.work_date && (
          <p className="text-[10px] text-muted-foreground mt-1">
            {new Date(work.work_date).toLocaleDateString("ja-JP")}
          </p>
        )}
      </div>
    </div>
  );
}

/* ---------- メインコンポーネント ---------- */
export default function WorksGalleryPage() {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");

  // ライトボックス
  const [lightboxImages, setLightboxImages] = useState<string[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        if (!isSupabaseConfigured()) {
          setWorks(MOCK_WORKS);
          return;
        }
        const data = await getAllPublicWorks();
        setWorks(data);
      } catch (e) {
        console.error("[WorksGallery] error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function openLightbox(images: string[], idx: number) {
    setLightboxImages(images);
    setLightboxIndex(idx);
  }

  const filtered =
    activeCategory === "all"
      ? works
      : works.filter((w) => w.category === activeCategory);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* ヘッダー */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">施工ギャラリー</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          プロの技をビフォーアフターでチェック
        </p>
      </div>

      {/* カテゴリフィルター */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 -mx-4 px-4">
        {FILTER_CATEGORIES.map((cat) => {
          const count =
            cat.key === "all"
              ? works.length
              : works.filter((w) => w.category === cat.key).length;
          if (cat.key !== "all" && count === 0) return null;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {cat.label}
              {count > 0 && (
                <span className="ml-1 opacity-60">({count})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* コンテンツ */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          読み込み中...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <Camera className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-sm text-muted-foreground mb-4">
            まだ実績が投稿されていません
          </p>
          <Button variant="outline" render={<Link href="/" />}>
            <MapPin className="mr-2 h-4 w-4" />
            工場をさがす
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((work) => (
            <WorkCard key={work.id} work={work} onImageClick={openLightbox} />
          ))}
        </div>
      )}

      {/* ライトボックス */}
      {lightboxImages && (
        <Lightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxImages(null)}
        />
      )}
    </div>
  );
}
