import { differenceInSeconds } from "date-fns";
import { getDistance } from "geolib";
import type { Observation } from "@/types/analyze";

export function analyzeSegment(from: Observation, to: Observation) {
  const distance = getDistance(
    { latitude: from.lat, longitude: from.lng },
    { latitude: to.lat, longitude: to.lng },
  ); // 미터

  const duration = differenceInSeconds(
    new Date(to.timestamp),
    new Date(from.timestamp),
  ); // 초

  const avgSpeed = distance / 1000 / (duration / 3600); // km/h

  // 교통수단 1차 판정
  let transportMode: "walking" | "vehicle" | "transit";
  if (avgSpeed < 6) {
    transportMode = "walking";
  } else if (avgSpeed < 15) {
    transportMode = "transit"; // 버스/자전거
  } else {
    transportMode = "vehicle";
  }

  return { distance, duration, avgSpeed, transportMode };
}
