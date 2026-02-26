import type { Observation } from "@/types/observation";

/**
 * 관측 지점 배열의 논리적 동일성을 확인하기 위한 해시를 생성합니다.
 * 위도, 경도, 시각 정보만 포함하여 데이터의 변경 여부를 판단합니다.
 */
export function computeObservationsHash(observations: Observation[]): string {
  if (observations.length === 0) return "";

  // 핵심 데이터만 추출하여 정렬된 상태로 문자열화
  const relevantData = observations.map((obs) => ({
    lat: obs.lat,
    lng: obs.lng,
    time: obs.timestamp,
  }));

  return JSON.stringify(relevantData);
}
