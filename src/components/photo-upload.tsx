"use client";

import { useState, useRef } from "react";
import { Camera, X, Upload, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/supabase/helpers";

interface PhotoUploadProps {
  onPhotosChange: (photos: UploadedPhoto[]) => void;
  maxPhotos?: number;
}

export interface UploadedPhoto {
  id: string;
  previewUrl: string;
  storagePath?: string;
  file?: File;
}

export function PhotoUpload({ onPhotosChange, maxPhotos = 5 }: PhotoUploadProps) {
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files) return;

    const newPhotos: UploadedPhoto[] = [];

    for (let i = 0; i < files.length; i++) {
      if (photos.length + newPhotos.length >= maxPhotos) break;
      const file = files[i];
      const previewUrl = URL.createObjectURL(file);
      const id = `photo-${Date.now()}-${i}`;

      if (isSupabaseConfigured()) {
        setUploading(true);
        try {
          const { createClient } = await import("@/lib/supabase/client");
          const supabase = createClient();
          const path = `records/${id}-${file.name}`;
          const { error } = await supabase.storage
            .from("work-photos")
            .upload(path, file);

          if (!error) {
            newPhotos.push({ id, previewUrl, storagePath: path });
          }
        } catch {
          newPhotos.push({ id, previewUrl, file });
        }
        setUploading(false);
      } else {
        newPhotos.push({ id, previewUrl, file });
      }
    }

    const updated = [...photos, ...newPhotos];
    setPhotos(updated);
    onPhotosChange(updated);
  }

  function removePhoto(id: string) {
    const updated = photos.filter((p) => p.id !== id);
    setPhotos(updated);
    onPhotosChange(updated);
  }

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {photos.map((photo) => (
          <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
            <img
              src={photo.previewUrl}
              alt=""
              className="h-full w-full object-cover"
            />
            <button
              onClick={() => removePhoto(photo.id)}
              className="absolute top-1 right-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {photos.length < maxPhotos && (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 text-muted-foreground hover:bg-accent/50 transition-colors"
          >
            {uploading ? (
              <Upload className="h-5 w-5 animate-pulse" />
            ) : (
              <Camera className="h-5 w-5" />
            )}
            <span className="text-[10px]">
              {uploading ? "送信中..." : "追加"}
            </span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {photos.length === 0 && (
        <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
          <ImageIcon className="h-3 w-3" />
          最大{maxPhotos}枚まで（スマホのカメラから直接撮影もOK）
        </p>
      )}
    </div>
  );
}
