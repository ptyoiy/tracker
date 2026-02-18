import ky from "ky";
import type { CCTV } from "@/types/cctv";

// 실제 연동 전까지는 샘플 JSON으로 시작
export async function fetchSeoulCctvSample(): Promise<CCTV[]> {
  const res = await ky.get("/cctv-sample/seoul-center.json");
  const data = (await res.json()) as {
    id: string;
    lat: number;
    lng: number;
    direction?: string;
    roadName?: string;
    agency?: string;
  }[];

  return data.map((item) => ({
    id: item.id,
    lat: item.lat,
    lng: item.lng,
    direction: (item.direction as CCTV["direction"]) ?? "UNKNOWN",
    roadName: item.roadName,
    agency: item.agency,
    source: "SEOUL_OPEN_DATA",
  }));
}
