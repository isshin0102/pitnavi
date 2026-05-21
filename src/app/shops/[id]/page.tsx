"use client";

import { use } from "react";
import Link from "next/link";
import { MapPin, Phone, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServiceMenuTable } from "@/components/service-menu-table";
import { WorkRecordCard } from "@/components/work-record-card";
import {
  MOCK_SHOPS,
  MOCK_SERVICE_MENUS,
  MOCK_WORK_RECORDS,
} from "@/lib/mock-data";

export default function ShopDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const shop = MOCK_SHOPS.find((s) => s.id === id);

  if (!shop) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p>工場が見つかりません</p>
      </div>
    );
  }

  const menus = MOCK_SERVICE_MENUS.filter((m) => m.shop_id === id);
  const records = MOCK_WORK_RECORDS.filter((r) => r.shop_id === id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> 一覧にもどる
      </Link>

      <div className="mb-6">
        <h1 className="text-xl font-bold">{shop.name}</h1>
        {shop.description && (
          <p className="mt-2 text-sm text-muted-foreground">
            {shop.description}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {shop.address}
          </span>
          {shop.phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {shop.phone}
            </span>
          )}
        </div>
      </div>

      <Separator className="mb-6" />

      <Tabs defaultValue="menus">
        <TabsList className="mb-4">
          <TabsTrigger value="menus">料金メニュー</TabsTrigger>
          <TabsTrigger value="records">
            作業実績 ({records.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="menus">
          {menus.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              メニューが登録されていません
            </p>
          ) : (
            <>
              <ServiceMenuTable menus={menus} />
              <div className="mt-6">
                <Button className="w-full" render={<Link href={`/reserve/${shop.id}`} />}>
                  この工場に予約する
                </Button>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="records">
          {records.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              作業実績がまだありません
            </p>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <WorkRecordCard key={record.id} record={record} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
