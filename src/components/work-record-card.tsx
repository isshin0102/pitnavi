"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WorkRecord } from "@/lib/types";
import { SERVICE_CATEGORY_LABELS, CAR_TYPE_LABELS } from "@/lib/types";
import { formatYen } from "@/lib/fee-calculator";
import { getStoragePublicUrl } from "@/lib/supabase/helpers";
import { Clock, Banknote, ImageIcon } from "lucide-react";

interface WorkRecordCardProps {
  record: WorkRecord;
}

export function WorkRecordCard({ record }: WorkRecordCardProps) {
  const photos = (record.work_record_photos ?? []).sort(
    (a, b) => a.display_order - b.display_order
  );

  return (
    <Card className="overflow-hidden">
      {/* 写真セクション */}
      {photos.length > 0 ? (
        <div className="flex gap-0.5 overflow-x-auto bg-muted">
          {photos.map((photo) => (
            <PhotoThumbnail
              key={photo.id}
              storagePath={photo.storage_path}
              isSingle={photos.length === 1}
            />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-24 bg-muted/50">
          <div className="flex flex-col items-center gap-1 text-muted-foreground/40">
            <ImageIcon className="h-6 w-6" />
            <span className="text-[10px]">写真なし</span>
          </div>
        </div>
      )}

      <CardHeader className="pb-2 pt-3">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="secondary" className="text-[10px]">
            {SERVICE_CATEGORY_LABELS[record.category]}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {CAR_TYPE_LABELS[record.car_type]}
          </Badge>
          {photos.length > 0 && (
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              {photos.length}枚
            </Badge>
          )}
        </div>
        <CardTitle className="text-sm">{record.title}</CardTitle>
        {record.description && (
          <CardDescription className="text-xs line-clamp-3">
            {record.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Banknote className="h-3 w-3" />
            {formatYen(record.labor_cost)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {record.duration_minutes}分
          </span>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">
          {new Date(record.created_at).toLocaleDateString("ja-JP")}
        </p>
      </CardContent>
    </Card>
  );
}

/** 写真サムネイル（公開URL → signed URL フォールバック付き） */
function PhotoThumbnail({
  storagePath,
  isSingle,
}: {
  storagePath: string;
  isSingle: boolean;
}) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function resolveUrl() {
      // 1. まず公開URLを試す（バケットが public なら即表示可能）
      const publicUrl = getStoragePublicUrl("work-photos", storagePath);
      if (publicUrl) {
        setImgUrl(publicUrl);
        return;
      }

      // 2. 環境変数が未設定の場合は signed URL を試す
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data } = await supabase.storage
          .from("work-photos")
          .createSignedUrl(storagePath, 3600); // 1時間有効
        if (!cancelled && data?.signedUrl) {
          setImgUrl(data.signedUrl);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    }

    resolveUrl();
    return () => { cancelled = true; };
  }, [storagePath]);

  /** 公開URLが403/404の場合に signed URL にフォールバック */
  async function handleImageError() {
    if (error) return; // 2回目のエラーは無視

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase.storage
        .from("work-photos")
        .createSignedUrl(storagePath, 3600);
      if (data?.signedUrl) {
        setImgUrl(data.signedUrl);
        return;
      }
    } catch {
      // signed URL も失敗
    }
    setError(true);
  }

  const sizeClass = isSingle ? "w-full h-40" : "w-32 h-24";

  if (error || !imgUrl) {
    return (
      <div className={`flex items-center justify-center bg-muted shrink-0 ${sizeClass}`}>
        <ImageIcon className="h-6 w-6 text-muted-foreground/30" />
      </div>
    );
  }

  return (
    <img
      src={imgUrl}
      alt=""
      className={`object-cover shrink-0 ${sizeClass}`}
      onError={handleImageError}
    />
  );
}
