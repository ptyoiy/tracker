"use client";

import { observationsAtom } from "@/features/observation-input/model/atoms";
import {
  type LocationResult,
  LocationSearch,
} from "@/features/observation-input/ui/LocationSearch";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { useAtom } from "jotai";
import { Clock, MapPin, X } from "lucide-react";
import { CustomOverlayMap, MapMarker, useMap } from "react-kakao-maps-sdk";
import { activePopupAtom } from "../model/atoms";

type Props = {
  index: number;
  onCenterChange: (center: { lat: number; lng: number }) => void;
};

export function ObservationMarker({ index, onCenterChange }: Props) {
  const [observations, setObservations] = useAtom(observationsAtom);
  const [activePopup, setActivePopup] = useAtom(activePopupAtom);
  const map = useMap();
  const obs = observations[index];

  if (!obs) return null;

  const isOpen =
    activePopup?.type === "observation" && activePopup.index === index;
  const setIsOpen = (open: boolean) => {
    if (open && map) {
      setActivePopup({ type: "observation", index });

      const proj = map.getProjection();
      const markerLatLng = new kakao.maps.LatLng(obs.lat, obs.lng);
      const markerPoint = proj.containerPointFromCoords(markerLatLng);

      // 팝업이 우하단에 뜨므로, 마커를 화면 좌상단으로 밀어냄
      const targetPoint = new kakao.maps.Point(
        markerPoint.x + 120,
        markerPoint.y + 160,
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

  const handleUpdate = (field: keyof typeof obs, value: any) => {
    setObservations((prev) =>
      prev.map((o, i) => (i === index ? { ...o, [field]: value } : o)),
    );
  };

  const handleSelect = (r: LocationResult) => {
    setObservations((prev) =>
      prev.map((o, i) =>
        i === index
          ? {
              ...o,
              label: r.label,
              address: r.address,
              lat: r.lat,
              lng: r.lng,
            }
          : o,
      ),
    );
  };

  const handleDelete = () => {
    setObservations((prev) => prev.filter((_, i) => i !== index));
    setIsOpen(false);
  };

  // ISO string -> datetime-local format (YYYY-MM-DDThh:mm)
  const toLocalDatetime = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 16);
  };

  return (
    <>
      <MapMarker
        position={{ lat: obs.lat, lng: obs.lng }}
        onClick={() => setIsOpen(true)}
        zIndex={10}
      />

      <CustomOverlayMap
        position={{ lat: obs.lat, lng: obs.lng }}
        xAnchor={0.5}
        yAnchor={1.6}
        zIndex={11}
        clickable
      >
        <Button
          className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold shadow-lg border-2 border-white cursor-pointer hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          onClick={() => setIsOpen(true)}
        >
          {index + 1}
        </Button>
      </CustomOverlayMap>

      {isOpen && (
        <CustomOverlayMap
          position={{ lat: obs.lat, lng: obs.lng }}
          xAnchor={0}
          yAnchor={0}
          zIndex={100}
          clickable
        >
          <dialog
            open
            className="block p-0 border-none bg-transparent overflow-visible"
          >
            <Card className="w-72 p-0 shadow-2xl border-2 overflow-hidden animate-in fade-in zoom-in duration-200">
              <header className="bg-primary px-3 py-2 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <h3 className="text-sm font-bold">지점 #{index + 1} 수정</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                >
                  <X className="w-4 h-4" />
                  <span className="sr-only">닫기</span>
                </Button>
              </header>

              <div className="p-3 space-y-3 bg-white">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-muted-foreground font-bold">
                    장소명 / 주소
                  </Label>
                  <LocationSearch
                    id={`popup-address-${index}`}
                    value={obs.label || ""}
                    onChange={(v) => handleUpdate("label", v)}
                    onSelect={handleSelect}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-muted-foreground font-bold">
                      위도
                    </Label>
                    <Input
                      type="number"
                      value={obs.lat}
                      onChange={(e) =>
                        handleUpdate("lat", parseFloat(e.target.value))
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-muted-foreground font-bold">
                      경도
                    </Label>
                    <Input
                      type="number"
                      value={obs.lng}
                      onChange={(e) =>
                        handleUpdate("lng", parseFloat(e.target.value))
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-muted-foreground font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 시간
                  </Label>
                  <Input
                    type="datetime-local"
                    value={toLocalDatetime(obs.timestamp)}
                    onChange={(e) =>
                      handleUpdate(
                        "timestamp",
                        new Date(e.target.value).toISOString(),
                      )
                    }
                    className="h-8 text-xs"
                  />
                </div>

                <footer className="pt-2 flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete();
                    }}
                  >
                    지점 삭제
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(false);
                    }}
                  >
                    닫기
                  </Button>
                </footer>
              </div>
            </Card>
          </dialog>
        </CustomOverlayMap>
      )}
    </>
  );
}
