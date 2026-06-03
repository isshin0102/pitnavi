"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Shop } from "@/lib/types";

export interface MapCenter {
  lat: number;
  lng: number;
}

interface MapViewProps {
  shops: Shop[];
  center?: [number, number];
  zoom?: number;
  onShopClick?: (shop: Shop) => void;
  /** マップ移動・ズーム完了時にコールバック */
  onMoveEnd?: (center: MapCenter) => void;
  /** 選択中のショップID（ハイライト表示用） */
  selectedShopId?: string | null;
  className?: string;
}

export function MapView({
  shops,
  center = [35.6894, 139.6917],
  zoom = 12,
  onShopClick,
  onMoveEnd,
  selectedShopId,
  className = "h-64 md:h-80",
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [loaded, setLoaded] = useState(false);

  // マーカーを再描画する関数
  const updateMarkers = useCallback(
    async (map: L.Map, L: typeof import("leaflet")) => {
      // 既存マーカーを削除
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      shops.forEach((shop) => {
        const isSelected = selectedShopId === shop.id;
        const color = isSelected ? "#ef4444" : "hsl(var(--primary))";
        const size = isSelected ? 40 : 32;

        const icon = L.divIcon({
          html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="${size}" height="${size}"><path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742z" clip-rule="evenodd"/></svg>`,
          className: "leaflet-marker-custom",
          iconSize: [size, size],
          iconAnchor: [size / 2, size],
          popupAnchor: [0, -size],
        });

        const marker = L.marker([shop.latitude, shop.longitude], { icon })
          .addTo(map)
          .bindPopup(
            `<div style="min-width:140px"><strong style="font-size:13px">${shop.name}</strong><br/><span style="font-size:11px;color:#666">${shop.address}</span>${
              shop.specialty?.length
                ? `<br/><span style="font-size:10px;color:#888">${shop.specialty.slice(0, 3).join(" / ")}</span>`
                : ""
            }</div>`
          );

        if (onShopClick) {
          marker.on("click", () => onShopClick(shop));
        }

        markersRef.current.push(marker);
      });
    },
    [shops, selectedShopId, onShopClick]
  );

  // 初期マップ作成
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    let cancelled = false;

    (async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      if (cancelled || !mapRef.current) return;

      const map = L.map(mapRef.current).setView(center, zoom);
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      // マップ移動完了イベント
      if (onMoveEnd) {
        map.on("moveend", () => {
          const c = map.getCenter();
          onMoveEnd({ lat: c.lat, lng: c.lng });
        });
      }

      await updateMarkers(map, L);

      setTimeout(() => map.invalidateSize(), 100);
      setLoaded(true);
    })();

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // shops や selectedShopId が変わったらマーカー再描画
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    (async () => {
      const L = await import("leaflet");
      await updateMarkers(mapInstanceRef.current!, L);
    })();
  }, [shops, selectedShopId, updateMarkers]);

  return (
    <div className={`relative rounded-lg overflow-hidden border ${className}`}>
      <div ref={mapRef} className="h-full w-full" />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/80 text-sm text-muted-foreground">
          地図を読み込み中...
        </div>
      )}
    </div>
  );
}
