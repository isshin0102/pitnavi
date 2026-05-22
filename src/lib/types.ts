export type ServiceCategory = "tire_change" | "oil_change" | "inspection" | "other";

export type CarType = "light" | "standard";

export type ReservationStatus =
  | "pending"      // 予約リクエスト中
  | "confirmed"    // 予約確定・来店待ち
  | "visited"      // 来店済み・見積中
  | "quoted"       // 見積提示済み
  | "contracted"   // 成約・作業確定
  | "completed"    // 作業完了
  | "cancelled";   // キャンセル

export interface Shop {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  phone: string | null;
  postal_code: string | null;
  address: string;
  latitude: number;
  longitude: number;
  image_url: string | null;
  stripe_account_id: string | null;
  stripe_onboarded: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceMenu {
  id: string;
  shop_id: string;
  category: ServiceCategory;
  name: string;
  description: string | null;
  price_light: number;
  price_standard: number;
  estimated_minutes: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkRecord {
  id: string;
  shop_id: string;
  service_menu_id: string | null;
  title: string;
  description: string | null;
  category: ServiceCategory;
  car_type: CarType;
  labor_cost: number;
  duration_minutes: number;
  created_at: string;
}

export interface WorkRecordPhoto {
  id: string;
  work_record_id: string;
  storage_path: string;
  display_order: number;
  created_at: string;
}

export interface Reservation {
  id: string;
  customer_id: string;
  shop_id: string;
  service_menu_id: string;
  car_type: CarType;
  preferred_date: string;
  preferred_time: string;
  status: ReservationStatus;
  customer_name: string;
  customer_phone: string;
  customer_note: string | null;
  total_price: number;
  platform_fee: number;
  shop_payout: number;
  stripe_payment_intent_id: string | null;
  stripe_transfer_id: string | null;
  // DAY2: 見積・ステータス管理
  quoted_price: number | null;
  work_memo: string | null;
  quoted_at: string | null;
  contracted_at: string | null;
  completed_at: string | null;
  visited_at: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReservationStatusLog {
  id: string;
  reservation_id: string;
  old_status: string | null;
  new_status: string;
  changed_by: string | null;
  note: string | null;
  created_at: string;
}

export interface PlatformFeeRule {
  id: string;
  category: ServiceCategory;
  car_type: CarType | null;
  fee_amount: number;
  created_at: string;
  updated_at: string;
}

export const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  tire_change: "タイヤ交換",
  oil_change: "オイル交換",
  inspection: "車検",
  other: "その他",
};

export const CAR_TYPE_LABELS: Record<CarType, string> = {
  light: "軽自動車",
  standard: "普通車",
};

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: "予約リクエスト中",
  confirmed: "来店待ち",
  visited: "来店済み",
  quoted: "見積提示済み",
  contracted: "成約",
  completed: "作業完了",
  cancelled: "キャンセル",
};

/** ステータスの遷移順序（業務フロー） */
export const STATUS_FLOW: ReservationStatus[] = [
  "pending",
  "confirmed",
  "visited",
  "quoted",
  "contracted",
  "completed",
];

/** 各ステータスから次に進めるステータス */
export const NEXT_STATUS_MAP: Partial<Record<ReservationStatus, ReservationStatus>> = {
  pending: "confirmed",
  confirmed: "visited",
  visited: "quoted",
  quoted: "contracted",
  contracted: "completed",
};

/** 次のステータスに進めるボタンラベル */
export const ADVANCE_BUTTON_LABELS: Partial<Record<ReservationStatus, string>> = {
  pending: "予約を確定する",
  confirmed: "来店済みにする",
  visited: "見積もりを提示する",
  quoted: "成約にする",
  contracted: "作業完了にする",
};
