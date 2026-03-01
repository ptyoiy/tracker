// src/features/transit-lookup/ui/TransitNearbyPanel.tsx
"use client";

import { useAtom, useAtomValue } from "jotai";
import { AlertCircle, Crosshair, MapPin, RefreshCw } from "lucide-react";
import { viewportAtom } from "@/features/map-view/model/atoms";
import { observationsAtom } from "@/features/observation-input/model/atoms";
import { Button } from "@/shared/ui/button";
import { useTransitNearby } from "../lib/useTransitNearby";
import {
  transitLocationAtom,
  transitReferenceTimeAtom,
  transitSelectedModeAtom,
} from "../model/atoms";
import { BusStationCard } from "./BusStationCard";
import { ReferenceTimePicker } from "./ReferenceTimePicker";
import { SubwayStationCard } from "./SubwayStationCard";
import { TransitModeToggle } from "./TransitModeToggle";

export function TransitNearbyPanel() {
  const [location, setLocation] = useAtom(transitLocationAtom);
  const [, setRefTime] = useAtom(transitReferenceTimeAtom);
  const [, setMode] = useAtom(transitSelectedModeAtom);
  const observations = useAtomValue(observationsAtom);
  const viewport = useAtomValue(viewportAtom);

  const { data, isLoading, error, refetch } = useTransitNearby();

  const handleSearchAtCenter = () => {
    if (viewport?.visualCenter) {
      setLocation(viewport.visualCenter);
      // 지도 중심일 때는 기준 시각을 '현재'로 리셋
      setRefTime(null);
      setMode("auto");
    }
  };

  const handleObservationClick = (obs: {
    lat: number;
    lng: number;
    timestamp: string;
    address?: string;
    id?: string;
  }) => {
    setLocation({ lat: obs.lat, lng: obs.lng });
    // 관측 지점 선택 시 기준 시각을 해당 지점의 시각으로 자동 동기화
    setRefTime(new Date(obs.timestamp).toISOString());
    // 모드는 자동 판별되도록 auto로
    setMode("auto");
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* 1. 입력 영역 */}
      <div className="space-y-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold whitespace-nowrap">
            📍 위치:
          </span>
          <div className="flex flex-wrap gap-1.5 flex-1">
            <Button
              variant={!location && viewport ? "secondary" : "outline"}
              size="xs"
              className="h-7 text-xs"
              onClick={handleSearchAtCenter}
              disabled={!viewport}
            >
              <Crosshair className="w-3.5 h-3.5 mr-1" />
              지도 중심
            </Button>
            {observations.map((obs, idx) => (
              <Button
                key={obs.id}
                variant="outline"
                size="xs"
                className={`h-7 px-2 min-w-8 ${
                  location?.lat === obs.lat && location?.lng === obs.lng
                    ? "bg-red-50 border-red-200 text-red-600"
                    : ""
                }`}
                onClick={() => handleObservationClick(obs)}
                title={obs.address}
              >
                <MapPin
                  className={`w-3.5 h-3.5 mr-1 ${
                    location?.lat === obs.lat ? "text-red-600" : "text-gray-400"
                  }`}
                />
                {idx + 1}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold whitespace-nowrap mb-1">
            🕐 기준 시각:
          </span>
          <ReferenceTimePicker />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <div className="flex-1">
            <TransitModeToggle />
          </div>
          <Button
            size="icon"
            variant="outline"
            className="h-10 w-10 shrink-0 border-blue-200 text-blue-600 hover:bg-blue-50"
            onClick={() => refetch()}
            disabled={!location || isLoading}
            title="새로고침"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* 2. 결과 영역 */}
      <div className="overflow-y-auto flex-1 -mx-4 px-4 relative custom-scrollbar">
        {!location ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
            <MapPin className="w-8 h-8 mb-2 opacity-50 text-gray-300" />
            <p className="text-sm">
              위치를 선택하여 대중교통 현황을 확인하세요.
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium">
              대중교통 정보를 불러오고 있습니다...
            </p>
            <p className="text-xs mt-1 text-gray-400">
              경로와 시간표를 분석 중입니다.
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mb-2 opacity-80" />
            <p className="text-sm text-red-600 font-medium whitespace-pre-wrap">
              정보를 가져오는 중 오류가 발생했습니다.
            </p>
            <p className="text-xs text-gray-500 mt-1 break-all">
              {error instanceof Error ? error.message : String(error)}
            </p>
          </div>
        ) : data ? (
          <div className="pb-16 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                {data.mode === "realtime"
                  ? "실시간 도착 정보"
                  : "시간표 연동 정보"}
              </span>
              <span className="text-[10px] text-gray-500">
                기준:{" "}
                {new Date(data.referenceTime).toLocaleTimeString("ko-KR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            {/* 버스 섹션 */}
            <div className="space-y-3">
              <h3 className="font-bold flex items-center gap-1.5 text-gray-900 border-b pb-1">
                <span className="text-blue-500 text-lg">🚌</span> 버스 정류소
                <span className="text-xs font-normal text-gray-500 ml-auto">
                  {data.bus.stations.length}개 발견
                </span>
              </h3>
              {data.bus.stations.length === 0 ? (
                <div className="text-center py-6 text-sm text-gray-400 bg-gray-50 rounded-lg border border-dashed">
                  주변에 조회된 버스 정류소가 없습니다.
                </div>
              ) : (
                data.bus.stations.map((station) => (
                  <BusStationCard key={station.stationId} station={station} />
                ))
              )}
            </div>

            {/* 지하철 섹션 */}
            <div className="space-y-3">
              <h3 className="font-bold flex items-center gap-1.5 text-gray-900 border-b pb-1">
                <span className="text-orange-500 text-lg">🚇</span> 지하철역
                <span className="text-xs font-normal text-gray-500 ml-auto">
                  {data.subway.stations.length}개 발견
                </span>
              </h3>
              {data.subway.stations.length === 0 ? (
                <div className="text-center py-6 text-sm text-gray-400 bg-gray-50 rounded-lg border border-dashed">
                  주변에 조회된 지하철역이 없습니다.
                </div>
              ) : (
                data.subway.stations.map((station) => (
                  <SubwayStationCard
                    key={station.stationCode}
                    station={station}
                  />
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
