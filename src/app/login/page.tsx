"use client";

import { useState } from "react";
import Link from "next/link";
import { Wrench } from "lucide-react";
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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Wrench className="h-5 w-5 text-primary" />
          </div>
          <CardTitle>ピットリンク</CardTitle>
          <CardDescription>
            アカウントにログインまたは新規登録
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="login" className="flex-1">
                ログイン
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex-1">
                新規登録
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                }}
              >
                <div>
                  <Label htmlFor="login-email" className="text-sm mb-1 block">
                    メールアドレス
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="login-password"
                    className="text-sm mb-1 block"
                  >
                    パスワード
                  </Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full">
                  ログイン
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                }}
              >
                <div>
                  <Label htmlFor="signup-email" className="text-sm mb-1 block">
                    メールアドレス
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="signup-password"
                    className="text-sm mb-1 block"
                  >
                    パスワード
                  </Label>
                  <Input id="signup-password" type="password" />
                </div>
                <Button type="submit" className="w-full">
                  新規登録
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
