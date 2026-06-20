import type { MetadataRoute } from "next";

const BASE_URL = "https://xn--fdke1ab.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/works", "/shops/"],
        disallow: [
          "/dashboard/",  // 店舗管理画面
          "/mypage/",     // ユーザーマイページ
          "/reserve/",    // 予約フロー
          "/api/",        // APIエンドポイント
          "/auth/",       // 認証コールバック
          "/login",       // ログインページ
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
