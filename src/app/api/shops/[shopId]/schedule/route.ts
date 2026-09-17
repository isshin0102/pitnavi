import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  const { shopId } = await params;
  const supabase = await createClient();

  const [holidays, blocked] = await Promise.all([
    supabase
      .from("shop_regular_holidays")
      .select("*")
      .eq("shop_id", shopId)
      .order("day_of_week"),
    supabase
      .from("shop_blocked_slots")
      .select("*")
      .eq("shop_id", shopId)
      .order("blocked_date"),
  ]);

  return NextResponse.json({
    holidays: holidays.data ?? [],
    blockedSlots: blocked.data ?? [],
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  const { shopId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { data: shop } = await supabase
    .from("shops")
    .select("owner_id")
    .eq("id", shopId)
    .single();

  if (!shop || shop.owner_id !== user.id) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const body = await request.json();
  const { type } = body;

  if (type === "holiday") {
    const { day_of_week } = body;
    const { data, error } = await supabase
      .from("shop_regular_holidays")
      .insert({ shop_id: shopId, day_of_week })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  }

  if (type === "blocked_slot") {
    const { blocked_date, start_time, end_time, reason } = body;
    const { data, error } = await supabase
      .from("shop_blocked_slots")
      .insert({
        shop_id: shopId,
        blocked_date,
        start_time: start_time || null,
        end_time: end_time || null,
        reason: reason || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "無効なタイプです" }, { status: 400 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  const { shopId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { data: shop } = await supabase
    .from("shops")
    .select("owner_id")
    .eq("id", shopId)
    .single();

  if (!shop || shop.owner_id !== user.id) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  if (!type || !id) {
    return NextResponse.json(
      { error: "type と id が必要です" },
      { status: 400 }
    );
  }

  const table =
    type === "holiday" ? "shop_regular_holidays" : "shop_blocked_slots";

  const { error } = await supabase.from(table).delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
