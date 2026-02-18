import { atom } from "jotai";
import type { CCTV } from "@/types/cctv";

export const allCctvAtom = atom<CCTV[]>([]);

export const filteredCctvAtom = atom<CCTV[]>((get) => {
  // 1차 버전: 아직 buffer-filter 적용 전, 전부 반환
  return get(allCctvAtom);
});
