import { Resend } from "resend";

const FROM = "ピトナビ <onboarding@resend.dev>";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  return new Resend(key);
}

interface ReservationNotifyParams {
  customerEmail: string;
  customerName: string;
  shopName: string;
  shopEmail: string;
  menuName: string;
  date: string;
  time: string;
  price: number;
}

export async function sendBookingConfirmation(params: ReservationNotifyParams) {
  const results = await Promise.allSettled([
    sendCustomerEmail(params),
    sendShopEmail(params),
  ]);

  for (const r of results) {
    if (r.status === "rejected") {
      console.error("[email] send failed:", r.reason);
    }
  }
}

async function sendCustomerEmail(p: ReservationNotifyParams) {
  await getResend().emails.send({
    from: FROM,
    to: p.customerEmail,
    subject: `【ピトナビ】予約が確定しました`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">予約確定のお知らせ</h2>
        <p>${p.customerName} 様</p>
        <p>ご予約が確定しました。当日はお気をつけて店舗へお越しください。</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">店舗</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${p.shopName}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">作業内容</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${p.menuName}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">日時</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${p.date} ${p.time}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">金額</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">¥${p.price.toLocaleString()}</td></tr>
        </table>
        <p style="color: #666; font-size: 12px;">このメールはピトナビから自動送信されています。</p>
      </div>
    `,
  });
}

async function sendShopEmail(p: ReservationNotifyParams) {
  await getResend().emails.send({
    from: FROM,
    to: p.shopEmail,
    subject: `【ピトナビ】新しい予約が入りました`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">新着予約のお知らせ</h2>
        <p>新しい予約が入りました。内容をご確認ください。</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">お客様名</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${p.customerName}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">作業内容</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${p.menuName}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">日時</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${p.date} ${p.time}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">金額</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">¥${p.price.toLocaleString()}</td></tr>
        </table>
        <p style="color: #666; font-size: 12px;">ピトナビ ダッシュボードで詳細を確認できます。</p>
      </div>
    `,
  });
}
