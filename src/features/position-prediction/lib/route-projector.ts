import { computeDestinationPoint, getDistance, getRhumbLineBearing } from 'geolib';

/**
 * 주어진 경로(Polyline) 상에서 시작점으로부터 일정 거리(distance)만큼 이동했을 때의 좌표를 계산합니다.
 */
export function projectPositionOnRoute(
  route: Array<{ lat: number; lng: number }>,
  distanceMeters: number
): { lat: number; lng: number } | null {
  if (!route || route.length === 0) return null;
  if (route.length === 1) return route[0];
  if (distanceMeters <= 0) return route[0];

  let accumulatedDistance = 0;

  for (let i = 0; i < route.length - 1; i++) {
    const pt1 = route[i];
    const pt2 = route[i + 1];

    // 두 점 사이의 거리
    const segmentLength = getDistance(pt1, pt2);

    // 목표 거리가 현재 선분 내에 있는 경우
    if (accumulatedDistance + segmentLength >= distanceMeters) {
      const remainingDistance = distanceMeters - accumulatedDistance;
      const bearing = getRhumbLineBearing(pt1, pt2);

      const projected = computeDestinationPoint(pt1, remainingDistance, bearing);
      return { lat: projected.latitude, lng: projected.longitude };
    }

    accumulatedDistance += segmentLength;
  }

  // 목표 거리가 전체 경로 길이를 초과하는 경우, 경로의 마지막 점 반환
  return route[route.length - 1];
}

/**
 * 시간(초) 및 속도(km/h)를 기반으로 이동 거리를 구하여 경로 상에 투영합니다.
 */
export function projectPositionByTime(
  route: Array<{ lat: number; lng: number }>,
  speedKmh: number,
  elapsedSeconds: number
): { lat: number; lng: number } | null {
  // 속도(km/h)를 초속(m/s)으로 변환
  const speedMs = speedKmh * (1000 / 3600);
  const distance = speedMs * elapsedSeconds;

  return projectPositionOnRoute(route, distance);
}
