// src/features/map-view/ui/CCTVMarker.tsx

import { useAtom, useAtomValue } from "jotai";
import { Camera, Info, MapPinned, ShieldCheck, Target, X } from "lucide-react";
import { Circle, CustomOverlayMap, useMap } from "react-kakao-maps-sdk";
import { useFilteredCctv } from "@/features/cctv-mapping/lib/useFilteredCctv";
import {
  cctvSearchCenterAtom,
  cctvSearchRadiusAtom,
  hoveredCctvIdAtom,
} from "@/features/cctv-mapping/model/atoms";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { activePopupAtom } from "../model/atoms";

type Props = {
  onCenterChange: (center: { lat: number; lng: number }) => void;
};

export function CCTVMarkers({ onCenterChange }: Props) {
  const cctvs = useFilteredCctv();
  const searchCenter = useAtomValue(cctvSearchCenterAtom);
  const searchRadius = useAtomValue(cctvSearchRadiusAtom);
  const hoveredId = useAtomValue(hoveredCctvIdAtom);
  const [activePopup, setActivePopup] = useAtom(activePopupAtom);
  const map = useMap();

  const selectedId = activePopup?.type === "cctv" ? activePopup.id : null;
  const setSelectedId = (
    id: string | null,
    pos?: { lat: number; lng: number },
  ) => {
    if (id && pos && map) {
      setActivePopup({ type: "cctv", id });

      const proj = map.getProjection();
      const markerLatLng = new kakao.maps.LatLng(pos.lat, pos.lng);
      const markerPoint = proj.containerPointFromCoords(markerLatLng);

      // 픽셀 단위로 이동 (줌 레벨에 관계없이 동일한 시각적 거리 유지)
      // 팝업이 좌상단에 뜨므로, 마커를 화면 우하단으로 밀어냄
      const targetPoint = new kakao.maps.Point(
        markerPoint.x + 120,
        markerPoint.y + 120,
      );
      const targetLatLng = proj.coordsFromContainerPoint(targetPoint);

      onCenterChange({
        lat: targetLatLng.getLat(),
        lng: targetLatLng.getLng(),
      });
    } else {
      setActivePopup(null);
    }
  };

  // 관리번호 가독성 개선
  const formatMngNo = (id: string) => {
    if (!id) return "-";

    // 1. _ 로 분리하여 뒷부분만 취함 (지역코드 제거)
    const parts = id.split("_");
    const mainPart = parts.length > 1 ? parts[1] : parts[0];

    // 2. 예시: 202532100000800001
    // 연도(4) / 지역(7) / 구분(2) / 순번(나머지)
    // 2025 / 3210000 / 08 / 00001
    if (mainPart.length >= 13) {
      const year = mainPart.slice(0, 4);
      const region = mainPart.slice(4, 11);
      const sub = mainPart.slice(11, 13);
      const serial = mainPart.slice(13);

      return `${year} ${region} ${sub} ${serial}`;
    }

    return mainPart;
  };

  return (
    <>
      {/* 검색 반경 시각화 */}
      {searchCenter && (
        <Circle
          center={searchCenter}
          radius={searchRadius}
          strokeWeight={2}
          strokeColor="#3b82f6"
          strokeOpacity={0.8}
          strokeStyle="dash"
          fillColor="#3b82f6"
          fillOpacity={0.1}
        />
      )}

      {cctvs.map((c) => {
        const isHovered = c.id === hoveredId;
        const isSelected = c.id === selectedId;
        const isActive = isSelected || isHovered;

        return (
          <div key={c.id}>
            {/* Custom SVG Marker using CustomOverlayMap for better interaction and styling */}
            <CustomOverlayMap
              position={{ lat: c.lat, lng: c.lng }}
              zIndex={isActive ? 50 : 1}
              clickable
            >
              <button
                type="button"
                className={cn(
                  "relative flex items-center justify-center transition-all duration-200",
                  "group -translate-x-1/2 -translate-y-1/2", // 중심점 맞춤
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(c.id === selectedId ? null : c.id, {
                    lat: c.lat,
                    lng: c.lng,
                  });
                }}
              >
                {/* Expand touch target area */}
                <div className="absolute inset-0 -m-3 rounded-full" />

                {/* Marker Body */}
                <div
                  className={cn(
                    "flex items-center justify-center rounded-full shadow-lg border-2 transition-all duration-300",
                    isActive
                      ? "w-7 h-7 bg-blue-600 border-white scale-110"
                      : "w-5 h-5 bg-white border-blue-500 scale-100",
                  )}
                >
                  <Camera
                    className={cn(
                      "transition-colors duration-300",
                      isActive ? "w-4 h-4 text-white" : "w-3 h-3 text-blue-600",
                    )}
                  />
                </div>

                {/* Direction Indicator (if known) */}
                {c.direction !== "UNKNOWN" && (
                  <div
                    className={cn(
                      "absolute -top-1 right-0 w-2 h-2 rounded-full border border-white shadow-sm",
                      isActive ? "bg-orange-400" : "bg-blue-400",
                    )}
                  />
                )}
              </button>
            </CustomOverlayMap>

            {isHovered && !isSelected && (
              <CustomOverlayMap
                position={{ lat: c.lat, lng: c.lng }}
                yAnchor={2.8}
                clickable
              >
                <div className="rounded-full bg-black/80 px-2 py-0.5 text-[10px] text-white whitespace-nowrap border border-white/20 shadow-lg pointer-events-none">
                  {c.roadName || "CCTV"}
                </div>
              </CustomOverlayMap>
            )}

            {isSelected && (
              <CustomOverlayMap
                position={{ lat: c.lat, lng: c.lng }}
                xAnchor={1.1}
                yAnchor={1.1}
                zIndex={100}
                clickable={true}
              >
                <dialog
                  open
                  className="block p-0 border-none bg-transparent overflow-visible"
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setSelectedId(null);
                    }
                  }}
                >
                  <Card className="w-64 p-0 shadow-2xl border-2 border-blue-500 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <header className="bg-blue-600 px-3 py-1.5 flex items-center justify-between text-white">
                      <div className="flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5" />
                        <h3 className="text-xs font-bold uppercase tracking-wider">
                          CCTV 정보
                        </h3>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-white hover:bg-white/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(null);
                        }}
                      >
                        <X className="w-3 h-3" />
                        <span className="sr-only">닫기</span>
                      </Button>
                    </header>

                    <div className="p-3 space-y-2.5 bg-slate-50">
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1">
                          <Info className="w-2.5 h-2.5" /> 관리번호
                        </p>
                        <div className="text-sm font-mono font-black text-slate-800 tracking-tight bg-white p-1.5 rounded border border-slate-200 shadow-sm mt-0.5 break-all leading-tight">
                          {formatMngNo(c.id)}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-start gap-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-500 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-[9px] text-slate-400 font-bold uppercase">
                              관리기관
                            </p>
                            <p className="text-[11px] font-semibold text-slate-700">
                              {c.agency || "미지정"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Target className="w-3.5 h-3.5 text-orange-500 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-[9px] text-slate-400 font-bold uppercase">
                              설치 목적
                            </p>
                            <p className="text-[11px] font-semibold text-slate-700">
                              {c.purpose}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <MapPinned className="w-3.5 h-3.5 text-emerald-500 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-[9px] text-slate-400 font-bold uppercase">
                              도로/위치
                            </p>
                            <p className="text-[11px] font-semibold text-slate-700 line-clamp-2">
                              {c.roadName || "정보 없음"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <footer className="flex items-center justify-between pt-1 border-t border-slate-200">
                        <Badge
                          variant="outline"
                          className="text-[9px] h-4 px-1 bg-white"
                        >
                          {c.source === "SEOUL_OPEN_DATA"
                            ? "서울공공데이터"
                            : c.source}
                        </Badge>
                        <div className="text-[10px] font-bold text-blue-600">
                          {c.direction === "UNKNOWN"
                            ? "방향 불명"
                            : `${c.direction} 방향`}
                        </div>
                      </footer>
                    </div>
                  </Card>
                </dialog>
              </CustomOverlayMap>
            )}
          </div>
        );
      })}
    </>
  );
}
