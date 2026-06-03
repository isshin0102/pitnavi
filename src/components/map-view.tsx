"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { LocateFixed } from "lucide-react";
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
  const currentLocMarkerRef = useRef<L.CircleMarker | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [locating, setLocating] = useState(false);

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

  // 現在地取得 & マップ移動
  const handleLocateMe = useCallback(async () => {
    if (!mapInstanceRef.current) return;
    if (!navigator.geolocation) {
      alert("このブラウザでは位置情報を利用できません");
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const map = mapInstanceRef.current!;
        const L = await import("leaflet");

        // マップ移動
        map.flyTo([latitude, longitude], 14, { duration: 1.2 });

        // 既存の現在地マーカーを削除
        if (currentLocMarkerRef.current) {
          currentLocMarkerRef.current.remove();
        }

        // 青い丸の現在地マーカーを追加
        const locMarker = L.circleMarker([latitude, longitude], {
          radius: 10,
          fillColor: "#3b82f6",
          fillOpacity: 0.9,
          color: "#ffffff",
          weight: 3,
          opacity: 1,
        }).addTo(map);

        locMarker.bindPopup(
          `<div style="text-align:center;font-size:12px;font-weight:600">📍 現在地</div>`
        );

        // 外側のリング（脈動アニメ風）
        L.circleMarker([latitude, longitude], {
          radius: 20,
          fillColor: "#3b82f6",
          fillOpacity: 0.15,
          color: "#3b82f6",
          weight: 1,
          opacity: 0.4,
        }).addTo(map);

        currentLocMarkerRef.current = locMarker;
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          alert("位置情報の取得が許可されていません。\nブラウザの設定から位置情報を許可してください。");
        } else {
          alert("位置情報の取得に失敗しました。");
        }
        console.error("[GPS]", err);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, []);

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

      {/* 現在地ボタン */}
      {loaded && (
        <button
          onClick={handleLocateMe}
          disabled={locating}
          className="absolute bottom-4 right-4 z-[1000] flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-lg border border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-60"
          title="現在地へ移動"
        >
          <LocateFixed className={`h-4 w-4 text-blue-500 ${locating ? "animate-pulse" : ""}`} />
          {locating ? "取得中..." : "現在地"}
        </button>
      )}

      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/80 text-sm text-muted-foreground">
          地図を読み込み中...
        </div>
      )}
    </div>
  );
}
