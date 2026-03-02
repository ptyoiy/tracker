import { useSelectedRoutes } from "@/features/route-analysis/lib/useSelectedRoutes";
import type { RouteLegMode } from "@/types/analyze";
import { Repeat } from "lucide-react";
import { CustomOverlayMap, Polyline } from "react-kakao-maps-sdk";

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
) {
  if (mode === "WALK") {
    return {
      strokeColor: "#6B7280", // 회색
      strokeWeight: 5,
      strokeStyle: "dash" as const,
    };
  }
  if (mode === "SUBWAY") {
    return {
      strokeColor: getSubwayColor(routeNumber),
      strokeWeight: 6,
      strokeStyle: "solid" as const,
    };
  }
  if (mode === "BUS") {
    // 버스의 경우, 우선은 제공된 고유 라인 색상을 따름
    return {
      strokeColor: defaultColor,
      strokeWeight: 5,
      strokeStyle: "solid" as const,
    };
  }
  // CAR 또는 기타
  return {
    strokeColor: defaultColor, // 해당 옵션의 대표 색상
    strokeWeight: 5,
    strokeStyle: "solid" as const,
  };
}

export function RoutePolyline() {
  const routes = useSelectedRoutes();

  if (!routes.length) return null;

  return (
    <>
      {routes.map((route, idx) => {
        const baseColor = DEFAULT_COLORS[idx % DEFAULT_COLORS.length];

        return (
          <div key={route.id}>
            {route.legs.map((leg, legIdx) => {
              if (leg.polyline.length === 0) return null;

              const style = getPolylineStyle(leg.mode, baseColor, leg.route);
              const isLastLeg = legIdx === route.legs.length - 1;
              const transitionPoint = !isLastLeg
                ? leg.polyline[leg.polyline.length - 1]
                : null;

              return (
                <div key={`${route.id}-leg-${legIdx}`}>
                  <Polyline
                    path={leg.polyline} // 해당 leg의 점들만
                    strokeWeight={style.strokeWeight}
                    strokeColor={style.strokeColor}
                    strokeOpacity={0.8}
                    strokeStyle={style.strokeStyle}
                  />
                  {transitionPoint && (
                    <CustomOverlayMap
                      position={{
                        lat: transitionPoint.lat,
                        lng: transitionPoint.lng,
                      }}
                    >
                      <div className="w-5 h-5 flex items-center justify-center bg-white border-2 border-gray-400 rounded-full shadow-sm z-10 box-border -translate-x-1/2 -translate-y-1/2">
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
