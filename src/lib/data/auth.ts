import { isSupabaseConfigured } from "@/lib/supabase/helpers";

export interface AuthResult {
  success: boolean;
  error?: string;
}

export async function signUp(email: string, password: string): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return { success: true };
  }

  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();

  // emailRedirectTo: メール確認リンクのリダイレクト先
  const redirectUrl = typeof window !== "undefined"
    ? `${window.location.origin}/auth/callback`
    : undefined;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
    },
  });

  if (error) {
    // よくあるエラーを日本語化
    if (error.message.includes("rate limit")) {
      return {
        success: false,
        error: "メール送信の制限に達しました。しばらく待ってから再度お試しください（約1時間後）。",
      };
    }
    if (error.message.includes("already registered")) {
      return {
        success: false,
        error: "このメールアドレスは既に登録されています。ログインタブからログインしてください。",
      };
    }
    return { success: false, error: error.message };
  }

  // Supabase の「メール確認なし」設定の場合、即座にセッションが返る
  if (data.session) {
    return { success: true };
  }

  return { success: true };
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return { success: true };
  }

  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // よくあるエラーを日本語化
    if (error.message.includes("Invalid login credentials")) {
      return {
        success: false,
        error: "メールアドレスまたはパスワードが正しくありません。",
      };
    }
    if (error.message.includes("Email not confirmed")) {
      return {
        success: false,
        error: "メールアドレスが未確認です。確認メールのリンクをクリックしてください。",
      };
    }
    return { success: false, error: error.message };
  }

  if (!data.session) {
    return {
      success: false,
      error: "セッションの確立に失敗しました。もう一度お試しください。",
    };
  }

  return { success: true };
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  await supabase.auth.signOut();
}

export async function getCurrentUser() {
  if (!isSupabaseConfigured()) return null;

  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}
