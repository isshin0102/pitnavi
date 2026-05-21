import Link from "next/link";
import { MapPin, Clock, Star } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Shop, ServiceMenu } from "@/lib/types";
import { SERVICE_CATEGORY_LABELS } from "@/lib/types";
import { formatYen } from "@/lib/fee-calculator";

interface ShopCardProps {
  shop: Shop;
  menus: ServiceMenu[];
}

export function ShopCard({ shop, menus }: ShopCardProps) {
  const categories = [...new Set(menus.map((m) => m.category))];
  const cheapest = menus.length
    ? Math.min(...menus.map((m) => Math.min(m.price_light, m.price_standard)))
    : null;

  return (
    <Link href={`/shops/${shop.id}`}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-tight">{shop.name}</CardTitle>
            {cheapest !== null && (
              <span className="shrink-0 text-sm font-semibold text-primary">
                {formatYen(cheapest)}〜
              </span>
            )}
          </div>
          <CardDescription className="line-clamp-2 text-xs">
            {shop.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{shop.address}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {categories.map((cat) => (
              <Badge key={cat} variant="secondary" className="text-[10px] px-1.5 py-0">
                {SERVICE_CATEGORY_LABELS[cat]}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
