"use client";

import { use } from "react";
import Link from "next/link";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentSuccessPage({
  params,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const { shopId } = use(params);

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-6" />
      <h1 className="text-2xl font-bold mb-3">決済が完了しました！</h1>
      <p className="text-sm text-muted-foreground mb-2">
        予約とお支払いが正常に処理されました。
      </p>
      <p className="text-sm text-muted-foreground mb-8">
        工場からの確認をお待ちください。
        <br />
        ステータスはマイページからリアルタイムで確認できます。
      </p>

      <div className="flex flex-col gap-3">
        <Button render={<Link href="/mypage" />} size="lg">
          マイページで予約を確認
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
        <Button variant="outline" render={<Link href="/" />}>
          トップに戻る
        </Button>
      </div>
    </div>
  );
}
