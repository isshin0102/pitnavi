"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { WorkRecord } from "@/lib/types";
import { SERVICE_CATEGORY_LABELS, CAR_TYPE_LABELS } from "@/lib/types";
import { formatYen } from "@/lib/fee-calculator";
import { getStoragePublicUrl } from "@/lib/supabase/helpers";
import {
  Clock,
  Banknote,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface WorkRecordDetailModalProps {
  record: WorkRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkRecordDetailModal({
  record,
  open,
  onOpenChange,
}: WorkRecordDetailModalProps) {
  if (!record) return null;

  const photos = (record.work_record_photos ?? []).sort(
    (a, b) => a.display_order - b.display_order
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" className="text-[10px]">
              {SERVICE_CATEGORY_LABELS[record.category]}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {CAR_TYPE_LABELS[record.car_type]}
            </Badge>
          </div>
          <DialogTitle className="text-base font-bold leading-snug">
            {record.title}
          </DialogTitle>
        </DialogHeader>

        {/* 写真ギャラリー */}
        {photos.length > 0 ? (
          <PhotoGallery photos={photos} />
        ) : (
          <div className="flex items-center justify-center h-32 bg-muted/50 rounded-lg">
            <div className="flex flex-col items-center gap-1 text-muted-foreground/40">
              <ImageIcon className="h-8 w-8" />
              <span className="text-xs">写真なし</span>
            </div>
          </div>
        )}

        {/* 詳細情報 */}
        <div className="space-y-3">
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Banknote className="h-4 w-4" />
              {formatYen(record.labor_cost)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {record.duration_minutes}分
            </span>
          </div>

          {/* 説明文：全文表示（line-clamp なし） */}
          {record.description && (
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {record.description}
              </p>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            投稿日：{new Date(record.created_at).toLocaleDateString("ja-JP")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** 写真ギャラリー（スワイプ対応） */
function PhotoGallery({
  photos,
}: {
  photos: NonNullable<WorkRecord["work_record_photos"]>;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  function goNext() {
    setCurrentIndex((i) => (i < photos.length - 1 ? i + 1 : 0));
  }
  function goPrev() {
    setCurrentIndex((i) => (i > 0 ? i - 1 : photos.length - 1));
  }

  return (
    <div className="relative">
      <div className="relative rounded-lg overflow-hidden bg-muted aspect-[4/3]">
        <ModalPhoto storagePath={photos[currentIndex].storage_path} />

        {/* ナビゲーション */}
        {photos.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* ドットインジケーター */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    i === currentIndex ? "bg-white" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* サムネイル一覧 */}
      {photos.length > 1 && (
        <div className="flex gap-1.5 mt-2 overflow-x-auto">
          {photos.map((photo, i) => (
            <button
              key={photo.id}
              onClick={() => setCurrentIndex(i)}
              className={`shrink-0 rounded-md overflow-hidden border-2 transition-colors ${
                i === currentIndex
                  ? "border-primary"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <ModalPhotoThumb storagePath={photo.storage_path} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** モーダル用写真（大） */
function ModalPhoto({ storagePath }: { storagePath: string }) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function resolve() {
      const publicUrl = getStoragePublicUrl("work-photos", storagePath);
      if (publicUrl) {
        if (!cancelled) setImgUrl(publicUrl);
        return;
      }
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data } = await supabase.storage
          .from("work-photos")
          .createSignedUrl(storagePath, 3600);
        if (!cancelled && data?.signedUrl) setImgUrl(data.signedUrl);
      } catch {
        if (!cancelled) setError(true);
      }
    }
    resolve();
    return () => { cancelled = true; };
  }, [storagePath]);

  async function handleError() {
    if (error) return;
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase.storage
        .from("work-photos")
        .createSignedUrl(storagePath, 3600);
      if (data?.signedUrl) { setImgUrl(data.signedUrl); return; }
    } catch { /* */ }
    setError(true);
  }

  if (error || !imgUrl) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
      </div>
    );
  }

  return (
    <img
      src={imgUrl}
      alt=""
      loading="lazy"
      decoding="async"
      className="h-full w-full object-contain"
      onError={handleError}
    />
  );
}

/** モーダル用サムネイル（小） */
function ModalPhotoThumb({ storagePath }: { storagePath: string }) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);

  useEffect(() => {
    const publicUrl = getStoragePublicUrl("work-photos", storagePath);
    if (publicUrl) setImgUrl(publicUrl);
  }, [storagePath]);

  if (!imgUrl) {
    return <div className="h-12 w-12 bg-muted" />;
  }

  return <img src={imgUrl} alt="" className="h-12 w-12 object-cover" />;
}
