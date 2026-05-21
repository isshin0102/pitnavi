"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ServiceCategory, CarType } from "@/lib/types";
import { SERVICE_CATEGORY_LABELS, CAR_TYPE_LABELS } from "@/lib/types";

export default function NewRecordPage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [category, setCategory] = useState<ServiceCategory>("tire_change");
  const [carType, setCarType] = useState<CarType>("standard");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [laborCost, setLaborCost] = useState("");
  const [duration, setDuration] = useState("");

  function handleSubmit() {
    if (!title || !laborCost || !duration) return;
    setSubmitted(true);
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
              <option key={k} value={k}>
                {v}
              </option>
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
                  carType === ct
                    ? "border-primary bg-primary/5 font-medium"
                    : "hover:bg-accent"
                }`}
              >
                {CAR_TYPE_LABELS[ct]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm mb-1 block">タイトル</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="スタッドレスからサマータイヤへ交換"
          />
        </div>

        <div>
          <Label className="text-sm mb-1 block">作業内容（任意）</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="N-BOXのタイヤ交換。155/65R14..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm mb-1 block">工賃（円）</Label>
            <Input
              type="number"
              value={laborCost}
              onChange={(e) => setLaborCost(e.target.value)}
              placeholder="4800"
            />
          </div>
          <div>
            <Label className="text-sm mb-1 block">作業時間（分）</Label>
            <Input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="40"
            />
          </div>
        </div>

        <div>
          <Label className="text-sm mb-2 block">施工写真（任意）</Label>
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
            <Camera className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-xs text-muted-foreground">
              写真をアップロード
            </span>
            <input type="file" accept="image/*" multiple className="hidden" />
          </label>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!title || !laborCost || !duration}
          className="w-full"
        >
          投稿する
        </Button>
      </div>
    </div>
  );
}
