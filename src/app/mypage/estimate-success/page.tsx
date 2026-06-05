"use client";

import Link from "next/link";
import { CheckCircle2, ClipboardList, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function EstimateSuccessPage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <CardTitle className="text-lg">決済が完了しました</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            見積もりを承諾し、決済が正常に完了しました。
            <br />
            工場での作業が開始されます。
          </p>
          <div className="flex flex-col gap-2">
            <Button render={<Link href="/mypage" />} className="w-full">
              <ClipboardList className="mr-2 h-4 w-4" />
              マイページで確認
            </Button>
            <Button
              variant="outline"
              render={<Link href="/" />}
              className="w-full"
            >
              <Home className="mr-2 h-4 w-4" />
              トップへ戻る
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
