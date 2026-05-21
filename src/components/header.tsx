"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wrench, Menu, X, MapPin, LayoutDashboard, LogIn } from "lucide-react";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Wrench className="h-5 w-5 text-primary" />
          ピットリンク
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Button variant="ghost" size="sm" render={<Link href="/" />}>
            <MapPin className="mr-1 h-4 w-4" />
            工場をさがす
          </Button>
          <Button variant="ghost" size="sm" render={<Link href="/dashboard" />}>
            <LayoutDashboard className="mr-1 h-4 w-4" />
            店舗管理
          </Button>
          <Button size="sm" render={<Link href="/login" />}>
            <LogIn className="mr-1 h-4 w-4" />
            ログイン
          </Button>
        </nav>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {open && (
        <nav className="border-t md:hidden px-4 py-3 flex flex-col gap-2">
          <Link
            href="/"
            className="flex items-center gap-2 py-2 text-sm"
            onClick={() => setOpen(false)}
          >
            <MapPin className="h-4 w-4" /> 工場をさがす
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 py-2 text-sm"
            onClick={() => setOpen(false)}
          >
            <LayoutDashboard className="h-4 w-4" /> 店舗管理
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 py-2 text-sm"
            onClick={() => setOpen(false)}
          >
            <LogIn className="h-4 w-4" /> ログイン
          </Link>
        </nav>
      )}
    </header>
  );
}
