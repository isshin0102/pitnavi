"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, AlertCircle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/data/auth";
import { isSupabaseConfigured } from "@/lib/supabase/helpers";

export default function LineLinkPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          読み込み中...
        </div>
      }
    >
      <LineLinkContent />
    </Suspense>
  );
}

function LineLinkContent() {
  const searchParams = useSearchParams();
  const shopId = searchParams.get("shop");
  const lineUid = searchParams.get("line_uid");

  const [status, setStatus] = useState<
    "loading" | "login_required" | "ready" | "linking" | "done" | "error"
  >("loading");
  const [shopName, setShopName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    (async () => {
      if (!shopId || !lineUid) {
        setStatus("error");
        setErrorMsg("無効なリンクです");
        return;
      }

      if (!isSupabaseConfigured()) {
        setStatus("error");
        setErrorMsg("設定エラー");
        return;
      }

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: shop } = await supabase
        .from("shops")
        .select("name")
        .eq("id", shopId)
        .single();

      setShopName(shop?.name ?? "店舗");

      const user = await getCurrentUser();
      if (!user) {
        setStatus("login_required");
        return;
      }

      setStatus("ready");
    })();
  }, [shopId, lineUid]);

  async function handleLink() {
    if (!shopId || !lineUid) return;
    setStatus("linking");

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const user = await getCurrentUser();

      if (!user) {
        setStatus("login_required");
        return;
      }

      const { error } = await supabase
        .from("line_followers")
        .update({ pitnavi_user_id: user.id })
        .eq("shop_id", shopId)
        .eq("line_user_id", lineUid);

      if (error) {
        throw new Error(error.message);
      }

      setStatus("done");
    } catch (e) {
      setStatus("error");
      setErrorMsg(
        e instanceof Error ? e.message : "連携に失敗しました"
      );
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 text-center">
      <MessageCircle className="mx-auto h-10 w-10 text-green-500 mb-4" />
      <h1 className="text-xl font-bold mb-2">LINE連携</h1>

      {status === "loading" && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-8">
          <Loader2 className="h-4 w-4 animate-spin" />
          読み込み中...
        </div>
      )}

      {status === "login_required" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {shopName}のLINEアカウントとピトナビを連携するには、ログインが必要です。
          </p>
          <Button
            onClick={() => {
              window.location.href = `/login?redirect=${encodeURIComponent(window.location.href)}`;
            }}
            className="w-full"
          >
            ログインして連携する
          </Button>
        </div>
      )}

      {status === "ready" && (
        <div className="space-y-4">
          <p className="text-sm">
            <span className="font-semibold">{shopName}</span>
            のLINEアカウントとピトナビを連携しますか？
          </p>
          <p className="text-xs text-muted-foreground">
            連携すると、予約確定時にLINEで通知を受け取れます。
          </p>
          <Button onClick={handleLink} className="w-full">
            連携する
          </Button>
        </div>
      )}

      {status === "linking" && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-8">
          <Loader2 className="h-4 w-4 animate-spin" />
          連携中...
        </div>
      )}

      {status === "done" && (
        <div className="space-y-4">
          <CheckCircle className="mx-auto h-10 w-10 text-green-500" />
          <p className="text-sm font-medium">連携が完了しました！</p>
          <p className="text-xs text-muted-foreground">
            今後、{shopName}での予約確定時にLINEで通知が届きます。
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-2">
          <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
          <p className="text-sm text-destructive">{errorMsg}</p>
        </div>
      )}
    </div>
  );
}
