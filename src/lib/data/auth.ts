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
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return { success: true };
  }

  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { success: false, error: error.message };
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
