import { isSupabaseConfigured } from "@/lib/supabase/helpers";
import type {
  ServiceMenu,
  WorkRecord,
  ServiceCategory,
  CarType,
  ReservationStatus,
  Reservation,
} from "@/lib/types";

export async function getMyShop(userId: string) {
  if (!isSupabaseConfigured()) return null;

  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  // 複数店舗対応: .single() → .limit(1) で最新1件を返す
  const { data } = await supabase
    .from("shops")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);
  return data?.[0] ?? null;
}

/** ユーザーの全店舗を取得（複数店舗対応） */
export async function getMyShops(userId: string) {
  if (!isSupabaseConfigured()) return [];

  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data } = await supabase
    .from("shops")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function createShop(params: {
  owner_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  description?: string;
  phone?: string;
  postal_code?: string;
}) {
  if (!isSupabaseConfigured()) return { id: `mock-${Date.now()}` };

  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("shops")
    .insert({ ...params, is_active: true })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/** 店舗情報を更新する */
export async function updateShop(
  shopId: string,
  params: {
    name?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    description?: string;
    phone?: string;
    postal_code?: string;
    specialty?: string[];
  }
) {
  if (!isSupabaseConfigured()) return { id: shopId, ...params };

  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("shops")
    .update(params)
    .eq("id", shopId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function addServiceMenu(params: {
  shop_id: string;
  category: ServiceCategory;
  name: string;
  description?: string;
  price_light: number;
  price_standard: number;
  estimated_minutes?: number;
}) {
  if (!isSupabaseConfigured()) {
    return { id: `mock-menu-${Date.now()}`, ...params };
  }

  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("service_menus")
    .insert(params)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteServiceMenu(menuId: string) {
  if (!isSupabaseConfigured()) return;

  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { error } = await supabase.from("service_menus").delete().eq("id", menuId);
  if (error) throw new Error(error.message);
}

export async function addWorkRecord(params: {
  shop_id: string;
  title: string;
  description?: string;
  category: ServiceCategory;
  car_type: CarType;
  labor_cost: number;
  duration_minutes: number;
  service_menu_id?: string;
}) {
  if (!isSupabaseConfigured()) {
    return { id: `mock-record-${Date.now()}`, ...params };
  }

  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("work_records")
    .insert(params)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function addWorkRecordPhoto(params: {
  work_record_id: string;
  storage_path: string;
  display_order: number;
}) {
  if (!isSupabaseConfigured()) return;

  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { error } = await supabase.from("work_record_photos").insert(params);
  if (error) throw new Error(error.message);
}

export async function getMyMenus(shopId: string): Promise<ServiceMenu[]> {
  if (!isSupabaseConfigured()) return [];

  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data } = await supabase
    .from("service_menus")
    .select("*")
    .eq("shop_id", shopId)
    .order("created_at");
  return (data as ServiceMenu[]) ?? [];
}

/** 全店舗のメニューをまとめて取得（オーナー用） */
export async function getAllMyMenus(shopIds: string[]): Promise<ServiceMenu[]> {
  if (!isSupabaseConfigured() || shopIds.length === 0) return [];

  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("service_menus")
    .select("*")
    .in("shop_id", shopIds)
    .order("created_at");

  if (error) {
    console.error("[getAllMyMenus]", error);
    return [];
  }
  return (data as ServiceMenu[]) ?? [];
}

export async function getMyWorkRecords(shopId: string): Promise<WorkRecord[]> {
  if (!isSupabaseConfigured()) return [];

  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data } = await supabase
    .from("work_records")
    .select("*")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });
  return (data as WorkRecord[]) ?? [];
}

export async function getMyReservations(shopId: string) {
  if (!isSupabaseConfigured()) return [];

  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("reservations")
    .select("*, service_menus(name)")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getMyReservations]", error);
    return [];
  }
  return data ?? [];
}

/** 全店舗の予約をまとめて取得（オーナー用） */
export async function getAllMyReservations(shopIds: string[]) {
  if (!isSupabaseConfigured() || shopIds.length === 0) return [];

  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("reservations")
    .select("*, service_menus(name), shops(name)")
    .in("shop_id", shopIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getAllMyReservations]", error);
    return [];
  }
  return data ?? [];
}

/** 予約のステータスを次へ進める */
export async function advanceReservationStatus(
  reservationId: string,
  newStatus: ReservationStatus,
  extra?: {
    quoted_price?: number;
    work_memo?: string;
  }
): Promise<Reservation> {
  if (!isSupabaseConfigured()) {
    return { id: reservationId, status: newStatus } as Reservation;
  }

  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();

  // タイムスタンプマッピング
  const timestampField: Partial<Record<ReservationStatus, string>> = {
    confirmed: "confirmed_at",
    visited: "visited_at",
    quoted: "quoted_at",
    contracted: "contracted_at",
    completed: "completed_at",
  };

  const updatePayload: Record<string, unknown> = {
    status: newStatus,
  };

  // タイムスタンプを自動設定
  const tsField = timestampField[newStatus];
  if (tsField) {
    updatePayload[tsField] = new Date().toISOString();
  }

  // 見積提示時は金額・メモを保存
  if (newStatus === "quoted" && extra) {
    if (extra.quoted_price !== undefined) updatePayload.quoted_price = extra.quoted_price;
    if (extra.work_memo !== undefined) updatePayload.work_memo = extra.work_memo;
  }

  const { data, error } = await supabase
    .from("reservations")
    .update(updatePayload)
    .eq("id", reservationId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // ステータス変更ログを記録
  const { data: userData } = await supabase.auth.getUser();
  if (userData?.user) {
    await supabase.from("reservation_status_logs").insert({
      reservation_id: reservationId,
      old_status: null, // 呼び出し側で設定可能
      new_status: newStatus,
      changed_by: userData.user.id,
      note: extra?.work_memo || null,
    });
  }

  return data as Reservation;
}

/** 予約を新規作成する（お客さん側から） */
export async function createReservation(params: {
  customer_id: string;
  shop_id: string;
  service_menu_id: string;
  car_type: "light" | "standard";
  preferred_date: string;
  preferred_time: string;
  customer_name: string;
  customer_phone: string;
  customer_note?: string;
  total_price: number;
  platform_fee: number;
  shop_payout: number;
}) {
  if (!isSupabaseConfigured()) {
    return { id: `mock-res-${Date.now()}`, ...params, status: "pending" };
  }

  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("reservations")
    .insert({
      ...params,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** お客様の予約一覧を取得（customer_id でフィルタ） */
export async function getCustomerReservations(customerId: string) {
  if (!isSupabaseConfigured()) return [];

  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("reservations")
    .select("*, service_menus(name, category), shops(name, address, phone)")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getCustomerReservations]", error);
    return [];
  }
  return data ?? [];
}

/** 予約をキャンセルする */
export async function cancelReservation(reservationId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { error } = await supabase
    .from("reservations")
    .update({ status: "cancelled" })
    .eq("id", reservationId);
  if (error) throw new Error(error.message);
}
