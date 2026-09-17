import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import {
  sendLineReplyMessage,
  buildFollowWelcomeMessages,
} from "@/lib/line/send";

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

function verifySignature(
  body: string,
  signature: string,
  channelSecret: string
): boolean {
  const hash = crypto
    .createHmac("SHA256", channelSecret)
    .update(body)
    .digest("base64");
  return hash === signature;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  const { shopId } = await params;
  const supabase = getAdminSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "DB not configured" }, { status: 503 });
  }

  const { data: shop } = await supabase
    .from("shops")
    .select("name, line_channel_access_token, line_channel_secret")
    .eq("id", shopId)
    .single();

  if (!shop?.line_channel_access_token || !shop?.line_channel_secret) {
    return NextResponse.json(
      { error: "LINE not configured for this shop" },
      { status: 404 }
    );
  }

  const bodyText = await request.text();
  const signature = request.headers.get("x-line-signature") ?? "";

  if (!verifySignature(bodyText, signature, shop.line_channel_secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(bodyText);
  const events = body.events ?? [];

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://pitnavi.com";

  for (const event of events) {
    const lineUserId = event.source?.userId;
    if (!lineUserId) continue;

    if (event.type === "follow") {
      await supabase.from("line_followers").upsert(
        {
          shop_id: shopId,
          line_user_id: lineUserId,
          display_name: null,
          followed_at: new Date().toISOString(),
        },
        { onConflict: "shop_id,line_user_id" }
      );

      const linkUrl = `${appUrl}/line-link?shop=${shopId}&line_uid=${lineUserId}`;
      try {
        await sendLineReplyMessage(
          shop.line_channel_access_token,
          event.replyToken,
          buildFollowWelcomeMessages(shop.name, linkUrl)
        );
      } catch (e) {
        console.error("[LINE webhook] reply failed:", e);
      }

      console.log(`[LINE] New follower for shop ${shopId}: ${lineUserId}`);
    }

    if (event.type === "unfollow") {
      await supabase
        .from("line_followers")
        .delete()
        .eq("shop_id", shopId)
        .eq("line_user_id", lineUserId);

      console.log(`[LINE] Unfollowed shop ${shopId}: ${lineUserId}`);
    }
  }

  return NextResponse.json({ received: true });
}
