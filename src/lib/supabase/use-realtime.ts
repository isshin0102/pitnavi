"use client";

import { useEffect, useRef } from "react";
import { isSupabaseConfigured } from "./helpers";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Supabase Realtime で reservations テーブルの変更をリッスンするフック
 *
 * @param filter - Postgres の eq フィルタ（例: "shop_id=eq.xxx" or "customer_id=eq.xxx"）
 * @param onUpdate - UPDATE イベント時のコールバック（new row を受け取る）
 * @param onInsert - INSERT イベント時のコールバック（任意）
 */
export function useReservationRealtime(
  filter: string | null,
  onUpdate: (payload: any) => void,
  onInsert?: (payload: any) => void
) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!filter || !isSupabaseConfigured()) return;

    let cancelled = false;

    (async () => {
      const { createClient } = await import("./client");
      const supabase = createClient();

      if (cancelled) return;

      const channel = supabase
        .channel(`reservations:${filter}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "reservations",
            filter,
          },
          (payload) => {
            if (!cancelled) {
              onUpdate(payload.new);
            }
          }
        );

      if (onInsert) {
        channel.on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "reservations",
            filter,
          },
          (payload) => {
            if (!cancelled) {
              onInsert(payload.new);
            }
          }
        );
      }

      channel.subscribe();
      channelRef.current = channel;
    })();

    return () => {
      cancelled = true;
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);
}
