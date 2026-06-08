"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Wrench, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { signIn, signUp } from "@/lib/data/auth";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn(loginEmail, loginPassword);

    if (result.success) {
      // フルページリロードでCookie/セッションを確実に反映させる
      window.location.href = redirectTo;
    } else {
      setLoading(false);
      setError(result.error ?? "ログインに失敗しました");
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    const result = await signUp(signupEmail, signupPassword);

    if (result.success) {
      // メール確認が無効の場合は即座にダッシュボードへ遷移
      // メール確認が有効の場合はメッセージを表示
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // セッションあり＝メール確認不要設定。即ログイン
        window.location.href = "/dashboard";
      } else {
        setLoading(false);
        setSuccess(
          "確認メールを送信しました。メール内のリンクをクリックしてログインしてください。"
        );
      }
    } else {
      setLoading(false);
      setError(result.error ?? "登録に失敗しました");
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Wrench className="h-5 w-5 text-primary" />
          </div>
          <CardTitle>ピトナビ</CardTitle>
          <CardDescription>
            アカウントにログインまたは新規登録
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="h-3 w-3 shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-xs text-green-700">
              <CheckCircle className="h-3 w-3 shrink-0" />
              {success}
            </div>
          )}

          <Tabs
            defaultValue="login"
            onValueChange={() => {
              setError("");
              setSuccess("");
            }}
          >
            <TabsList className="w-full mb-4">
              <TabsTrigger value="login" className="flex-1">
                ログイン
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex-1">
                新規登録
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form className="space-y-4" onSubmit={handleLogin}>
                <div>
                  <Label htmlFor="login-email" className="text-sm mb-1 block">
                    メールアドレス
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="login-password" className="text-sm mb-1 block">
                    パスワード
                  </Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "ログイン中..." : "ログイン"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form className="space-y-4" onSubmit={handleSignup}>
                <div>
                  <Label htmlFor="signup-email" className="text-sm mb-1 block">
                    メールアドレス
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signup-password" className="text-sm mb-1 block">
                    パスワード（6文字以上）
                  </Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "登録中..." : "新規登録"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
