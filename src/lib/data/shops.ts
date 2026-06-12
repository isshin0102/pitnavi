import { isSupabaseConfigured } from "@/lib/supabase/helpers";
import { MOCK_SHOPS, MOCK_SERVICE_MENUS, MOCK_WORK_RECORDS } from "@/lib/mock-data";
import type { Shop, ServiceMenu, WorkRecord } from "@/lib/types";

export async function getShops(): Promise<Shop[]> {
  if (!isSupabaseConfigured()) return MOCK_SHOPS;

  try {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    const { data, error } = await supabase
      .from("shops")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data as Shop[]) ?? [];
  } catch (e) {
    console.error("[getShops] Supabase error, falling back to mock:", e);
    return MOCK_SHOPS;
  }
}

export async function getShopById(id: string): Promise<Shop | null> {
  if (!isSupabaseConfigured()) {
    return MOCK_SHOPS.find((s) => s.id === id) ?? null;
  }

  try {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data, error } = await supabase.from("shops").select("*").eq("id", id).single();
    if (error) throw error;
    return data as Shop | null;
  } catch (e) {
    console.error("[getShopById] Supabase error, falling back to mock:", e);
    return MOCK_SHOPS.find((s) => s.id === id) ?? null;
  }
}

export async function getServiceMenus(shopId: string): Promise<ServiceMenu[]> {
  if (!isSupabaseConfigured()) {
    return MOCK_SERVICE_MENUS.filter((m) => m.shop_id === shopId);
  }

  try {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data, error } = await supabase
      .from("service_menus")
      .select("*")
      .eq("shop_id", shopId)
      .eq("is_active", true)
      .order("category");
    if (error) throw error;
    return (data as ServiceMenu[]) ?? [];
  } catch (e) {
    console.error("[getServiceMenus] Supabase error, falling back to mock:", e);
    return MOCK_SERVICE_MENUS.filter((m) => m.shop_id === shopId);
  }
}

export async function getWorkRecords(shopId: string): Promise<WorkRecord[]> {
  if (!isSupabaseConfigured()) {
    return MOCK_WORK_RECORDS.filter((r) => r.shop_id === shopId);
  }

  try {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data, error } = await supabase
      .from("work_records")
      .select("*, work_record_photos(id, storage_path, display_order)")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as WorkRecord[]) ?? [];
  } catch (e) {
    console.error("[getWorkRecords] Supabase error, falling back to mock:", e);
    return MOCK_WORK_RECORDS.filter((r) => r.shop_id === shopId);
  }
}

export async function getAllMenus(): Promise<ServiceMenu[]> {
  if (!isSupabaseConfigured()) return MOCK_SERVICE_MENUS;

  try {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data, error } = await supabase
      .from("service_menus")
      .select("*")
      .eq("is_active", true);
    if (error) throw error;
    return (data as ServiceMenu[]) ?? [];
  } catch (e) {
    console.error("[getAllMenus] Supabase error, falling back to mock:", e);
    return MOCK_SERVICE_MENUS;
  }
}
