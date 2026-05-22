import { isSupabaseConfigured } from "@/lib/supabase/helpers";
import type { Work } from "@/lib/types";

/** 画像をSupabase Storageにアップロードし、公開URLを返す */
export async function uploadWorkImage(file: File, prefix: string): Promise<string> {
  if (!isSupabaseConfigured()) {
    return URL.createObjectURL(file);
  }

  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `works/${prefix}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("pitnavi-images")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) throw new Error(`画像アップロードに失敗: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from("pitnavi-images")
    .getPublicUrl(path);

  return urlData.publicUrl;
}

/** 実績を新規作成 */
export async function createWork(params: {
  shop_id: string;
  title: string;
  description?: string;
  car_name?: string;
  work_date?: string;
  before_image_url?: string;
  after_image_url?: string;
  extra_image_url?: string;
  category?: string;
}): Promise<Work> {
  if (!isSupabaseConfigured()) {
    return {
      id: `mock-work-${Date.now()}`,
      ...params,
      description: params.description ?? null,
      car_name: params.car_name ?? null,
      work_date: params.work_date ?? null,
      before_image_url: params.before_image_url ?? null,
      after_image_url: params.after_image_url ?? null,
      extra_image_url: params.extra_image_url ?? null,
      category: params.category ?? "other",
      is_published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();

  const { data, error } = await supabase
    .from("works")
    .insert({
      shop_id: params.shop_id,
      title: params.title,
      description: params.description || null,
      car_name: params.car_name || null,
      work_date: params.work_date || null,
      before_image_url: params.before_image_url || null,
      after_image_url: params.after_image_url || null,
      extra_image_url: params.extra_image_url || null,
      category: params.category || "other",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Work;
}

/** 店舗の実績一覧を取得 */
export async function getWorksByShop(shopId: string): Promise<Work[]> {
  if (!isSupabaseConfigured()) return [];

  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();

  const { data, error } = await supabase
    .from("works")
    .select("*")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getWorksByShop]", error);
    return [];
  }
  return (data as Work[]) ?? [];
}

/** 全店舗の公開実績一覧を取得（ギャラリー用） */
export async function getAllPublicWorks(): Promise<Work[]> {
  if (!isSupabaseConfigured()) return [];

  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();

  // まず shops JOIN 付きで取得
  const { data, error } = await supabase
    .from("works")
    .select("*, shops(name, address)")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(50);

  if (!error && data) {
    return (data as Work[]) ?? [];
  }

  // JOIN でエラーの場合は shops なしで再試行
  console.error("[getAllPublicWorks] join query failed, retrying without join:", error);
  const { data: data2, error: error2 } = await supabase
    .from("works")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error2) {
    console.error("[getAllPublicWorks] fallback also failed:", error2);
    return [];
  }
  return (data2 as Work[]) ?? [];
}
