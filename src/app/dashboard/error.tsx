"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DashboardError]", error);
  }, [error]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center px-4 text-center">
      <AlertTriangle className="h-10 w-10 text-destructive mb-4" />
      <h2 className="text-lg font-bold mb-2">読み込みに失敗しました</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        ダッシュボードの読み込み中にエラーが発生しました。
        ネットワーク接続を確認し、再度お試しください。
      </p>
      <Button onClick={reset}>もう一度試す</Button>
    </div>
  );
}
