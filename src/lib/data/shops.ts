import { isSupabaseConfigured } from "@/lib/supabase/helpers";
import { MOCK_SHOPS, MOCK_SERVICE_MENUS, MOCK_WORK_RECORDS } from "@/lib/mock-data";
import type { Shop, ServiceMenu, WorkRecord } from "@/lib/types";

export async function getShops(): Promise<Shop[]> {
  if (!isSupabaseConfigured()) return MOCK_SHOPS;

  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data } = await supabase
    .from("shops")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  return (data as Shop[]) ?? [];
}

export async function getShopById(id: string): Promise<Shop | null> {
  if (!isSupabaseConfigured()) {
    return MOCK_SHOPS.find((s) => s.id === id) ?? null;
  }

  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data } = await supabase.from("shops").select("*").eq("id", id).single();
  return data as Shop | null;
}

export async function getServiceMenus(shopId: string): Promise<ServiceMenu[]> {
  if (!isSupabaseConfigured()) {
    return MOCK_SERVICE_MENUS.filter((m) => m.shop_id === shopId);
  }

  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data } = await supabase
    .from("service_menus")
    .select("*")
    .eq("shop_id", shopId)
    .eq("is_active", true)
    .order("category");
  return (data as ServiceMenu[]) ?? [];
}

export async function getWorkRecords(shopId: string): Promise<WorkRecord[]> {
  if (!isSupabaseConfigured()) {
    return MOCK_WORK_RECORDS.filter((r) => r.shop_id === shopId);
  }

  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data } = await supabase
    .from("work_records")
    .select("*")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });
  return (data as WorkRecord[]) ?? [];
}

export async function getAllMenus(): Promise<ServiceMenu[]> {
  if (!isSupabaseConfigured()) return MOCK_SERVICE_MENUS;

  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data } = await supabase
    .from("service_menus")
    .select("*")
    .eq("is_active", true);
  return (data as ServiceMenu[]) ?? [];
}
