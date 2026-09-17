const LINE_API_BASE = "https://api.line.me/v2/bot";

interface LineMessage {
  type: "text";
  text: string;
}

export async function sendLinePushMessage(
  channelAccessToken: string,
  lineUserId: string,
  messages: LineMessage[]
) {
  const res = await fetch(`${LINE_API_BASE}/message/push`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${channelAccessToken}`,
    },
    body: JSON.stringify({
      to: lineUserId,
      messages,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[LINE] push message failed:", res.status, body);
    throw new Error(`LINE push failed: ${res.status}`);
  }
}

export async function sendLineReplyMessage(
  channelAccessToken: string,
  replyToken: string,
  messages: LineMessage[]
) {
  const res = await fetch(`${LINE_API_BASE}/message/reply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${channelAccessToken}`,
    },
    body: JSON.stringify({
      replyToken,
      messages,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[LINE] reply message failed:", res.status, body);
  }
}

interface ReservationLineParams {
  customerName: string;
  shopName: string;
  menuName: string;
  date: string;
  time: string;
  price: number;
}

export function buildReservationNotificationMessages(
  p: ReservationLineParams
): LineMessage[] {
  return [
    {
      type: "text",
      text: [
        "🔧 予約が確定しました！",
        "",
        `${p.customerName} 様`,
        "",
        `📍 店舗: ${p.shopName}`,
        `🔩 作業: ${p.menuName}`,
        `📅 日時: ${p.date} ${p.time}`,
        `💰 金額: ¥${p.price.toLocaleString()}`,
        "",
        "当日はお気をつけて店舗へお越しください。",
      ].join("\n"),
    },
  ];
}

export function buildFollowWelcomeMessages(
  shopName: string,
  linkUrl: string
): LineMessage[] {
  return [
    {
      type: "text",
      text: [
        `${shopName}のLINEアカウントを友だち追加いただきありがとうございます！`,
        "",
        "ピトナビで予約すると、こちらのLINEに通知が届くようになります。",
        "",
        "👇 ピトナビアカウントと連携する",
        linkUrl,
      ].join("\n"),
    },
  ];
}
