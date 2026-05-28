"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
  CalendarCheck,
  Camera,
  Store,
  Settings,
} from "lucide-react";
import { getCurrentUser } from "@/lib/data/auth";
import { isSupabaseConfigured } from "@/lib/supabase/helpers";

const NAV_ITEMS = [
  { href: "/dashboard", label: "概要", icon: LayoutDashboard },
  { href: "/dashboard/menus", label: "メニュー管理", icon: UtensilsCrossed },
  { href: "/dashboard/records", label: "作業実績", icon: ClipboardList },
  { href: "/dashboard/reservations", label: "予約管理", icon: CalendarCheck },
  { href: "/dashboard/works", label: "実績ギャラリー", icon: Camera },
  { href: "/dashboard/profile", label: "ショップ情報", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [shopId, setShopId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!isSupabaseConfigured()) {
        setShopId("mock-shop");
        setUserId("mock-user");
        setLoading(false);
        return;
      }

      const user = await getCurrentUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase
        .from("shops")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      setShopId(data?.id ?? null);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-xl font-bold mb-4">店舗管理ダッシュボード</h1>

      {loading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          読み込み中...
        </p>
      ) : (
        <div className="flex gap-6 flex-col md:flex-row">
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:w-48 shrink-0">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive =
                href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      )}
    </div>
  );
}
