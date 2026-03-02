import { useSelectedRoutes } from "@/features/route-analysis/lib/useSelectedRoutes";
import { analysisResultAtom } from "@/features/route-analysis/model/atoms";
import type { RouteLegMode } from "@/types/analyze";
import { useAtomValue } from "jotai";
import { Repeat } from "lucide-react";
import { CustomOverlayMap, Polyline } from "react-kakao-maps-sdk";
import { hoveredRouteIdAtom } from "../model/atoms";

const DEFAULT_COLORS = ["#4A90E2", "#E24A4A", "#4AE290"];

// 210 트래커 지정 호선 색상 파싱
function getSubwayColor(route?: string): string {
  if (!route) return "#999999";
  if (route.includes("1호선")) return "#0052A4";
  if (route.includes("2호선")) return "#00A84D";
  if (route.includes("3호선")) return "#EF7C1C";
  if (route.includes("4호선")) return "#00A5DE";
  if (route.includes("5호선")) return "#996CAC";
  if (route.includes("6호선")) return "#CD7C2F";
  if (route.includes("7호선")) return "#747F00";
  if (route.includes("8호선")) return "#EA545D";
  if (route.includes("9호선")) return "#BDB092";
  if (route.includes("신분당선")) return "#D4003B";
  if (route.includes("분당선")) return "#F5A200";
  if (route.includes("수인분당선")) return "#F5A200";
  if (route.includes("경의중앙선")) return "#77C4A3";
  return "#999999"; // 기본 회색 (예외)
}

function getPolylineStyle(
  mode: RouteLegMode,
  defaultColor: string,
  routeNumber?: string,
  isHovered = false,
  isFaded = false,
) {
  const highlightMult = isHovered ? 1.5 : 1;
  const opacity = isFaded ? 0.3 : 0.8;
  const weightBase = mode === "WALK" ? 5 : mode === "SUBWAY" ? 6 : 5;

  let strokeColor = defaultColor;
  if (mode === "WALK") strokeColor = "#6B7280";
  else if (mode === "SUBWAY") strokeColor = getSubwayColor(routeNumber);

  return {
    strokeColor,
    strokeWeight: weightBase * highlightMult,
    strokeStyle: mode === "WALK" ? ("dash" as const) : ("solid" as const),
    strokeOpacity: opacity,
  };
}

export function RoutePolyline() {
  const routes = useSelectedRoutes();
  const hoveredRouteId = useAtomValue(hoveredRouteIdAtom);
  const analysisResult = useAtomValue(analysisResultAtom);

  if (!routes.length || analysisResult.stale) return null;

  const isHoveredRouteRendered = routes.some((r) => r.id === hoveredRouteId);

  return (
    <>
      {routes.map((route, idx) => {
        const baseColor = DEFAULT_COLORS[idx % DEFAULT_COLORS.length];

        // 특정 노선이 hover 되었고, 이 노선이 hover된 노선이 아니면 흐리게(isFaded) 표시
        // 단, hover 된 노선이 현재 그려지고 있는 노선(isHoveredRouteRendered)일 때만 흐림 처리 적용
        const isHovered = route.id === hoveredRouteId;
        const isFaded =
          isHoveredRouteRendered && hoveredRouteId !== null && !isHovered;

        return (
          <div key={route.id}>
            {route.legs.map((leg, legIdx) => {
              if (leg.polyline.length === 0) return null;

              const style = getPolylineStyle(
                leg.mode,
                baseColor,
                leg.route,
                isHovered,
                isFaded,
              );
              const isLastLeg = legIdx === route.legs.length - 1;
              const transitionPoint = !isLastLeg
                ? leg.polyline[leg.polyline.length - 1]
                : null;

              return (
                <div key={`${route.id}-leg-${legIdx}`}>
                  <Polyline
                    path={leg.polyline}
                    strokeWeight={style.strokeWeight}
                    strokeColor={style.strokeColor}
                    strokeOpacity={style.strokeOpacity}
                    strokeStyle={style.strokeStyle}
                    zIndex={isHovered ? 100 : leg.mode === "WALK" ? 10 : 20}
                  />
                  {transitionPoint && (
                    <CustomOverlayMap
                      position={{
                        lat: transitionPoint.lat,
                        lng: transitionPoint.lng,
                      }}
                      zIndex={isHovered ? 110 : 30}
                    >
                      <div
                        className={`w-5 h-5 flex items-center justify-center bg-white border-2 border-gray-400 rounded-full shadow-sm box-border -translate-x-1/2 -translate-y-1/2 transition-opacity ${isFaded ? "opacity-30" : "opacity-100"}`}
                      >
                        <Repeat className="w-3 h-3 text-gray-500" />
                      </div>
                    </CustomOverlayMap>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </>
  );
}
