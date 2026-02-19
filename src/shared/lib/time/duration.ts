import type { IsoDateTimeString } from "@/types/common";

export function getDurationSeconds(
  from: IsoDateTimeString,
  to: IsoDateTimeString,
): number {
  const start = new Date(from).getTime();
  const end = new Date(to).getTime();
  return Math.max(0, Math.round((end - start) / 1000));
}
