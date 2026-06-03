import Link from "next/link";
import { MapPin, Navigation } from "lucide-react";
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
import { formatDistance } from "@/lib/geo-utils";

interface ShopCardProps {
  shop: Shop;
  menus: ServiceMenu[];
  /** 距離(km)が設定されている場合に表示 */
  distance?: number;
  /** マウスオーバー時のハイライト */
  highlighted?: boolean;
  onHover?: (shopId: string | null) => void;
}

export function ShopCard({
  shop,
  menus,
  distance,
  highlighted,
  onHover,
}: ShopCardProps) {
  const categories = [...new Set(menus.map((m) => m.category))];
  const cheapest = menus.length
    ? Math.min(...menus.map((m) => Math.min(m.price_light, m.price_standard)))
    : null;

  return (
    <Link href={`/shops/${shop.id}`}>
      <Card
        className={`h-full transition-all ${
          highlighted
            ? "shadow-md ring-2 ring-primary/50 scale-[1.02]"
            : "hover:shadow-md"
        }`}
        onMouseEnter={() => onHover?.(shop.id)}
        onMouseLeave={() => onHover?.(null)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-tight">
              {shop.name}
            </CardTitle>
            <div className="flex flex-col items-end gap-0.5 shrink-0">
              {cheapest !== null && (
                <span className="text-sm font-semibold text-primary">
                  {formatYen(cheapest)}〜
                </span>
              )}
              {distance !== undefined && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <Navigation className="h-2.5 w-2.5" />
                  {formatDistance(distance)}
                </span>
              )}
            </div>
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

          {/* サービスカテゴリ */}
          <div className="flex flex-wrap gap-1 mb-1.5">
            {categories.map((cat) => (
              <Badge
                key={cat}
                variant="secondary"
                className="text-[10px] px-1.5 py-0"
              >
                {SERVICE_CATEGORY_LABELS[cat]}
              </Badge>
            ))}
          </div>

          {/* 得意ジャンル (specialty) */}
          {shop.specialty && shop.specialty.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {shop.specialty.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium"
                >
                  {tag}
                </span>
              ))}
              {shop.specialty.length > 4 && (
                <span className="text-[10px] text-muted-foreground">
                  +{shop.specialty.length - 4}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
