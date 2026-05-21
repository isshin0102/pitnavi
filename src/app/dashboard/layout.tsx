"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
  CalendarCheck,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "概要", icon: LayoutDashboard },
  { href: "/dashboard/menus", label: "メニュー管理", icon: UtensilsCrossed },
  { href: "/dashboard/records", label: "作業実績", icon: ClipboardList },
  {
    href: "/dashboard/reservations",
    label: "予約管理",
    icon: CalendarCheck,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-xl font-bold mb-4">店舗管理ダッシュボード</h1>
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
    </div>
  );
}
