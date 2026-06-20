import type { MetadataRoute } from "next";
import { isSupabaseConfigured } from "@/lib/supabase/helpers";

const BASE_URL = "https://xn--fdke1ab.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 静的ページ
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/works`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  // 動的ページ: 全店舗の詳細ページ
  let shopPages: MetadataRoute.Sitemap = [];

  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: shops } = await supabase
        .from("shops")
        .select("id, updated_at")
        .eq("is_active", true);

      if (shops) {
        shopPages = shops.map((shop) => ({
          url: `${BASE_URL}/shops/${shop.id}`,
          lastModified: new Date(shop.updated_at),
          changeFrequency: "weekly" as const,
          priority: 0.7,
        }));
      }
    } catch (e) {
      console.error("[sitemap] Failed to fetch shops:", e);
    }
  }

  return [...staticPages, ...shopPages];
}
