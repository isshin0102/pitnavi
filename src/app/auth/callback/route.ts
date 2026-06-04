import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Supabase Auth メール確認コールバック
 * ユーザーが確認メールのリンクをクリックすると、ここにリダイレクトされる
 * code を使ってセッションを確立し、アプリにログイン済み状態で遷移する
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error("[auth/callback] exchangeCodeForSession error:", error.message);
  }

  // エラー時はログインページへ
  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
}
