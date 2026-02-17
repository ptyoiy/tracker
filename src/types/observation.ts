// src/types/observation.ts
import type { IsoDateTimeString, LatLng } from "./common";

// 관측 지점 (observation-input)
export type Observation = LatLng & {
  timestamp: IsoDateTimeString;
  address?: string;
};
