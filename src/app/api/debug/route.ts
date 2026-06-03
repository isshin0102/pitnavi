import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const result: Record<string, unknown> = {
    envCheck: {
      hasUrl: !!url,
      urlPrefix: url ? url.substring(0, 30) + "..." : "NOT SET",
      hasKey: !!key,
      keyPrefix: key ? key.substring(0, 20) + "..." : "NOT SET",
    },
    shops: null,
    error: null,
  };

  if (url && key) {
    try {
      const { createBrowserClient } = await import("@supabase/ssr");
      const supabase = createBrowserClient(url, key);

      // まず全件（RLSフィルタ後）
      const { data: allData, error: allErr } = await supabase
        .from("shops")
        .select("id, name, is_active, latitude, longitude");

      // is_active=true のみ
      const { data: activeData, error: activeErr } = await supabase
        .from("shops")
        .select("id, name, is_active, latitude, longitude")
        .eq("is_active", true);

      result.shops = {
        allQuery: { count: allData?.length ?? 0, error: allErr?.message ?? null, data: allData },
        activeQuery: { count: activeData?.length ?? 0, error: activeErr?.message ?? null, data: activeData },
      };
    } catch (e) {
      result.error = e instanceof Error ? e.message : String(e);
    }
  }

  return NextResponse.json(result);
}
