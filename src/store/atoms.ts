// src/store/atoms.ts
import { atom } from "jotai";

export type ActiveSection =
  | "observation"
  | "route"
  | "isochrone"
  | "cctv"
  | "transit"
  | null;

export const bottomSheetOpenAtom = atom<boolean>(true);
// snapPoints ["84px", 0.5, 0.9] 중 하나와 일치해야 함
export const bottomSheetSnapAtom = atom<string | number | null>(0.5);
export const activeSectionAtom = atom<ActiveSection>("observation");
