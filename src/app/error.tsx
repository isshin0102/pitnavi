"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
      <h2 className="text-lg font-bold mb-2">エラーが発生しました</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        申し訳ございません。予期しないエラーが発生しました。
        再度お試しいただくか、しばらく経ってからアクセスしてください。
      </p>
      <div className="flex gap-3">
        <Button onClick={reset} variant="outline">
          もう一度試す
        </Button>
        <Button onClick={() => (window.location.href = "/")}>
          トップページへ
        </Button>
      </div>
    </div>
  );
}
