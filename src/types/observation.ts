import type { IsoDateTimeString, LatLng } from "./common";

// 관측 지점 (observation-input)
export type Observation = LatLng & {
  id: string;
  timestamp: IsoDateTimeString;
  address?: string;
  label?: string;
};
