import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendReservationRequest } from "@/lib/email/send";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await request.json();
    const {
      shop_id,
      service_menu_id,
      car_type,
      preferred_date,
      preferred_time,
      customer_name,
      customer_phone,
      customer_note,
      total_price,
      platform_fee,
      shop_payout,
    } = body;

    const { data: reservation, error } = await supabase
      .from("reservations")
      .insert({
        customer_id: user.id,
        shop_id,
        service_menu_id,
        car_type,
        preferred_date,
        preferred_time,
        customer_name,
        customer_phone,
        customer_note: customer_note || null,
        total_price,
        platform_fee,
        shop_payout,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // メール通知
    try {
      const { data: menu } = await supabase
        .from("service_menus")
        .select("name")
        .eq("id", service_menu_id)
        .single();

      const { data: shop } = await supabase
        .from("shops")
        .select("name, owner_id")
        .eq("id", shop_id)
        .single();

      const ownerEmail = shop?.owner_id
        ? (await supabase.auth.admin.getUserById(shop.owner_id)).data?.user?.email
        : null;

      await sendReservationRequest({
        customerEmail: user.email ?? "",
        customerName: customer_name,
        shopName: shop?.name ?? "店舗",
        shopEmail: ownerEmail ?? "",
        menuName: menu?.name ?? "作業",
        date: preferred_date,
        time: preferred_time,
        price: total_price,
      });
    } catch (emailErr) {
      console.error("[API] Reservation email failed:", emailErr);
    }

    return NextResponse.json(reservation);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reservation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
