import { Polyline } from "react-kakao-maps-sdk";
import { useSelectedRoutes } from "@/features/route-analysis/lib/useSelectedRoutes";

const COLORS = ["#4A90E2", "#E24A4A", "#4AE290"];

export function RoutePolyline() {
  const routes = useSelectedRoutes();

  if (!routes.length) return null;

  return (
    <>
      {routes.map((route, idx) => {
        const color = COLORS[idx % COLORS.length];

        // legs를 하나의 path로 이어 붙이는 예시
        const path = route.legs.flatMap((leg) => leg.polyline);

        return (
          <Polyline
            key={route.id}
            path={path} // {lat,lng}[] 그대로 사용
            strokeWeight={5}
            strokeColor={color}
            strokeOpacity={0.8}
            strokeStyle="solid"
          />
        );
      })}
    </>
  );
}
