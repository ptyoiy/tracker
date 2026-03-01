import { atom } from "jotai";
import type { TransitNearbyResponse } from "./types";

// 위치 정보 (선택된 좌표)
export const transitLocationAtom = atom<{ lat: number; lng: number } | null>(
  null,
);

// 기준 시각 (ISO 8601) - null인 경우 '현재 시각' 의미
export const transitReferenceTimeAtom = atom<string | null>(null);

// 사용자 선택 모드 (auto: 자동 판별)
export const transitSelectedModeAtom = atom<"auto" | "realtime" | "timetable">(
  "auto",
);

// API 결과 데이터
export const transitResultAtom = atom<TransitNearbyResponse | null>(null);

// 로딩 및 에러 상태
export const transitLoadingAtom = atom<boolean>(false);
export const transitErrorAtom = atom<string | null>(null);
