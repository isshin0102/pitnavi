import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // 現在のログインユーザーを取得
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({
        loggedIn: false,
        error: authErr?.message ?? "Not logged in",
      });
    }

    // shops テーブルの全データ（owner_id 含む）
    // service_role ではなく anon/authenticated キーなので RLS が適用される
    const { data: myShops, error: myShopsErr } = await supabase
      .from("shops")
      .select("id, name, owner_id")
      .eq("owner_id", user.id);

    // RLS を無視して全店舗を確認（anon キーでは無理なので、全公開店舗を取得）
    const { data: allShops, error: allShopsErr } = await supabase
      .from("shops")
      .select("id, name, owner_id, is_active");

    return NextResponse.json({
      loggedIn: true,
      currentUser: {
        id: user.id,
        email: user.email,
      },
      myShops: myShops ?? [],
      myShopsError: myShopsErr?.message ?? null,
      allShops: allShops ?? [],
      allShopsError: allShopsErr?.message ?? null,
      hint:
        myShops && myShops.length === 0
          ? "owner_id が現在のユーザーIDと一致する店舗がありません。allShops の owner_id を確認し、SQLで更新してください。"
          : null,
    });
  } catch (e) {
    return NextResponse.json({
      error: e instanceof Error ? e.message : "Unknown error",
    });
  }
}
