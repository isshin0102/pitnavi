import { isSupabaseConfigured } from "@/lib/supabase/helpers";
import type { ServiceMenu, WorkRecord, ServiceCategory, CarType } from "@/lib/types";

export async function getMyShop(userId: string) {
  if (!isSupabaseConfigured()) return null;

  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data } = await supabase
    .from("shops")
    .select("*")
    .eq("owner_id", userId)
    .single();
  return data;
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
    .insert(params)
    .select("id")
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
  const { data } = await supabase
    .from("reservations")
    .select("*, service_menus(name)")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });
  return data ?? [];
}
