import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { CctvRow, RawCctvItem } from "@/types/cctv";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function mapRawToRow(item: RawCctvItem): CctvRow {
  // org_code와 MNG_NO를 조합하여 유니크 ID 생성 (동일 데이터는 자동 중복 제거)
  const uniqueId = `${item.OPN_ATMY_GRP_CD}_${item.MNG_NO}`;

  return {
    id: uniqueId,
    purpose: item.INSTL_PRPS_SE_NM || null,
    lot_address: item.LCTN_LOTNO_ADDR || null,
    road_address: item.LCTN_ROAD_NM_ADDR || null,
    manager_name: item.MNG_INST_NM || null,
    org_code: item.OPN_ATMY_GRP_CD || null,
    shot_angle: item.SHT_ANGLE_INFO || null,
    lat: Number(item.WGS84_LAT),
    lng: Number(item.WGS84_LOT),
  };
}
