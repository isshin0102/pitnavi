"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Wrench,
  Menu,
  X,
  MapPin,
  LayoutDashboard,
  LogIn,
  LogOut,
  User,
  ClipboardList,
  Sparkles,
} from "lucide-react";
import { getCurrentUser, signOut } from "@/lib/data/auth";

export function Header() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser().then((user) => {
      setUserEmail(user?.email ?? null);
    });
  }, []);

  async function handleSignOut() {
    await signOut();
    setUserEmail(null);
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Wrench className="h-5 w-5 text-primary" />
          ピトナビ
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Button variant="ghost" size="sm" render={<Link href="/" />}>
            <MapPin className="mr-1 h-4 w-4" />
            工場をさがす
          </Button>
          <Button variant="ghost" size="sm" render={<Link href="/works" />}>
            <Sparkles className="mr-1 h-4 w-4" />
            施工ギャラリー
          </Button>
          <Button variant="ghost" size="sm" render={<Link href="/dashboard" />}>
            <LayoutDashboard className="mr-1 h-4 w-4" />
            店舗管理
          </Button>
          {userEmail ? (
            <div className="flex items-center gap-2 ml-2">
              <Button variant="ghost" size="sm" render={<Link href="/mypage" />}>
                <ClipboardList className="mr-1 h-4 w-4" />
                マイページ
              </Button>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                {userEmail}
              </span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="mr-1 h-4 w-4" />
                ログアウト
              </Button>
            </div>
          ) : (
            <Button size="sm" render={<Link href="/login" />}>
              <LogIn className="mr-1 h-4 w-4" />
              ログイン
            </Button>
          )}
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
            href="/works"
            className="flex items-center gap-2 py-2 text-sm"
            onClick={() => setOpen(false)}
          >
            <Sparkles className="h-4 w-4" /> 施工ギャラリー
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 py-2 text-sm"
            onClick={() => setOpen(false)}
          >
            <LayoutDashboard className="h-4 w-4" /> 店舗管理
          </Link>
          {userEmail ? (
            <>
              <Link
                href="/mypage"
                className="flex items-center gap-2 py-2 text-sm"
                onClick={() => setOpen(false)}
              >
                <ClipboardList className="h-4 w-4" /> マイページ
              </Link>
              <span className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                <User className="h-4 w-4" /> {userEmail}
              </span>
              <button
                onClick={() => {
                  handleSignOut();
                  setOpen(false);
                }}
                className="flex items-center gap-2 py-2 text-sm text-destructive"
              >
                <LogOut className="h-4 w-4" /> ログアウト
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 py-2 text-sm"
              onClick={() => setOpen(false)}
            >
              <LogIn className="h-4 w-4" /> ログイン
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
